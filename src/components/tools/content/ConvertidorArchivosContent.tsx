import React from "react"
import Link from "next/link"
import {
  FileText,
  FileCheck,
  ShieldCheck,
  Zap,
  ArrowRightLeft,
  HelpCircle,
  AlertCircle,
  Laptop,
  Cpu,
} from "lucide-react"

export function ConvertidorArchivosContent() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0 font-sans space-y-12">
      {/* 1. Introducción y Propósito */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          ¿Cómo funciona el convertidor de archivos de PlayComun?
        </h2>
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
          Nuestra herramienta te permite <strong>convertir archivos y documentos</strong> entre los formatos más utilizados en oficinas, negocios y estudios: documentos Word, planillas Excel, presentaciones PowerPoint, imágenes JPG, PNG y WebP, y documentos estándar PDF y PDF/A. Cada operación ejecuta una transformación real del contenido y no un simple renombrado de extensiones.
        </p>
        <p className="text-base text-gray-700 leading-relaxed">
          Diseñamos una arquitectura híbrida que prioriza la <strong>privacidad total</strong>: todas las conversiones de imágenes y manipulación de PDF se realizan directamente en tu propio dispositivo utilizando la aceleración gráfica y el motor de JavaScript de tu navegador. Para documentos complejos de oficina que requieren fidelidad tipográfica absoluta, el sistema se apoya en un servicio de procesamiento basado en motores de código abierto, sin enviar tus archivos a plataformas comerciales de terceros.
        </p>
      </section>

      {/* 2. Categorías Principales */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          Operaciones documentales disponibles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <FileText className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">
              Convertir a PDF
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Transformá documentos de Word (DOC, DOCX), planillas de Excel (XLS, XLSX), presentaciones de PowerPoint (PPT, PPTX), formatos OpenDocument (ODT, ODS, ODP) e imágenes (JPG, PNG, WebP) en archivos PDF universales listos para imprimir o compartir.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">
              Convertir desde PDF
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Extraé texto estructurado a documentos editables de Word (.docx), recuperá datos tabulares reales en planillas de Excel (.xlsx), generá diapositivas fieles de PowerPoint (.pptx) o convertí tus archivos a PDF/A para preservación a largo plazo.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">
              Convertir a Imágenes
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Renderizá las páginas de un archivo PDF como imágenes JPG o PNG individuales en alta definición (150 o 300 DPI). Podés elegir qué páginas extraer y descargar todas en un único archivo comprimido ZIP.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Realidad Técnica y Limitaciones Honestas */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          Compromiso técnico: La realidad de convertir desde PDF
        </h3>
        <p className="text-gray-700 leading-relaxed">
          En PlayComun no hacemos falsas promesas. El formato PDF fue concebido para representar páginas fijas con posiciones exactas de dibujo, no para estructurar texto fluido o celdas de cálculo. Por eso, tratamos cada conversión con honestidad técnica:
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-violet-600" />
              <span>PDF a Word: Documentos digitales vs. documentos escaneados</span>
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Si tu PDF fue generado digitalmente desde un procesador de texto, la herramienta reconstruye párrafos, encabezados y saltos de página en un documento DOCX editable. Si el PDF es un escaneo de papel compuesto únicamente por fotos planas, el archivo carece de capa de texto digital; en esos casos, la herramienta te informará que se requiere un motor de OCR para no entregarte un archivo vacío o corrupto.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-violet-600" />
              <span>PDF a Excel: Detección tabular honesta</span>
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Analizamos la alineación horizontal y vertical del contenido para identificar tablas, filas y columnas genuinas. Si el documento contiene tablas legibles, se exportan a celdas reales de XLSX. Si el PDF contiene texto libre o narrativa sin estructura de filas y columnas, la herramienta no inventará tablas artificiales y te lo advertirá con claridad.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-violet-600" />
              <span>PDF a PowerPoint: Fidelidad visual completa</span>
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Para garantizar que no se rompan las tipografías ni se desalineen las figuras de tu presentación, cada página del PDF se convierte en una diapositiva en alta resolución. Esto asegura que la apariencia visual sea idéntica a la original, aunque los elementos internos se presentan como diapositiva gráfica y no como bloques de texto vectoriales sueltos.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Privacidad y Seguridad */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          Privacidad garantizada en cada documento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Laptop className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-gray-900">
              Procesamiento Local en el Navegador
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Las conversiones de imágenes a PDF, de PDF a imágenes, y las extracciones de PDF se ejecutan 100% en tu computadora o teléfono. Tus archivos nunca salen de tu dispositivo ni se transfieren a servidores externos.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Cpu className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-gray-900">
              Servicio Documental Efímero
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Para documentos de Word, Excel y PowerPoint que requieran el motor de oficina, los archivos se procesan temporalmente en un entorno aislado con nombres aleatorios y se eliminan inmediatamente tras finalizar la conversión. No guardamos copias ni registros.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Herramientas Complementarias */}
      <section className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
        <h4 className="text-base font-bold text-gray-900">
          ¿Buscás optimizar el peso de tus imágenes?
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          Si necesitás reducir los kilobytes de tus fotografías sin cambiar su formato documental, te recomendamos utilizar nuestro{" "}
          <Link
            href="/herramientas/compresor-imagenes"
            className="text-violet-600 font-bold hover:underline"
          >
            Compresor de imágenes online
          </Link>
          , diseñado específicamente para balancear compresión visual y calidad sin pérdida perceptible.
        </p>
      </section>
    </div>
  )
}
