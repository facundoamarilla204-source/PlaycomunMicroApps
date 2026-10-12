const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const WORKER_SECRET = process.env.WORKER_SECRET || 'playcomun-dev-secret-change-in-prod';
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10);
const MAX_CONCURRENT_CONVERSIONS = parseInt(process.env.MAX_CONCURRENT_CONVERSIONS || '3', 10);

let activeConversions = 0;

// CORS setup
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origen no permitido por CORS'));
    },
  })
);

app.use(express.json());

// Allowed input extensions and MIME types
const ALLOWED_EXTENSIONS = new Set([
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.odt',
  '.ods',
  '.odp',
]);

const ALLOWED_MIME_TYPES = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'application/octet-stream', // Fallback for some browsers on Windows
]);

// Helper to find soffice executable
function getSofficeCommand() {
  if (process.env.SOFFICE_PATH && fs.existsSync(process.env.SOFFICE_PATH)) {
    return process.env.SOFFICE_PATH;
  }
  // Linux container default
  if (fs.existsSync('/usr/bin/soffice')) {
    return '/usr/bin/soffice';
  }
  // Windows typical paths
  const winPaths = [
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  ];
  for (const wp of winPaths) {
    if (fs.existsSync(wp)) {
      return wp;
    }
  }
  return 'soffice';
}

// Temporary directory for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-conv-'));
    req.conversionTempDir = tempDir;
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeRandomName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeRandomName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new Error(`Extension "${ext}" no permitida. Formatos soportados: doc, docx, xls, xlsx, ppt, pptx, odt, ods, odp.`)
      );
    }
    cb(null, true);
  },
});

// Middleware to verify short-lived HMAC authorization
function verifyAuth(req, res, next) {
  // If no secret configured or bypass in explicit dev flag
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
    return next();
  }

  const authHeader = req.headers['authorization'] || '';
  const signature = authHeader.replace(/^Bearer\s+/i, '') || req.headers['x-conversion-signature'];
  const timestamp = req.headers['x-conversion-timestamp'];

  if (!signature || !timestamp) {
    return res.status(401).json({
      error: 'Autorizacion requerida. Falta firma o timestamp en la solicitud.',
    });
  }

  const reqTime = parseInt(timestamp, 10);
  const now = Date.now();
  // Valid within 5 minutes window
  if (isNaN(reqTime) || Math.abs(now - reqTime) > 5 * 60 * 1000) {
    return res.status(401).json({
      error: 'La autorizacion de conversion ha expirado o no es valida.',
    });
  }

  // Calculate expected HMAC
  const expectedHmac = crypto
    .createHmac('sha256', WORKER_SECRET)
    .update(`convert:${timestamp}`)
    .digest('hex');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedHmac);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return res.status(403).json({
      error: 'Firma de autorizacion invalida.',
    });
  }

  next();
}

// Health check endpoint
app.get('/health', (req, res) => {
  const sofficeCmd = getSofficeCommand();

  execFile(sofficeCmd, ['--version'], (err, stdout) => {
    const sofficeAvailable = !err;
    const versionString = sofficeAvailable ? stdout.trim() : 'No disponible en el sistema';

    res.json({
      status: 'ok',
      service: 'playcomun-conversion-worker',
      sofficeAvailable,
      sofficeVersion: versionString,
      activeConversions,
      maxConcurrent: MAX_CONCURRENT_CONVERSIONS,
      timestamp: Date.now(),
    });
  });
});

// Conversion endpoint: POST /convert
app.post('/convert', verifyAuth, (req, res) => {
  if (activeConversions >= MAX_CONCURRENT_CONVERSIONS) {
    return res.status(503).json({
      error: 'El servicio esta temporalmente al maximo de capacidad concurrente. Por favor reintenta en unos instantes.',
    });
  }

  upload.single('file')(req, res, async (uploadErr) => {
    if (uploadErr) {
      if (req.conversionTempDir && fs.existsSync(req.conversionTempDir)) {
        fs.rmSync(req.conversionTempDir, { recursive: true, force: true });
      }
      return res.status(400).json({
        error: uploadErr.message || 'Error al procesar el archivo recibido.',
      });
    }

    if (!req.file) {
      if (req.conversionTempDir && fs.existsSync(req.conversionTempDir)) {
        fs.rmSync(req.conversionTempDir, { recursive: true, force: true });
      }
      return res.status(400).json({ error: 'No se recibio ningun archivo para convertir.' });
    }

    activeConversions++;
    const tempDir = req.conversionTempDir;
    const inputFilePath = req.file.path;
    const originalExt = path.extname(req.file.originalname).toLowerCase();
    const originalBasename = path.basename(req.file.originalname, originalExt);

    // Filter/Print options if passed (e.g. for Excel)
    // LibreOffice Calc supports filter options like pdf:calc_pdf_Export
    const isSpreadsheet = ['.xls', '.xlsx', '.ods'].includes(originalExt);
    const filterOption = isSpreadsheet ? 'pdf:calc_pdf_Export' : 'pdf';

    const sofficeCmd = getSofficeCommand();
    const args = [
      '--headless',
      '--convert-to',
      filterOption,
      '--outdir',
      tempDir,
      inputFilePath,
    ];

    const conversionTimeoutMs = 45000;

    const child = execFile(
      sofficeCmd,
      args,
      {
        timeout: conversionTimeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      },
      (convErr, stdout, stderr) => {
        activeConversions--;

        if (convErr) {
          // Cleanup on error
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }

          if (convErr.killed) {
            return res.status(408).json({
              error: 'El documento tardo demasiado tiempo en procesarse (tiempo de espera agotado).',
            });
          }

          console.error('Error de ejecucion LibreOffice:', stderr || convErr.message);
          return res.status(500).json({
            error: 'No se pudo convertir el documento. El archivo puede estar protegido con contraseña o dañado.',
            detail: process.env.NODE_ENV === 'development' ? convErr.message : undefined,
          });
        }

        // Locate output PDF in temp directory
        const generatedBase = path.basename(inputFilePath, originalExt);
        const expectedPdfPath = path.join(tempDir, `${generatedBase}.pdf`);

        if (!fs.existsSync(expectedPdfPath)) {
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
          return res.status(500).json({
            error: 'La conversion finalizo pero no se genero el archivo PDF de salida.',
          });
        }

        const safeDownloadName = `${originalBasename || 'documento'}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(safeDownloadName)}"`
        );

        const readStream = fs.createReadStream(expectedPdfPath);

        readStream.on('error', (streamErr) => {
          console.error('Error enviando stream:', streamErr);
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
        });

        readStream.on('close', () => {
          // Cleanup all temporary files upon response finish
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
        });

        readStream.pipe(res);
      }
    );
  });
});

app.listen(PORT, () => {
  console.log(`[playcomun-conversion-worker] Servidor iniciado en puerto ${PORT}`);
  console.log(`[playcomun-conversion-worker] Comando LibreOffice configurado: ${getSofficeCommand()}`);
});
