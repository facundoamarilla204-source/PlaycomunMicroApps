import React from "react"
import Link from "next/link"
import {
  FileCheck,
  Smartphone,
  ShieldCheck,
  Type,
  PenTool,
  Building2,
  Lock,
  Layers,
  ArrowRight,
} from "lucide-react"

export function FirmarPdfContent() {
  return (
    <article className="space-y-12 text-slate-700 leading-relaxed">
      {/* SECCIÓN 1: INTRODUCCIÓN Y BENEFICIOS CLAVE */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Firmar PDF online gratis sin registros ni complicaciones
        </h2>
        <p>
          En PlayComun Online desarrollamos una herramienta completa para <strong>firmar PDF online</strong> directamente desde tu navegador web, sin necesidad de crear una cuenta, instalar programas pesados ni abonar suscripciones mensuales. Ya sea que necesites rubricar un contrato comercial, autorizar un presupuesto, firmar un recibo de sueldo o dar el visto bueno a un documento académico, podés hacerlo en pocos segundos manteniendo el control total de tus archivos.
        </p>
        <p>
          El editor te brinda múltiples formas de plasmar tu rúbrica: podés <strong>escribir tu firma</strong> seleccionando tipografías cursivas y caligráficas de alta calidad, <strong>dibujar tu firma</strong> a mano alzada con el mouse o la pantalla táctil, <strong>firmar desde el celular con un código QR</strong> sincronizado en tiempo real, o <strong>subir una imagen de tu firma</strong> eliminando automáticamente el fondo blanco del papel.
        </p>
      </section>

      {/* SECCIÓN 2: PASO A PASO */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Cómo agregar una firma a un documento PDF paso a paso
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-brand font-bold flex items-center justify-center text-base">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">Cargá tu archivo PDF</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Arrastrá tu documento a la zona de carga o hacé clic para elegirlo desde tu computadora o teléfono. El archivo se analiza y renderiza de forma local en tu navegador sin subirse a servidores externos.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-brand font-bold flex items-center justify-center text-base">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">Creá y ubicá tu firma</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Elegí tu método preferido: escribí con estilos cursivos, dibujá el trazo con tu dedo, escaneá el QR con tu celular o subí tu imagen. Ajustá el tamaño, la posición y la página correspondiente.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-brand font-bold flex items-center justify-center text-base">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">Descargá el PDF firmado</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Presioná el botón de descarga. Nuestro motor incrusta de forma real los elementos gráficos dentro de la estructura nativa del PDF original, generando un archivo final limpio y compatible.
            </p>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: MODALIDADES DE CREACIÓN DE FIRMAS */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Cuatro métodos para crear tu firma personalizada
        </h2>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Type className="w-5 h-5 text-brand" />
              1. Escribir mi firma con estilos tipográficos manuscritos
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Si buscás una firma prolija y estilizada, ingresá tu nombre completo en el editor. Podrás previsualizar en tiempo real 8 estilos tipográficos diferentes: desde caligrafías formales hasta trazos cursivos naturales y estilos de bolígrafo tradicional. Podés personalizar el color de la tinta (negro clásico, azul marino formal, azul real o violeta) o ingresar un código de color HEX propio. La firma se genera con fondo transparente en alta resolución vectorial.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-brand" />
              2. Dibujar mi firma en la pizarra interactiva
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Para un trazo auténtico y personalizado, utilizá la pizarra digital. La herramienta captura eventos de puntero de alta precisión para brindar fluidez con el mouse, una tableta gráfica o pantallas táctiles. Incluye control de grosor de trazo (fino, normal, grueso), selector de color, opción para deshacer trazo a trazo y limpieza total. Al finalizar, el sistema recorta automáticamente los márgenes en blanco para dejar únicamente la rúbrica centrada.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-brand" />
              3. Firmar desde el celular mediante código QR
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Dibujar con el mouse en una computadora de escritorio puede resultar incómodo. Por eso diseñamos la función <strong>Firmar desde el celular</strong>: la computadora genera un código QR efímero y seguro. Al escanearlo con la cámara de tu smartphone, se abre una interfaz táctil dedicada donde podés firmar con el dedo en tu pantalla. Al presionar confirmar, la firma se transfiere al instante a tu computadora para colocarla en el documento.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand" />
              4. Subir imagen de firma o logo de empresa
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Si ya disponés de una firma escaneada o fotografiada, podés subirla en formato PNG, JPG o WebP. Nuestra herramienta incluye un algoritmo local para <strong>quitar el fondo blanco de papel</strong> mediante análisis de luminosidad en el navegador, preservando los trazos oscuros sobre un fondo transparente. Asimismo, podés subir el logo de tu empresa para incluirlo como membrete en tus documentos manteniendo su proporción exacta.
            </p>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: INICIALES Y REPETICIÓN EN MÚLTIPLES PÁGINAS */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Iniciales y foliado de páginas múltiples
        </h2>
        <p>
          En contratos y acuerdos extensos es práctica habitual colocar las iniciales del firmante al pie de cada una de las hojas y la firma principal únicamente en la última página. Con nuestra herramienta podés generar tus <strong>iniciales</strong> de manera independiente a tu firma completa, ajustar su tamaño y duplicarlas en todas las páginas o en las páginas específicas que selecciones con un solo clic.
        </p>
      </section>

      {/* SECCIÓN 5: PRIVACIDAD Y SEGURIDAD TÉCNICA */}
      <section className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-200">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <h2>Privacidad garantizada y procesamiento local en el navegador</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          A diferencia de otros servicios en la nube que almacenan copias de tus documentos confidenciales en servidores remotos, PlayComun Online procesa tus archivos PDF <strong>completamente en la memoria de tu dispositivo</strong> mediante bibliotecas del lado del cliente como PDF.js y pdf-lib. El archivo original nunca se sube a bases de datos ni a almacenamiento en la nube.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Cuando utilizás la función de firma con código QR, el documento PDF permanece en tu computadora. Únicamente viaja entre el celular y la PC el trazo transparente de la firma a través de un canal efímero identificado con tokens criptográficos aleatorios. La sesión expira en 15 minutos y los datos temporales se eliminan de inmediato una vez recibida la firma.
        </p>
      </section>

      {/* SECCIÓN 6: ALCANCE LEGAL Y CLARIDAD SOBRE EL TIPO DE FIRMA */}
      <section className="space-y-4 p-6 bg-purple-50/50 rounded-3xl border border-purple-100">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
          <Lock className="w-6 h-6 text-brand" />
          <h2>Alcance legal: firma electrónica visual vs firma digital criptográfica</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Esta herramienta tiene como finalidad insertar una <strong>representación visual de firma electrónica</strong> en un documento PDF. Es importante destacar que la incorporación de una imagen o trazo manuscrito en un PDF no equivale, por sí sola, a una firma digital basada en certificados criptográficos emitidos por una autoridad certificante licenciada.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Para trámites notariales, judiciales o licitaciones públicas que exijan por ley firma digital con token criptográfico (según la Ley de Firma Digital aplicable en cada país), se requiere un certificado de hardware específico. Para acuerdos entre partes, contratos privados de alquiler o prestación de servicios, conformidades comerciales y autorizaciones internas, la firma electrónica visual es ampliamente utilizada y aceptada según el principio de libertad de formas y consentimiento de las partes involucradas.
        </p>
      </section>

      {/* SECCIÓN 7: HERRAMIENTAS RELACIONADAS RECOMENDADAS */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Otras herramientas gratuitas de PlayComun para tus documentos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/herramientas/ordenar-pdf"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-brand hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand transition-colors">
                Ordenar y unir PDF
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Organizá, combiná varios archivos, rotá hojas o dividí documentos en partes iguales o rangos.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-brand gap-1">
              <span>Probar herramienta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            href="/herramientas/generador-documentos-comerciales"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-brand hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand transition-colors">
                Generador de Facturas y Presupuestos
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Creá comprobantes comerciales profesionales en PDF con cálculo de impuestos y tu logo.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-brand gap-1">
              <span>Probar herramienta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            href="/herramientas/generador-qr"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-brand hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand transition-colors">
                Generador de códigos QR
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Creá códigos QR estáticos y dinámicos para enlaces, redes sociales y contacto comercial.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-brand gap-1">
              <span>Probar herramienta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>
    </article>
  )
}
