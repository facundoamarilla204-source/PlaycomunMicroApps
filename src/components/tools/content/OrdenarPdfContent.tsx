"use client"

import React from "react"
import Link from "next/link"
import {
  FileText,
  Layers,
  Scissors,
  RotateCw,
  Camera,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Smartphone,
  Eye,
  Trash2,
} from "lucide-react"

export function OrdenarPdfContent() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0 font-sans space-y-12">
      {/* 1. Introducción y Propósito */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          ¿Cómo funciona el organizador y escáner de PDF de PlayComun?
        </h2>
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
          Nuestra herramienta <strong>Ordenar PDF</strong> es una aplicación completa diseñada para gestionar, organizar, combinar, separar y modificar las páginas de tus documentos PDF directamente desde el navegador. A diferencia de utilidades estáticas o visualizadores básicos, este espacio de trabajo lee la estructura real de tus archivos y te brinda control total sobre cada hoja individual.
        </p>
        <p className="text-base text-gray-700 leading-relaxed">
          Además, incluye un potente <strong>escáner de documentos a PDF</strong> con acceso a la cámara de tu teléfono móvil o computadora. Podés fotografiar recibos, notas, contratos o certificados, corregir su perspectiva con detección de bordes, aplicar filtros de lectura y unirlos en un único PDF profesional, todo sin enviar tus documentos ni fotografías a ningún servidor externo.
        </p>
      </section>

      {/* 2. Operaciones Documentales Principales */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          Operaciones principales disponibles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Unir y Organizar */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Layers className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">
              Unir y ordenar páginas
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Cargá múltiples archivos PDF y combínalos en un único documento. Reorganizá el orden de los archivos completos o arrastrá páginas individuales para situarlas exactamente donde las necesitás, con controles táctiles adaptados a teléfonos y tablets.
            </p>
          </div>

          {/* Card 2: Dividir y Extraer */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Scissors className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">
              Dividir y extraer PDF
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Separar documentos en bloques iguales (por ejemplo, cada 10 páginas), especificar rangos personalizados (como 1-5, 6-12) o extraer páginas individuales. Podés descargar cada archivo por separado o empaquetarlos en un archivo ZIP con un solo clic.
            </p>
          </div>

          {/* Card 3: Escanear con cámara */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Camera className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">
              Escanear a PDF con cámara
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Transformá la cámara de tu smartphone en un escáner de bolsillo. Capturá múltiples páginas consecutivas, recortá bordes con ajuste de perspectiva, aumentá el contraste del texto y generá un PDF estándar A4 sin marcas de agua.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Guía Paso a Paso */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          Paso a paso: cómo gestionar tus documentos
        </h3>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white font-bold text-sm">
              1
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-gray-900">
                Seleccioná tus archivos PDF o iniciá la cámara
              </h4>
              <p className="text-sm text-gray-600">
                Arrastrá uno o varios archivos PDF a la zona de carga, o pulsá el botón de escáner para tomar fotografías de hojas físicas. Podés combinar páginas de archivos existentes con páginas recién escaneadas en una misma sesión.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white font-bold text-sm">
              2
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-gray-900">
                Reorganizá, rotá y seleccioná páginas
              </h4>
              <p className="text-sm text-gray-600">
                Visualizá las miniaturas en alta fidelidad. Arrastrá con el mouse o usá los botones táctiles para mover páginas antes o después. Rotá páginas en ángulos de 90° si quedaron apaisadas y eliminá las hojas en blanco con total seguridad.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white font-bold text-sm">
              3
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-gray-900">
                Descargá tu documento final ordenado o dividido
              </h4>
              <p className="text-sm text-gray-600">
                Pulsá &quot;Descargar PDF Ordenado&quot; para obtener tu archivo unificado, o utilizá &quot;Dividir PDF&quot; para generar lotes por partes o en formato ZIP. La descarga es instantánea y conserva la resolución de tus documentos originales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Privacidad y Seguridad */}
      <section className="p-8 rounded-2xl bg-violet-50/60 border border-violet-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Privacidad total: procesamiento 100% en tu navegador
          </h3>
        </div>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          La confidencialidad de tus datos es nuestra prioridad. Todas las operaciones de lectura, ordenamiento, combinación, rotación, corte y escaneo se ejecutan exclusivamente en la memoria local de tu dispositivo a través de los motores WebAssembly y JavaScript de tu navegador.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          Tus archivos PDF, contratos, recibos y fotografías <strong>nunca se suben a servidores remotos ni se almacenan en ninguna base de datos</strong>. Cuando cerrás o actualizás la pestaña, todos los recursos temporales se liberan de forma inmediata.
        </p>
      </section>

      {/* 5. Enlaces y herramientas relacionadas */}
      <section className="space-y-4 pt-4 border-t border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">
          Otras herramientas útiles de PlayComun
        </h3>
        <p className="text-sm text-gray-600">
          Descubrí más utilidades gratuitas para potenciar tu trabajo diario:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Link
            href="/herramientas/convertidor-archivos"
            className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-violet-500 hover:shadow-md transition-all group"
          >
            <h4 className="text-sm font-bold text-gray-900 group-hover:text-violet-600 transition-colors">
              Convertidor de archivos
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Convertí entre Word, Excel, PowerPoint, imágenes y PDF con alta fidelidad.
            </p>
          </Link>

          <Link
            href="/herramientas/compresor-imagenes"
            className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-violet-500 hover:shadow-md transition-all group"
          >
            <h4 className="text-sm font-bold text-gray-900 group-hover:text-violet-600 transition-colors">
              Compresor de imágenes
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Reducí el peso de fotos JPG, PNG y WebP manteniendo nitidez visual.
            </p>
          </Link>
        </div>
      </section>
    </div>
  )
}
