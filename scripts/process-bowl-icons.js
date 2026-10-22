const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\Facundo-PC\\.gemini\\antigravity-ide\\brain\\d5187d0f-f23d-4872-9970-58b50eb0a5f4\\.user_uploaded\\media_1792639959475.png';
const targetDir = path.join(process.cwd(), 'public', 'amasia');

async function processIcons() {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. Guardar original limpio (bowl-whisk.png)
  fs.copyFileSync(srcPath, path.join(targetDir, 'bowl-whisk.png'));

  // 2. Crear versión coloreada en violeta institucional (#7C3AED) con transparencia
  // La imagen original es un trazo negro con fondo transparente.
  // Invertimos o recoloreamos el canal alfa/RGB.
  const { data, info } = await sharp(srcPath).raw().toBuffer({ resolveWithObject: true });
  
  // Crear buffer RGBA para versión violeta
  const violetBuffer = Buffer.alloc(info.width * info.height * 4);
  // Crear buffer RGBA para versión blanca (para fondos oscuros o botones violetas)
  const whiteBuffer = Buffer.alloc(info.width * info.height * 4);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    const a = data[i+3];

    // La opacidad del trazo original se preserva (antialiasing perfecto)
    const strokeAlpha = a * (1 - (r + g + b) / (3 * 255));

    // Violeta #7C3AED -> R: 124, G: 58, B: 237
    violetBuffer[i] = 124;
    violetBuffer[i+1] = 58;
    violetBuffer[i+2] = 237;
    violetBuffer[i+3] = Math.round(strokeAlpha);

    // Blanco puro
    whiteBuffer[i] = 255;
    whiteBuffer[i+1] = 255;
    whiteBuffer[i+2] = 255;
    whiteBuffer[i+3] = Math.round(strokeAlpha);
  }

  await sharp(violetBuffer, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(path.join(targetDir, 'bowl-violet.png'));

  await sharp(whiteBuffer, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(path.join(targetDir, 'bowl-white.png'));

  // 3. Crear iconos PWA con contenedor cuadrado redondeado (#7C3AED background + bowl blanco)
  // Redimensionamos el bowl blanco a ~340px y lo componemos sobre un lienzo 512x512 con esquinas redondeadas
  const bowlWhite340 = await sharp(whiteBuffer, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize(340, 340, { fit: 'contain' })
    .png()
    .toBuffer();

  const backgroundSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="112" fill="#7C3AED" />
  </svg>`;

  const pwa512Buffer = await sharp(Buffer.from(backgroundSvg))
    .composite([
      {
        input: bowlWhite340,
        top: 86,
        left: 86,
      }
    ])
    .png()
    .toBuffer();

  await sharp(pwa512Buffer).toFile(path.join(targetDir, 'icon-512.png'));
  await sharp(pwa512Buffer).resize(192, 192).toFile(path.join(targetDir, 'icon-192.png'));
  await sharp(pwa512Buffer).resize(180, 180).toFile(path.join(targetDir, 'apple-touch-icon.png'));
  await sharp(pwa512Buffer).resize(64, 64).toFile(path.join(targetDir, 'favicon-64.png'));

  console.log('Successfully generated all Amasia bowl icons for app and PWA');
}

processIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
