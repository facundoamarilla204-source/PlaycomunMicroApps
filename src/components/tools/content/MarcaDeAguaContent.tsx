import React from "react"
import Link from "next/link"
import {
  ShieldCheck,
  Sparkles,
  Layers,
  Grid,
  FileImage,
  Lock,
  ArrowRight,
  Eye,
  CheckCircle2,
} from "lucide-react"

export function MarcaDeAguaContent() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0 font-sans space-y-12">
      {/* 1. Introducción y propósito */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Cómo poner marca de agua a tus fotos de forma rápida y segura
        </h2>
        <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
          Nuestra herramienta te permite <strong>agregar marcas de agua a imágenes</strong>, proteger fotografías con tu logo personal o incorporar firmas y textos comerciales a lotes completos de fotos. Todo el procesamiento se realiza directamente en tu navegador web mediante HTML5 Canvas, lo que garantiza que tus archivos originales nunca se suban a servidores externos ni queden almacenados en bases de datos.
        </p>
      </section>

      {/* 2. Dos modalidades de protección */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          Dos formas de proteger tus creaciones: marca única o patrón repetido
        </h3>
        <p className="text-slate-700 leading-relaxed">
          Dependiendo del tipo de fotografía y del canal donde vayas a publicarla, podés elegir entre dos esquemas visuales:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Layers className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              Marca de agua única
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ideal para portafolios fotográficos, inmobiliarias o catálogos de productos donde deseás identificar la autoría sin obstruir la visualización principal. Podés ubicarla en cualquiera de las 9 esquinas y bordes o arrastrarla libremente a cualquier coordenada.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Grid className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              Patrón repetido (Mosaico)
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              La mejor alternativa para proteger bocetos, trabajos de diseño gráfico o fotos comerciales contra capturas no autorizadas y recortes. La marca se distribuye en diagonal por toda la superficie con opacidad controlada.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Consejos de legibilidad y transparencia */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          Consejos para una marca de agua legible y profesional
        </h3>

        <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Usá logos con canal alfa (PNG o WebP transparente):</strong>
              <p className="text-slate-600 mt-1">
                Subir tu isotipo en formato PNG transparente evita que aparezca un recuadro blanco artificial alrededor de tu logotipo, integrándose armoniosamente sobre cualquier fotografía.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Activá la sombra o contorno sutil en marcas de texto:</strong>
              <p className="text-slate-600 mt-1">
                Una fotografía suele combinar áreas muy iluminadas y zonas oscuras. Agregar un contorno o sombra suave asegura que el texto sea perfectamente legible sin importar dónde caiga.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Ajustá la opacidad entre 60% y 85%:</strong>
              <p className="text-slate-600 mt-1">
                Una opacidad moderada protege tu propiedad intelectual permitiendo que el espectador aprecie la calidad de la foto sin distraerse en exceso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Privacidad y seguridad garantizada */}
      <section className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-brand-light/60 to-white border border-brand-border space-y-4">
        <div className="flex items-center gap-2.5 text-brand font-bold text-lg">
          <ShieldCheck className="h-6 w-6" />
          <span>Privacidad 100% local en tu dispositivo</span>
        </div>
        <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
          En PlayComun nos tomamos muy en serio la confidencialidad de tus imágenes y contratos fotográficos. Toda la composición de píxeles, el cálculo matemático de coordenadas y la generación del archivo ZIP se ejecutan íntegramente en la memoria de tu navegador mediante JavaScript y Canvas 2D. No enviamos tus archivos por internet ni conservamos copias en ningún servidor.
        </p>
      </section>

      {/* 5. Herramientas relacionadas */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          Otras herramientas recomendadas para tus imágenes y archivos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/herramientas/compresor-imagenes"
            className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-brand hover:shadow-xs transition-all"
          >
            <div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors">
                Compresor de imágenes
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Reducí el peso de fotos en JPG, PNG y WebP antes de subirlas a tu web.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/herramientas/eliminar-metadatos-exif"
            className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-brand hover:shadow-xs transition-all"
          >
            <div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors">
                Eliminar metadatos EXIF
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Limpiá ubicaciones GPS, cámaras y fechas de tus fotos antes de publicarlas.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/herramientas/generador-favicon"
            className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-brand hover:shadow-xs transition-all"
          >
            <div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors">
                Generador de favicons
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Convertí tu logo en paquete de iconos ICO y PNG para tu página web.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/herramientas/convertidor-archivos"
            className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-brand hover:shadow-xs transition-all"
          >
            <div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors">
                Convertidor de archivos
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Transformá fotos e imágenes en documentos PDF multipágina.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-brand transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  )
}
