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
// Default to 50 MB to allow Pro conversions (Free is strictly capped at 10 MB in token gate)
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);
const MAX_CONCURRENT_CONVERSIONS = parseInt(process.env.MAX_CONCURRENT_CONVERSIONS || '3', 10);

let activeConversions = 0;
let totalProcessed = 0;
let totalErrors = 0;

// CORS setup with exposed custom headers
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
    exposedHeaders: [
      'x-conversion-receipt',
      'x-conversion-reservation-id',
      'x-conversion-file-size',
      'Content-Disposition',
      'Content-Length',
    ],
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
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
    return next();
  }

  const authHeader = req.headers['authorization'] || '';
  const signature = authHeader.replace(/^Bearer\s+/i, '') || req.headers['x-conversion-signature'];
  const timestamp = req.headers['x-conversion-timestamp'];
  const reservationId = req.headers['x-conversion-reservation-id'] || '';

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

  const sigBuf = Buffer.from(signature);

  // 1. Check reservation claims HMAC signature (primary security method)
  if (reservationId) {
    const operationId = req.headers['x-conversion-operation'] || 'word-to-pdf';
    const isPro = req.headers['x-conversion-pro'] === 'true';
    const maxBytes = parseInt(req.headers['x-conversion-max-bytes'] || '0', 10);

    const payload = `${reservationId}:${operationId}:${isPro}:${maxBytes}:${timestamp}`;
    const expectedWithClaims = crypto
      .createHmac('sha256', WORKER_SECRET)
      .update(payload)
      .digest('hex');

    const expBuf1 = Buffer.from(expectedWithClaims);
    if (sigBuf.length === expBuf1.length && crypto.timingSafeEqual(sigBuf, expBuf1)) {
      req.reservationId = reservationId;
      req.maxAllowedBytes = maxBytes;
      return next();
    }
  }

  // 2. Fallback check for basic convert:timestamp token (backward compatibility)
  const expectedBasic = crypto
    .createHmac('sha256', WORKER_SECRET)
    .update(`convert:${timestamp}`)
    .digest('hex');

  const expBuf2 = Buffer.from(expectedBasic);
  if (sigBuf.length === expBuf2.length && crypto.timingSafeEqual(sigBuf, expBuf2)) {
    req.reservationId = reservationId || crypto.randomUUID();
    return next();
  }

  return res.status(403).json({
    error: 'Firma de autorizacion invalida.',
  });
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
      totalProcessed,
      totalErrors,
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

    // Verify file size against token claim if provided
    if (req.maxAllowedBytes && req.file.size > req.maxAllowedBytes) {
      if (req.conversionTempDir && fs.existsSync(req.conversionTempDir)) {
        fs.rmSync(req.conversionTempDir, { recursive: true, force: true });
      }
      return res.status(400).json({
        error: `El archivo supera el tamaño máximo autorizado de ${(req.maxAllowedBytes / (1024 * 1024)).toFixed(0)} MB.`,
      });
    }

    activeConversions++;
    const tempDir = req.conversionTempDir;
    const inputFilePath = req.file.path;
    const originalExt = path.extname(req.file.originalname).toLowerCase();
    const originalBasename = path.basename(req.file.originalname, originalExt);

    // Parse options from header if sent (e.g. for Excel)
    let conversionOptions = {};
    try {
      if (req.headers['x-conversion-options']) {
        conversionOptions = JSON.parse(req.headers['x-conversion-options']);
      }
    } catch {
      // Ignore parse error
    }

    // LibreOffice Calc Filter and configuration
    const isSpreadsheet = ['.xls', '.xlsx', '.ods'].includes(originalExt);
    let filterOption = 'pdf';

    if (isSpreadsheet) {
      // Build calc filter string
      const calcFilterOpts = {};
      if (conversionOptions.orientation === 'landscape') {
        calcFilterOpts.IsLandscape = { type: 'boolean', value: 'true' };
      }
      if (conversionOptions.fitToPage) {
        calcFilterOpts.SinglePageSheets = { type: 'boolean', value: 'true' };
      }

      if (Object.keys(calcFilterOpts).length > 0) {
        filterOption = `pdf:calc_pdf_Export:${JSON.stringify(calcFilterOpts)}`;
      } else {
        filterOption = 'pdf:calc_pdf_Export';
      }
    }

    const sofficeCmd = getSofficeCommand();
    const args = [
      '--headless',
      '--convert-to',
      filterOption,
      '--outdir',
      tempDir,
      inputFilePath,
    ];

    const conversionTimeoutMs = 60000;

    execFile(
      sofficeCmd,
      args,
      {
        timeout: conversionTimeoutMs,
        maxBuffer: 15 * 1024 * 1024,
      },
      (convErr, stdout, stderr) => {
        activeConversions--;

        if (convErr) {
          totalErrors++;
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
          });
        }

        // Locate output PDF in temp directory
        const generatedBase = path.basename(inputFilePath, originalExt);
        const expectedPdfPath = path.join(tempDir, `${generatedBase}.pdf`);

        if (!fs.existsSync(expectedPdfPath)) {
          totalErrors++;
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
          return res.status(500).json({
            error: 'La conversion finalizo pero no se genero el archivo PDF de salida.',
          });
        }

        totalProcessed++;
        const stat = fs.statSync(expectedPdfPath);
        const outFileSize = stat.size;
        const reservationId = req.reservationId || 'anon-res';

        // Generate cryptographic completion receipt
        const receipt = crypto
          .createHmac('sha256', WORKER_SECRET)
          .update(`receipt:${reservationId}:${outFileSize}`)
          .digest('hex');

        const safeDownloadName = `${originalBasename.replace(/[^a-zA-Z0-9_\u00C0-\u017F.-]/g, '_') || 'documento'}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', String(outFileSize));
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(safeDownloadName)}"`
        );
        res.setHeader('x-conversion-receipt', receipt);
        res.setHeader('x-conversion-reservation-id', reservationId);
        res.setHeader('x-conversion-file-size', String(outFileSize));

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

// Periodic reaper for orphan temporary directories older than 15 minutes
function cleanupOrphanTempDirs() {
  try {
    const tmpBase = os.tmpdir();
    const entries = fs.readdirSync(tmpBase, { withFileTypes: true });
    const now = Date.now();
    const MAX_AGE_MS = 15 * 60 * 1000;
    let cleaned = 0;

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('pc-conv-')) {
        const fullPath = path.join(tmpBase, entry.name);
        try {
          const stats = fs.statSync(fullPath);
          if (now - stats.mtimeMs > MAX_AGE_MS) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            cleaned++;
          }
        } catch {
          // File may be in use
        }
      }
    }
    if (cleaned > 0) {
      console.log(`[reaper] Limpieza completada: se eliminaron ${cleaned} directorios temporales huérfanos.`);
    }
  } catch (err) {
    console.error('[reaper] Error al limpiar temporales:', err.message);
  }
}

cleanupOrphanTempDirs();
const reaperInterval = setInterval(cleanupOrphanTempDirs, 5 * 60 * 1000);

const server = app.listen(PORT, () => {
  console.log(`[playcomun-conversion-worker] Servidor iniciado en puerto ${PORT}`);
  console.log(`[playcomun-conversion-worker] Comando LibreOffice configurado: ${getSofficeCommand()}`);
});

function gracefulShutdown(signal) {
  console.log(`[worker] Recibida señal ${signal}. Limpiando y cerrando servidor...`);
  clearInterval(reaperInterval);
  cleanupOrphanTempDirs();
  server.close(() => {
    console.log('[worker] Servidor cerrado correctamente.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
