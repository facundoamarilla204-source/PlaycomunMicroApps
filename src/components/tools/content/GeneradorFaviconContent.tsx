"use client"

import React from "react"
import Link from "next/link"
import {
  Layers,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Globe,
  Sparkles,
  FileCode,
  Sliders,
} from "lucide-react"

export function GeneradorFaviconContent() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0 font-sans space-y-12">
      {/* 1. Introducción y Propósito */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          ¿Qué es un favicon y por qué es fundamental para tu sitio web?
        </h2>
        <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
          Un <strong>favicon</strong> (abreviatura de <em>favorites icon</em>) es el pequeño icono representativo que los navegadores web muestran junto al título de una página en las pestañas, en la barra de marcadores, en el historial de navegación y en los resultados de búsqueda de motores como Google.
        </p>
        <p className="text-base text-slate-700 leading-relaxed">
          Hoy en día, un único archivo gráfico no alcanza para cubrir todos los dispositivos y pantallas. Los teléfonos móviles iPhone y Android requieren iconos de alta resolución para la pantalla de inicio (Apple Touch Icon y PWA Manifest), mientras que navegadores de escritorio continúan solicitando el formato tradicional multi-resolución <code>favicon.ico</code>. Nuestra herramienta compila de manera automática todos estos formatos esenciales a partir de una única imagen, sin subir tus archivos a ningún servidor externo.
        </p>
      </section>

      {/* 2. Formatos y Resoluciones Incluidas */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          Archivos generados en el paquete y sus usos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: favicon.ico */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
              <Globe className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              favicon.ico (Multi-resolución)
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Archivo binario ICO genuino que integra las capas de 16 × 16, 32 × 32 y 48 × 48 píxeles en un solo archivo. Garantiza compatibilidad retroactiva con servidores y navegadores heredados.
            </p>
          </div>

          {/* Card 2: Apple Touch Icon */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
              <Smartphone className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              apple-touch-icon.png (180 × 180)
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Utilizado por dispositivos iOS (iPhone y iPad) cuando un usuario añade tu página a la pantalla de inicio o guarda un marcador en Safari móvil.
            </p>
          </div>

          {/* Card 3: PWA & Android */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
              <FileCode className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              site.webmanifest (192 & 512 px)
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Manifiesto estandarizado W3C con iconos de alta resolución para dispositivos Android, aplicaciones web progresivas (PWA) y pantallas de arranque.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Guía de Instalación Paso a Paso */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          Cómo instalar los favicons en tu sitio web
        </h3>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-4 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs">
              1
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                Descargá y descomprimí el paquete ZIP
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hacé clic en el botón <strong>Descargar paquete ZIP</strong> del generador. Obtendrás un archivo comprimido con todos los iconos, el archivo <code>site.webmanifest</code> y un <code>README.md</code> instructivo.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-4 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs">
              2
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                Copiá los archivos en la raíz pública de tu servidor
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Colocá los archivos en el directorio raíz de tu sitio web (por ejemplo <code>public/</code> en Next.js, Astro o Vite, o la carpeta raíz <code>public_html/</code> en servidores Apache o Nginx).
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-4 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs">
              3
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                Pegá el código de integración en la cabecera HTML
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Copiá el bloque HTML proporcionado por la herramienta y pegalo dentro de la sección <code>&lt;head&gt;</code> de tu plantilla principal o archivo <code>index.html</code>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Privacidad Total */}
      <section className="p-6 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span>Procesamiento 100% privado y en tu navegador</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Tus imágenes y logos nunca viajan por internet ni se almacenan en servidores remotos. El renderizado y la codificación binaria de los archivos ICO y PNG se realizan localmente en tu computadora o teléfono utilizando las APIs estándar de Canvas y JavaScript de tu propio navegador.
        </p>
      </section>

      {/* 5. Enlaces a Herramientas Relacionadas */}
      <section className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          Otras herramientas recomendadas para tus recursos web
        </h4>
        <div className="flex flex-wrap gap-2.5 text-xs">
          <Link
            href="/herramientas/compresor-imagenes"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            Compresor de imágenes
          </Link>
          <Link
            href="/herramientas/convertidor-archivos"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            Convertidor de archivos
          </Link>
          <Link
            href="/herramientas/generador-paletas-colores"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            Generador de paletas de colores
          </Link>
          <Link
            href="/herramientas/generador-qr"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-colors"
          >
            Generador de códigos QR
          </Link>
        </div>
      </section>
    </div>
  )
}
