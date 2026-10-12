# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim

# Evitar prompts interactivos durante apt
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production
ENV PORT=8080

# Instalar LibreOffice headless, fuentes de Microsoft/Liberation y utilidades
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    fonts-liberation \
    fonts-dejavu-core \
    fontconfig \
    ca-certificates \
    curl \
    && fc-cache -fv \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /app

# Copiar manifiestos e instalar dependencias
COPY package.json ./
RUN npm install --omit=dev

# Copiar codigo fuente
COPY index.js ./

# Crear directorio temporal con permisos adecuados
RUN mkdir -p /tmp/pc-conversions && chmod 777 /tmp/pc-conversions

# Exponer puerto del worker
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Iniciar servicio
CMD ["node", "index.js"]
