import React from "react"
import Link from "next/link"
import {
  ShieldCheck,
  MapPin,
  Camera,
  FileCheck2,
  Lock,
  Layers,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"

export function EliminarMetadatosExifContent() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0 font-sans space-y-12">
      {/* 1. Introducción y Propósito */}
      <section className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          ¿Qué son los metadatos EXIF y por qué eliminarlos antes de compartir fotos?
        </h2>
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
          Cada vez que tomás una fotografía con tu teléfono móvil o cámara digital, el dispositivo guarda automáticamente información oculta dentro del archivo. Estos datos, conocidos como <strong>metadatos EXIF (Exchangeable Image File Format)</strong>, incluyen con frecuencia las <strong>coordenadas geográficas exactas (GPS)</strong> de dónde estabas parado, el modelo de tu teléfono, la fecha y hora precisa del disparo y configuraciones de la lente.
        </p>
        <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
          Al compartir estas imágenes por mensajería, correo electrónico o publicarlas en foros y sitios web, cualquier persona con una herramienta básica de inspección puede extraer tu domicilio, lugar de trabajo o rutinas diarias. Nuestra herramienta te permite <strong>eliminar metadatos EXIF online de forma real y 100% privada</strong> directamente desde tu navegador.
        </p>
      </section>

      {/* 2. Qué metadatos detecta y elimina la herramienta */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          Metadatos que se detectan y eliminan por formato
        </h3>
        <p className="text-gray-700 leading-relaxed">
          Cada formato almacena sus datos de una forma específica. El limpiador de PlayComun analiza los segmentos binarios exactos sin afectar los datos esenciales de visualización:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-brand">
              <MapPin className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-gray-900">
              Ubicación y privacidad
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Coordenadas de latitud, longitud y altitud GPS, nombres de satélites y marcas de tiempo de geolocalización vinculadas al momento de captura.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-brand">
              <Camera className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-gray-900">
              Datos de equipo y fecha
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Marca y modelo del dispositivo móvil o cámara, números de serie, software de edición, fecha, hora original y miniatura JPEG incrustada.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-brand">
              <Layers className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-gray-900">
              Bloques IPTC, XMP y comentarios
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Segmentos descriptivos de Photoshop, perfiles XMP, campos de comentarios (COM) y fragmentos equivalentes en archivos PNG y WebP.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Proceso sin pérdida de calidad (Lossless) */}
      <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          Eliminación binaria directa sin pérdida de calidad
        </h3>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          A diferencia de herramientas que decodifican y vuelven a comprimir la imagen en un lienzo perdiendo nitidez y fidelidad de compresión, PlayComun utiliza una <strong>estrategia binaria sin pérdidas (lossless)</strong> siempre que la orientación sea estándar:
        </p>
        <ul className="space-y-2 text-sm sm:text-base text-gray-700 list-disc list-inside">
          <li>
            <strong>En JPEG:</strong> se extraen selectivamente los marcadores APP1 (EXIF/XMP), APP13 (IPTC) y COM sin tocar la carga comprimida de píxeles (SOS). La calidad visual original permanece al 100%.
          </li>
          <li>
            <strong>En PNG:</strong> se retiran los bloques de metadatos (eXIf, tEXt, zTXt, iTXt) preservando las tablas de compresión y transparencia intactas.
          </li>
          <li>
            <strong>En WebP:</strong> se limpian los fragmentos EXIF y XMP manteniendo los datos de compresión nativos.
          </li>
          <li>
            <strong>Fotografías verticales o rotadas:</strong> si la imagen depende de la etiqueta EXIF de orientación para verse derecha, el motor aplica la rotación real en los píxeles para que la foto no se vea volteada al quitar el metadato.
          </li>
        </ul>
      </section>

      {/* 4. Privacidad garantizada */}
      <section className="space-y-4">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          100% Privado: procesamiento local en tu navegador
        </h3>
        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
          Tus imágenes contienen información confidencial. Es por eso que esta herramienta está diseñada para procesar absolutamente todo en la memoria RAM local de tu navegador. <strong>Ningún archivo se envía a servidores de PlayComun ni a terceros.</strong> Podés desconectar tu conexión a Internet una vez cargada la página y la herramienta seguirá funcionando con total normalidad.
        </p>
      </section>

      {/* 5. Preguntas Frecuentes */}
      <section className="space-y-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          Preguntas frecuentes sobre eliminación de metadatos
        </h3>

        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand shrink-0" />
              ¿Eliminar los metadatos cambia el tamaño visual o la calidad de la foto?
            </h4>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              No. El ancho y alto en píxeles se mantienen idénticos. Al eliminar los bloques de metadatos sin descomprimir la información de color, el peso del archivo puede reducirse ligeramente (entre unos pocos kilobytes y varios megabytes si contenía miniaturas incrustadas), pero la nitidez visual se conserva intacta.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand shrink-0" />
              ¿Qué pasa si mi foto ya estaba limpia?
            </h4>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              La herramienta inspecciona cada archivo y te informa si ya no contenía metadatos de privacidad detectables. No declaramos falsamente que se borró información si nunca existió en el archivo.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand shrink-0" />
              ¿Puedo procesar varias imágenes al mismo tiempo?
            </h4>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Sí. Podés seleccionar o arrastrar un lote de fotografías a la vez, revisar el estado de cada una y descargarlas individualmente o en un único archivo comprimido ZIP con todas las imágenes limpias.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Herramientas Relacionadas */}
      <section className="pt-6 border-t border-gray-200 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">
          Otras herramientas de imágenes y utilidades recomendadas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            href="/herramientas/compresor-imagenes"
            className="group p-4 rounded-xl border border-gray-200 hover:border-brand/40 hover:bg-purple-50/20 transition-all flex flex-col justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-brand transition-colors">
                Compresor de imágenes
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Reducí el peso de tus fotos JPG, PNG y WebP manteniendo la calidad visual.
              </p>
            </div>
            <span className="text-xs font-medium text-brand mt-3 inline-flex items-center gap-1 group-hover:underline">
              Ir a la herramienta <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            href="/herramientas/convertidor-archivos"
            className="group p-4 rounded-xl border border-gray-200 hover:border-brand/40 hover:bg-purple-50/20 transition-all flex flex-col justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-brand transition-colors">
                Convertidor de archivos
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Convertí formatos de imágenes, documentos y archivos de audio al instante.
              </p>
            </div>
            <span className="text-xs font-medium text-brand mt-3 inline-flex items-center gap-1 group-hover:underline">
              Ir a la herramienta <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            href="/herramientas/generador-favicon"
            className="group p-4 rounded-xl border border-gray-200 hover:border-brand/40 hover:bg-purple-50/20 transition-all flex flex-col justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-brand transition-colors">
                Generador de favicons
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Creá paquetes de favicons ICO, Apple Touch y WebManifest para tu web.
              </p>
            </div>
            <span className="text-xs font-medium text-brand mt-3 inline-flex items-center gap-1 group-hover:underline">
              Ir a la herramienta <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  )
}
