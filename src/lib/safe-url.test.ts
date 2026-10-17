import { describe, it, expect } from 'vitest'
import { validateDestinationUrl, isSafeDestinationUrl, MAX_DESTINATION_URL_LENGTH } from './safe-url'

describe('Blindaje de Redirección QR Dinámica: Protección contra Abuso', () => {
  describe('1. Protocolos y Esquemas Permitidos', () => {
    it('permite URLs válidas con HTTPS', () => {
      const res = validateDestinationUrl('https://ejemplo.com/menu')
      expect(res.isValid).toBe(true)
      expect(res.url?.href).toBe('https://ejemplo.com/menu')
    })

    it('permite URLs válidas con HTTP', () => {
      const res = validateDestinationUrl('http://mi-negocio.com.ar/promociones?mesa=4')
      expect(res.isValid).toBe(true)
    })

    it('rechaza esquema javascript: (ataque XSS)', () => {
      const res = validateDestinationUrl('javascript:alert(document.cookie)')
      expect(res.isValid).toBe(false)
      expect(res.error).toMatch(/no está permitido/i)
      expect(isSafeDestinationUrl('javascript:alert(1)')).toBe(false)
    })

    it('rechaza esquema data: (inyección de payload base64 / HTML)', () => {
      const res = validateDestinationUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')
      expect(res.isValid).toBe(false)
      expect(res.error).toMatch(/no está permitido/i)
    })

    it('rechaza esquema vbscript:', () => {
      const res = validateDestinationUrl('vbscript:msgbox("malicioso")')
      expect(res.isValid).toBe(false)
    })

    it('rechaza esquema file:', () => {
      const res = validateDestinationUrl('file:///etc/passwd')
      expect(res.isValid).toBe(false)
    })

    it('rechaza esquemas no web como ftp: o ssh:', () => {
      expect(validateDestinationUrl('ftp://ftp.servidor.com/archivo.zip').isValid).toBe(false)
      expect(validateDestinationUrl('ssh://root@192.168.1.1').isValid).toBe(false)
    })
  })

  describe('2. Prevención de Escaneo Interno y SSRF (IPs y Localhost)', () => {
    it('rechaza localhost', () => {
      const res = validateDestinationUrl('http://localhost:3000/admin')
      expect(res.isValid).toBe(false)
      expect(res.error).toMatch(/locales o internos/i)
    })

    it('rechaza subdominios de localhost', () => {
      const res = validateDestinationUrl('http://app.localhost/panel')
      expect(res.isValid).toBe(false)
    })

    it('rechaza sufijos .local, .internal, .lan', () => {
      expect(validateDestinationUrl('http://router.local').isValid).toBe(false)
      expect(validateDestinationUrl('https://api.internal/keys').isValid).toBe(false)
      expect(validateDestinationUrl('http://servidor.lan/db').isValid).toBe(false)
    })

    it('rechaza direcciones IPv4 públicas y privadas', () => {
      expect(validateDestinationUrl('http://127.0.0.1:8080').isValid).toBe(false)
      expect(validateDestinationUrl('http://192.168.1.1').isValid).toBe(false)
      expect(validateDestinationUrl('http://10.0.0.1').isValid).toBe(false)
      expect(validateDestinationUrl('http://172.16.0.1').isValid).toBe(false)
      expect(validateDestinationUrl('http://8.8.8.8').isValid).toBe(false)
      expect(validateDestinationUrl('http://1.1.1.1/dns').isValid).toBe(false)
    })

    it('rechaza direcciones IPv6', () => {
      expect(validateDestinationUrl('http://[::1]:3000').isValid).toBe(false)
      expect(validateDestinationUrl('http://[fe80::1]').isValid).toBe(false)
    })

    it('rechaza representaciones de IP decimales o hexadecimales', () => {
      // 2130706433 es 127.0.0.1
      expect(validateDestinationUrl('http://2130706433').isValid).toBe(false)
      expect(validateDestinationUrl('http://0x7f000001').isValid).toBe(false)
    })

    it('rechaza hostnames de intranet sin punto (ej. http://servidor/)', () => {
      const res = validateDestinationUrl('http://servidorempresa/panel')
      expect(res.isValid).toBe(false)
      expect(res.error).toMatch(/dominio público calificado/i)
    })
  })

  describe('3. Prevención de Bucles hacia /q/ del propio sitio', () => {
    it('rechaza destinos que apunten a playcomun.com/q/...', () => {
      const res = validateDestinationUrl('https://playcomun.com/q/abcd1234efgh')
      expect(res.isValid).toBe(false)
      expect(res.error).toMatch(/bucles infinitos/i)
    })

    it('rechaza destinos que apunten a www.playcomun.online/q/...', () => {
      const res = validateDestinationUrl('https://www.playcomun.online/q/otra-tanda')
      expect(res.isValid).toBe(false)
    })

    it('rechaza destinos que apunten al currentHost dinámico con ruta /q/', () => {
      const res = validateDestinationUrl('https://mi-dominio-custom.com/q/bucle', 'mi-dominio-custom.com')
      expect(res.isValid).toBe(false)
    })

    it('permite destinos hacia otras rutas normales del propio sitio o sitios externos', () => {
      expect(validateDestinationUrl('https://playcomun.com/planes').isValid).toBe(true)
      expect(validateDestinationUrl('https://playcomun.com/herramientas/calculadora-iva').isValid).toBe(true)
      expect(validateDestinationUrl('https://miempresa.com/catalogo').isValid).toBe(true)
    })
  })

  describe('4. Longitud y Casos Límite', () => {
    it('rechaza URLs vacías o nulas', () => {
      expect(validateDestinationUrl('').isValid).toBe(false)
      expect(validateDestinationUrl('   ').isValid).toBe(false)
      expect(validateDestinationUrl(null).isValid).toBe(false)
      expect(validateDestinationUrl(undefined).isValid).toBe(false)
    })

    it('rechaza URLs que superen la longitud máxima de 2048 caracteres', () => {
      const longPath = 'a'.repeat(MAX_DESTINATION_URL_LENGTH)
      const oversizedUrl = `https://ejemplo.com/${longPath}`
      const res = validateDestinationUrl(oversizedUrl)
      expect(res.isValid).toBe(false)
      expect(res.error).toMatch(/excede la longitud máxima permitida/i)
    })

    it('acepta URLs largas válidas dentro del límite', () => {
      const okPath = 'a'.repeat(300)
      const validLongUrl = `https://ejemplo.com/${okPath}`
      expect(validateDestinationUrl(validLongUrl).isValid).toBe(true)
    })
  })
})
