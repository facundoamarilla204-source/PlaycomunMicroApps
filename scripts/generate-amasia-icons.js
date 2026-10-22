const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icono centrado geométricamente y con proporciones estéticas de manga pastelera artesanal
const svgCode = `<svg viewBox="0 0 512 512" width="512" height="512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#7C3AED" />
  
  <g transform="translate(256, 256) scale(7.8) translate(-24, -24)">
    <!-- Roseta de crema dispensada (flor de merengue pastelero con remolino) -->
    <path
      d="M11 36C8 38 7 41.5 8.5 44C10 46.5 13.5 47 16.5 45.5C19 44 20 41 18.5 38.5C17 36 14 34.5 11 36Z"
      fill="#FDE68A"
    />
    <path
      d="M9.5 42C12 41 15 41.5 16.5 43.5"
      stroke="#F59E0B"
      stroke-width="1.6"
      stroke-linecap="round"
    />
    <path
      d="M13 37.5C14.5 39 15 40.5 14 42"
      stroke="#F59E0B"
      stroke-width="1.3"
      stroke-linecap="round"
    />

    <!-- Boquilla de acero inoxidable estriada -->
    <path
      d="M18.5 28.5L11.5 37.5L16.5 41.5L23.5 32.5L18.5 28.5Z"
      fill="#F1F5F9"
      stroke="#FFFFFF"
      stroke-width="1.75"
      stroke-linejoin="round"
    />
    <path d="M14 35.5L18 32.5" stroke="#94A3B8" stroke-width="1.3" stroke-linecap="round" />
    <path d="M16 38.5L20 35.5" stroke="#64748B" stroke-width="1.3" stroke-linecap="round" />

    <!-- Cuerpo cónico principal de la manga pastelera -->
    <path
      d="M40 7C36.5 4.5 32 6 29 9L18.5 28.5L23.5 32.5L42.5 12C44.5 9.5 43 8 40 7Z"
      fill="#FFFFFF"
    />

    <!-- Sombra/relieve de volumen para dar tridimensionalidad limpia -->
    <path
      d="M29 9L18.5 28.5L21.5 31L36.5 11.5C34 10 31.5 9 29 9Z"
      fill="#EDE9FE"
    />

    <!-- Costura técnica reforzada -->
    <path
      d="M29 11L20.5 28"
      stroke="#C4B5FD"
      stroke-width="1.1"
      stroke-dasharray="1.5 2"
      stroke-linecap="round"
    />

    <!-- Pliegue de carga / aro de cierre superior -->
    <ellipse
      cx="38.5"
      cy="9"
      rx="5.5"
      ry="3.2"
      transform="rotate(-40 38.5 9)"
      fill="#DDD6FE"
      stroke="#FFFFFF"
      stroke-width="1.75"
    />
    <circle cx="39.5" cy="8.5" r="1.2" fill="#7C3AED" />
  </g>
</svg>`;

async function run() {
  const targetDir = path.join(process.cwd(), 'public', 'amasia');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(path.join(targetDir, 'icon.svg'), svgCode);

  await sharp(Buffer.from(svgCode)).resize(192, 192).png().toFile(path.join(targetDir, 'icon-192.png'));
  await sharp(Buffer.from(svgCode)).resize(512, 512).png().toFile(path.join(targetDir, 'icon-512.png'));
  await sharp(Buffer.from(svgCode)).resize(180, 180).png().toFile(path.join(targetDir, 'apple-touch-icon.png'));
  await sharp(Buffer.from(svgCode)).resize(64, 64).png().toFile(path.join(targetDir, 'favicon-64.png'));

  console.log('Regenerated Amasia icons with perfect centering and detail');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
