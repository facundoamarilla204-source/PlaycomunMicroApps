/**
 * Validación y blindaje de URLs de destino para el servicio de redirección de QRs dinámicos (/q/[token]).
 * Protege contra:
 * - Sitios y esquemas maliciosos (javascript:, data:, vbscript:, file:, etc.)
 * - Ataques SSRF y escaneo de red interna (localhost, 127.0.0.1, rangos privados RFC 1918, IPv6)
 * - Bucles de redirección que apunten de vuelta a /q/ del propio dominio
 * - URLs excesivamente largas o malformadas
 */

export const MAX_DESTINATION_URL_LENGTH = 2048

export interface SafeUrlResult {
  isValid: boolean
  error?: string
  url?: URL
}

// Dominios o sufijos internos / reservados que deben rechazarse
const FORBIDDEN_HOST_SUFFIXES = [
  'localhost',
  '.localhost',
  '.local',
  '.internal',
  '.lan',
  '.home',
  '.corp',
  '.arpa',
  '.invalid',
  '.test',
  '.example',
]

// Dominios reconocidos como el propio servicio para evitar bucles hacia /q/
const KNOWN_OWN_DOMAINS = [
  'playcomun.com',
  'www.playcomun.com',
  'playcomun.online',
  'www.playcomun.online',
  'playcomunmicroapps.vercel.app',
]

/**
 * Comprueba si un string corresponde a una dirección IP (IPv4, IPv6 o formato numérico).
 */
function isIpAddress(hostname: string): boolean {
  const cleanHost = hostname.replace(/^\[|\]$/g, '') // Quitar corchetes de IPv6

  // 1. IPv4 estándar (ej: 192.168.1.1, 127.0.0.1, 10.0.0.1)
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Pattern.test(cleanHost)) {
    return true
  }

  // 2. IPv6 estándar o comprimida (contiene dos puntos)
  if (cleanHost.includes(':')) {
    return true
  }

  // 3. IPv4 en formato entero decimal (ej: http://2130706433 que resuelve a 127.0.0.1)
  if (/^\d+$/.test(cleanHost)) {
    return true
  }

  // 4. IPv4 en formato hexadecimal u octal (ej: 0x7f000001)
  if (/^0x[0-9a-fA-F]+$/i.test(cleanHost)) {
    return true
  }

  return false
}

/**
 * Valida de forma estricta en el servidor que la URL de destino de un QR dinámico sea segura.
 *
 * @param destinationUrl La URL ingresada por el usuario o leída de la base de datos
 * @param currentHost Host actual opcional (ej: window.location.host o request.headers.get('host'))
 */
export function validateDestinationUrl(
  destinationUrl: string | null | undefined,
  currentHost?: string | null
): SafeUrlResult {
  if (!destinationUrl || typeof destinationUrl !== 'string') {
    return { isValid: false, error: 'La URL de destino es obligatoria.' }
  }

  const trimmed = destinationUrl.trim()

  // 1. Longitud máxima razonable
  if (trimmed.length === 0) {
    return { isValid: false, error: 'La URL de destino no puede estar vacía.' }
  }

  if (trimmed.length > MAX_DESTINATION_URL_LENGTH) {
    return {
      isValid: false,
      error: `La URL excede la longitud máxima permitida de ${MAX_DESTINATION_URL_LENGTH} caracteres.`,
    }
  }

  // 2. Detección inmediata de esquemas peligrosos en el texto crudo
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:', 'blob:', 'about:']
  const lowerTrimmed = trimmed.toLowerCase()
  for (const scheme of dangerousSchemes) {
    if (lowerTrimmed.startsWith(scheme)) {
      return {
        isValid: false,
        error: `El esquema ${scheme} no está permitido por motivos de seguridad.`,
      }
    }
  }

  // 3. Parsear URL
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { isValid: false, error: 'El formato de la URL no es válido.' }
  }

  // 4. Protocolo: solo http: y https:
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return {
      isValid: false,
      error: 'Solo se permiten enlaces con protocolo web seguro (http o https).',
    }
  }

  const hostname = parsed.hostname.toLowerCase()

  // 5. Sin direcciones IP (v4, v6 ni rangos privados/públicos directos)
  if (isIpAddress(hostname)) {
    return {
      isValid: false,
      error: 'No se permiten direcciones IP directas como destino. Usá un nombre de dominio (ej: midominio.com).',
    }
  }

  // 6. Sin localhost ni dominios internos/locales
  if (
    hostname === 'localhost' ||
    FORBIDDEN_HOST_SUFFIXES.some(suffix => hostname === suffix || hostname.endsWith(suffix))
  ) {
    return {
      isValid: false,
      error: 'No se permiten dominios locales o internos (localhost o similares).',
    }
  }

  // 7. El hostname debe tener al menos un punto (garantiza que sea un dominio y no un hostname de intranet)
  if (!hostname.includes('.')) {
    return {
      isValid: false,
      error: 'El destino debe ser un dominio público calificado con extensión válida.',
    }
  }

  // 8. Prevención de bucles hacia /q/ del propio sitio
  const ownDomains = new Set<string>(KNOWN_OWN_DOMAINS)
  if (currentHost) {
    const cleanCurrent = currentHost.toLowerCase().split(':')[0]
    ownDomains.add(cleanCurrent)
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      ownDomains.add(new URL(process.env.NEXT_PUBLIC_APP_URL).hostname.toLowerCase())
    } catch {
      // Ignorar fallo de parseo de env
    }
  }

  const isOwnDomain = ownDomains.has(hostname)
  const pathname = parsed.pathname.toLowerCase()

  // Si apunta al propio dominio y la ruta inicia con /q (o /q/)
  if (isOwnDomain && (pathname === '/q' || pathname.startsWith('/q/'))) {
    return {
      isValid: false,
      error: 'No podés apuntar un QR dinámico hacia otra ruta de resolución /q/ del propio sitio (evita bucles infinitos).',
    }
  }

  return { isValid: true, url: parsed }
}

/**
 * Helper booleano rápido para usar en Server Components o middlewares.
 */
export function isSafeDestinationUrl(url: string | null | undefined, currentHost?: string | null): boolean {
  return validateDestinationUrl(url, currentHost).isValid
}
