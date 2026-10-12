import React from "react"
import Link from "next/link"
import {
  FileImage,
  Layers,
  Sparkles,
  ArrowRightLeft,
  CheckCircle,
  HelpCircle,
  Zap,
  Lock,
} from "lucide-react"

export function CompresorImagenesContent() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0 font-sans space-y-12">
      {/* 1. Introducción y Propósito */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          ¿Cómo funciona el compresor y conversor de imágenes de PlayComun?
        </h2>
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
          Nuestra herramienta te permite <strong>comprimir imágenes online</strong> y <strong>convertir formatos</strong> de forma instantánea directamente desde tu navegador web. A diferencia de otros servicios en la nube que suben tus fotos a servidores externos, aquí todo el procesamiento se ejecuta en tu propio dispositivo utilizando la aceleración de hardware de tu navegador. Esto garantiza <strong>privacidad total</strong> y una velocidad sin demoras por subidas lentas.
        </p>
      </section>

      {/* 2. Diferencia entre Comprimir y Convertir */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          Diferencia entre comprimir y convertir imágenes
        </h3>
        <p className="text-gray-700 leading-relaxed">
          Muchas personas confunden ambos conceptos, pero son procesos técnicos diferentes que podés utilizar según la necesidad de tus archivos:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">
              Comprimir imágenes
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Consiste en <strong>reducir el peso de almacenamiento del archivo</strong> (en KB o MB) optimizando la codificación interna de los datos y píxeles. Puede ser con pérdida controlada (en JPG y WebP) para aligerar la imagen manteniendo un aspecto visual idéntico al ojo humano.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">
              Convertir de formato
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Consiste en <strong>recodificar la imagen bajo un estándar técnico diferente</strong> (por ejemplo, de PNG a WebP o de JPG a WebP). No es solo cambiar la extensión del archivo: se recalculan los canales de color y la estructura de compresión del estándar elegido.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Comparativa de Formatos */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          Formatos compatibles: JPG, PNG y WebP
        </h3>
        <p className="text-gray-700 leading-relaxed">
          Cada formato tiene propósitos y características técnicas específicas. Saber cuándo elegir cada uno te ayudará a lograr el mejor equilibrio entre peso y calidad:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="inline-block px-2.5 py-1 rounded-md bg-neutral-100 text-xs font-bold text-neutral-800">
              JPG / JPEG
            </div>
            <h4 className="text-base font-bold text-gray-900">
              Ideal para fotografías y banners
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Excelente para imágenes con gran variedad de colores, gradientes y texturas. Utiliza compresión con pérdida. <strong>Importante:</strong> no admite transparencias; todo fondo transparente se rellenará con un color sólido.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="inline-block px-2.5 py-1 rounded-md bg-neutral-100 text-xs font-bold text-neutral-800">
              PNG
            </div>
            <h4 className="text-base font-bold text-gray-900">
              Ideal para logos y gráficos con transparencia
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Es un formato de compresión sin pérdida (lossless). Conserva bordes ultra nítidos y el canal alfa de transparencia. Sin embargo, en fotografías suele pesar mucho más que JPG y WebP.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-brand/30 shadow-xs space-y-3 bg-brand-light/20">
            <div className="inline-block px-2.5 py-1 rounded-md bg-brand text-xs font-bold text-white">
              WebP (Estándar moderno)
            </div>
            <h4 className="text-base font-bold text-gray-900">
              El más recomendado para la web
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Desarrollado por Google y compatible con todos los navegadores modernos. Admite transparencia y compresión con pérdida a la vez, logrando entre un <strong>25% y 40% menos peso</strong> que un JPG equivalente.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Transparencia y JPG */}
      <section className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 space-y-3">
        <h3 className="text-lg font-bold text-amber-950 flex items-center gap-2">
          <Layers className="h-5 w-5 text-amber-700" />
          ¿Qué sucede con la transparencia al convertir a JPG?
        </h3>
        <p className="text-sm text-amber-900 leading-relaxed">
          Debido a la especificación estándar de JPEG, este formato carece de canal alfa (transparencia). Por este motivo, si convertís una imagen transparente como un logotipo PNG a JPG, el compresor te permite seleccionar un color de fondo (por defecto blanco) sobre el cual se montará la imagen antes de codificarla. Si necesitás mantener la transparencia de fondo intacta, tu mejor opción es elegir <strong>WebP</strong> o <strong>PNG</strong> como formato de salida.
        </p>
      </section>

      {/* 5. Consejos para optimizar imágenes */}
      <section className="space-y-4">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          Buenas prácticas para optimizar tus imágenes
        </h3>
        <ul className="space-y-3 text-sm sm:text-base text-gray-700">
          <li className="flex items-start gap-2.5">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Redimensioná antes de publicar:</strong> Si tu sitio web muestra fotos a un ancho máximo de 1200 px, no uses una imagen original de 4000 px. Activá la opción de límite de ancho en la herramienta para ahorrar hasta un 80% extra de peso sin perder nitidez.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Usá el perfil Equilibrado (78%):</strong> Es el punto óptimo donde el ojo humano no percibe artefactos de compresión en pantallas estándar ni pantallas Retina, pero el tamaño del archivo se reduce drásticamente.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Migrá tus imágenes a WebP:</strong> Convertir tu catálogo de productos a WebP mejorará la velocidad de carga de tu tienda online y tu puntuación en Google Core Web Vitals.
            </span>
          </li>
        </ul>
      </section>

      {/* 6. Enlaces a otras herramientas relacionadas */}
      <section className="pt-6 border-t border-gray-200">
        <h4 className="text-base font-semibold text-gray-900 mb-3">
          Otras herramientas recomendadas de PlayComun
        </h4>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/herramientas/generador-listas-precios"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-brand/40 text-xs font-medium text-gray-800 transition-colors shadow-2xs"
          >
            <span>Generador de Listas de Precios en PDF</span>
          </Link>
          <Link
            href="/herramientas/generador-qr"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-brand/40 text-xs font-medium text-gray-800 transition-colors shadow-2xs"
          >
            <span>Generador de Códigos QR</span>
          </Link>
          <Link
            href="/herramientas/conversor-unidades"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-brand/40 text-xs font-medium text-gray-800 transition-colors shadow-2xs"
          >
            <span>Conversor de Unidades</span>
          </Link>
          <Link
            href="/herramientas/calculadora-precios"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-brand/40 text-xs font-medium text-gray-800 transition-colors shadow-2xs"
          >
            <span>Calculadora de Precios de Venta</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
