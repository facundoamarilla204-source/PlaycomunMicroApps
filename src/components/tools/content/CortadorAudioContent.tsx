import React from "react"
import Link from "next/link"
import {
  Scissors,
  Music,
  ShieldCheck,
  Zap,
  HelpCircle,
  FileAudio,
  Sliders,
  Download,
  Info,
  Layers,
  ArrowRight,
} from "lucide-react"

export function CortadorAudioContent() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0 font-sans space-y-12">
      {/* 1. Introducción y Propósito */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          ¿Cómo funciona el cortador de audio online de PlayComun?
        </h2>
        <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
          Nuestra herramienta te permite <strong>recortar canciones, audios de voz y grabaciones</strong> con precisión milimétrica directamente desde tu navegador web. A diferencia de las plataformas tradicionales que suben tus archivos a servidores externos, aquí todo el procesamiento se ejecuta <strong>100% en tu propio dispositivo</strong> gracias a la potencia de WebAssembly y FFmpeg. Tus audios nunca salen de tu celular o computadora, asegurando <strong>privacidad total</strong> y una velocidad sin demoras por subidas o descargas pesadas.
        </p>
      </section>

      {/* 2. Paso a Paso */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          Cómo cortar un audio en 3 pasos simples
        </h3>
        <p className="text-slate-700 leading-relaxed">
          Diseñamos el editor para que puedas extraer el fragmento que buscás en cuestión de segundos, sin programas pesados ni conocimientos técnicos:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand font-bold text-base">
              1
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">
              Cargá tu archivo
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Arrastrá tu canción o nota de voz al recuadro o seleccionalo desde tus carpetas. Admitimos archivos comunes como <strong>MP3, WAV, M4A y OGG</strong> de hasta 100 MB.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand font-bold text-base">
              2
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">
              Elegí el fragmento exacto
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Desplazá los controles sobre la forma de onda visual o ingresá los minutos, segundos y milisegundos en los campos numéricos. Podés presionar <em>«Escuchar selección»</em> para verificarlo las veces que quieras.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand font-bold text-base">
              3
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">
              Cortá y descargá
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Elegí entre <strong>MP3</strong> (ideal para compartir) o <strong>WAV</strong> (máxima fidelidad). Tocá el botón de corte y descargá tu nuevo archivo de inmediato.
            </p>
          </div>
        </div>
      </section>

      {/* 3. MP3 vs WAV */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          ¿Qué formato de salida te conviene elegir?
        </h3>
        <p className="text-slate-700 leading-relaxed">
          Según el uso que le vayas a dar al audio recortado, podés optar entre dos estándares:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-purple-200/80 bg-purple-50/20 shadow-xs space-y-3">
            <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-brand text-xs font-bold text-white">
              MP3 (192 kbps)
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">
              Excelente para compartir y uso diario
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              El formato MP3 comprime el audio reduciendo drásticamente su tamaño en megabytes sin pérdida perceptible para el oído. Es el estándar recomendado si vas a enviar el audio por <strong>WhatsApp, Telegram, subirlo a historias de Instagram o usarlo como tono de llamada</strong>.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-xs font-bold text-slate-800 border border-slate-200">
              WAV (PCM 16-bit)
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">
              Calidad de estudio sin compresión
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              El formato WAV conserva la forma de onda pura e intacta con codificación PCM lineal. Pesa más que un MP3, pero es indispensable si vas a <strong>incorporar el audio a un editor de video profesional, podcast, mezcla musical o masterización</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Casos de uso prácticos */}
      <section className="space-y-4">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          Usos habituales para cortar audio
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <h5 className="font-bold text-sm text-slate-900">Crear tonos de llamada o alarmas</h5>
            <p className="text-xs text-slate-600 leading-relaxed">
              Extraé el estribillo o los 20 segundos favoritos de cualquier canción para configurarlos como tono en tu celular.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <h5 className="font-bold text-sm text-slate-900">Limpiar notas de voz y entrevistas</h5>
            <p className="text-xs text-slate-600 leading-relaxed">
              Eliminá silencios iniciales, vacilaciones o fragmentos irrelevantes de testimonios y audios de WhatsApp antes de compartirlos.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <h5 className="font-bold text-sm text-slate-900">Clips para redes sociales y podcasts</h5>
            <p className="text-xs text-slate-600 leading-relaxed">
              Recortá las mejores frases o momentos clave de conferencias y episodios para publicar como historias o reels.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <h5 className="font-bold text-sm text-slate-900">Efectos de sonido para videos</h5>
            <p className="text-xs text-slate-600 leading-relaxed">
              Aislá un sonido puntual o un sample dentro de una pista extensa para usarlo en tus ediciones audiovisuales.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Rendimiento y Privacidad */}
      <section className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span>Privacidad, rendimiento y recursos de tu dispositivo</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Al procesar el audio directamente en tu navegador, la velocidad de corte depende de la potencia del procesador de tu celular o computadora y del tamaño del archivo. Durante el primer corte, tu navegador descargará los recursos estáticos de FFmpeg.wasm (unos pocos megabytes) que quedan guardados en la memoria caché para que los siguientes cortes comiencen al instante. No consumís datos de subida ni dependés de conexiones lentas.
        </p>
      </section>

      {/* 6. Enlaces Internos a Otras Herramientas */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          Otras herramientas útiles para tus archivos
        </h3>
        <p className="text-sm text-slate-600">
          Complementá la edición de tus audios con otras utilidades gratuitas de PlayComun:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <Link
            href="/herramientas/compresor-imagenes"
            className="group flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-brand/40 hover:shadow-xs transition-all"
          >
            <div>
              <h5 className="font-bold text-sm text-slate-900 group-hover:text-brand transition-colors mb-1">
                Compresor de imágenes
              </h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Optimizá el peso de tus fotos JPG, PNG y WebP sin perder calidad.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand">
              <span>Probar compresor</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/herramientas/convertidor-archivos"
            className="group flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-brand/40 hover:shadow-xs transition-all"
          >
            <div>
              <h5 className="font-bold text-sm text-slate-900 group-hover:text-brand transition-colors mb-1">
                Convertidor de archivos
              </h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Convertí documentos Word, Excel, PowerPoint y PDF entre formatos.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand">
              <span>Probar convertidor</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/herramientas/ordenar-pdf"
            className="group flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-brand/40 hover:shadow-xs transition-all"
          >
            <div>
              <h5 className="font-bold text-sm text-slate-900 group-hover:text-brand transition-colors mb-1">
                Ordenar y unir PDF
              </h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Combiná, rotá, dividí o eliminá páginas de tus documentos PDF.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand">
              <span>Probar editor PDF</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* 7. Licencia y Créditos Técnicos */}
      <section className="text-xs text-slate-400 space-y-1 pt-6 border-t border-slate-100">
        <p>
          <strong>Aviso de licencias de software:</strong> Esta herramienta utiliza el motor multimedia FFmpeg (licenciado bajo GNU Lesser General Public License / LGPL v2.1+) compilado a WebAssembly a través de la biblioteca FFmpeg.wasm (licencia MIT). La visualización de forma de onda opera mediante la API estándar de audio web del navegador (Web Audio API).
        </p>
      </section>
    </div>
  )
}
