# PlayComun Conversion Worker

Servicio independiente y de código abierto para la conversión documental de alta fidelidad (Word, Excel, PowerPoint y formatos OpenDocument a PDF) utilizando LibreOffice headless.

## Propósito y Arquitectura

Vercel Functions y entornos Serverless tienen límites estrictos de tamaño de paquete (50 MB descomprimidos en Lambda estándar), no disponen del paquete `libreoffice` instalado en el sistema operativo base, y tienen restricciones de memoria y tiempo de ejecución. 

Por esta razón técnica, el procesamiento de documentos de oficina complejos (DOC, DOCX, XLS, XLSX, PPT, PPTX, ODT, ODS, ODP) se delega a este microservicio contenerizado, mientras que las operaciones con PDF e imágenes (Imágenes a PDF, PDF a JPG/PNG, PDF a Word editable, PDF a Excel tabular, PDF a PowerPoint y PDF a PDF/A) se procesan directamente en el navegador del usuario sin enviar archivos a ningún servidor.

```
+--------------------------------------------------------------------------+
| NAVEGADOR DEL USUARIO (PlayComun Online)                                 |
|                                                                          |
| [Imagenes -> PDF]            [PDF -> Imagenes]          [PDF -> Word/Excel]  |
| (100% Local / Canvas)        (100% Local / Canvas)      (100% Local docx/xlsx)
|                                                                          |
| Para Word, Excel, PowerPoint:                                            |
| 1. Solicita token firmado a /api/conversion/token                        |
| 2. Sube archivo directo a este Worker con autorizacion HMAC              |
+--------------------------------------------------------------------------+
                                  |
                                  | POST /convert (Multipart)
                                  v
+--------------------------------------------------------------------------+
| CONVERSION WORKER (Docker / LibreOffice Headless)                         |
|                                                                          |
| 1. Valida firma HMAC (expiracion en 5 minutos).                          |
| 2. Valida tipo MIME, extension y tamaño maximo (<= 25 MB).                |
| 3. Guarda archivo en directorio temporal aislado con UUID aleatorio.     |
| 4. Ejecuta LibreOffice headless en sandbox de proceso.                   |
| 5. Retorna stream binario del PDF generado.                              |
| 6. Elimina inmediatamente todos los archivos temporales (finally block). |
+--------------------------------------------------------------------------+
```

## Seguridad y Privacidad

1. **Almacenamiento Efímero:** Los archivos nunca se almacenan de forma permanente. Se procesan en una carpeta temporal con UUID único y se eliminan de forma inmediata en el bloque `finally`, tanto en caso de éxito como de fallo.
2. **Sin Inyección de Comandos:** Se utiliza `child_process.execFile` con argumentos vectoriales sanitizados, evitando el paso de cadenas a una shell del sistema.
3. **Autorización HMAC:** Las peticiones deben incluir un header `x-conversion-signature` y `x-conversion-timestamp` firmado con una clave compartida (`WORKER_SECRET`). Las autorizaciones caducan a los 5 minutos.
4. **Límite de Concurrencia:** Máximo de 3 conversiones simultáneas por contenedor para evitar saturación de CPU y agotamiento de recursos.

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto HTTP donde escucha el worker | `8080` |
| `WORKER_SECRET` | Clave secreta compartida con Next.js para firmar tokens | `playcomun-dev-secret-change-in-prod` |
| `MAX_FILE_SIZE_MB` | Tamaño máximo permitido por archivo | `25` |
| `MAX_CONCURRENT_CONVERSIONS` | Cantidad máxima de conversiones simultáneas | `3` |
| `ALLOWED_ORIGINS` | Orígenes web permitidos para CORS (separados por coma) | `http://localhost:3000,https://playcomun.com` |

## Despliegue en Producción

### Opción 1: Railway / Render (Recomendada por simplicidad)
1. Conectar este repositorio a Railway o Render.
2. Seleccionar como raíz del servicio la carpeta `services/conversion-worker`.
3. El servicio detectará automáticamente el `Dockerfile`.
4. Configurar las variables de entorno:
   - `WORKER_SECRET`: Una clave aleatoria segura de 32+ caracteres.
   - `ALLOWED_ORIGINS`: El dominio de tu frontend (`https://playcomun.com`).
5. En el frontend de Next.js (Vercel), configurar:
   - `NEXT_PUBLIC_CONVERSION_WORKER_URL`: La URL pública provista (ej: `https://worker-conversion.up.railway.app`).
   - `CONVERSION_WORKER_SECRET`: La misma clave secreta configurada en el worker.

### Opción 2: VPS Propio con Docker Compose
```bash
cd services/conversion-worker
docker compose up -d --build
```

### Estimación de Costos de Infraestructura
- **Cero costos por conversión:** LibreOffice es software libre (licencia LGPL / MPL). No hay APIs comerciales de pago por documento.
- **Costo de alojamiento del contenedor:**
  - Railway: Plan Hobby de ~$5 USD/mes o uso por recursos consumidos.
  - Render: Instancia básica de ~$7 USD/mes.
  - VPS compartido (Hetzner / DigitalOcean): ~$4 a $6 USD/mes.
