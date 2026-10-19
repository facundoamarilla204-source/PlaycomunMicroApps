import Link from "next/link"
import { ArrowRight, BookOpen, Calculator, FileCheck, FileSpreadsheet, ShieldAlert, Sparkles } from "lucide-react"

export function GeneradorPresupuestosContent() {
  return (
    <div className="w-full max-w-[760px] mx-auto space-y-10 text-foreground">
      {/* Banner destacado hacia la guía */}
      <div className="rounded-2xl border border-brand-border bg-gradient-to-br from-brand-light/90 to-purple-50/50 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-brand text-white shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand">
                Guía completa paso a paso
              </span>
              <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5 mb-1">
                Cómo hacer un presupuesto profesional para un cliente
              </h3>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Aprendé qué cláusulas incluir, cómo calcular el margen de ganancia, fijar plazos de validez y estructurar una propuesta comercial exitosa en Argentina.
              </p>
            </div>
          </div>
          <Link
            href="/guias/como-hacer-un-presupuesto-profesional"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold shrink-0 transition-all shadow-xs hover:-translate-y-0.5"
          >
            Leer guía completa
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Contenido editorial estructurado */}
      <div className="prose prose-neutral max-w-none prose-headings:font-bold prose-headings:text-foreground prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-foreground/80 prose-p:leading-relaxed prose-strong:font-semibold prose-strong:text-foreground prose-a:text-brand hover:prose-a:text-brand-hover">
        <h2>¿Qué es un presupuesto comercial y por qué es clave para cerrar ventas?</h2>
        <p>
          Un <strong>presupuesto comercial</strong> (o cotización) es la propuesta formal en la que un profesional, comercio o pequeña empresa detalla con precisión el alcance, el valor y las condiciones de entrega de sus productos o servicios antes de iniciar un trabajo.
        </p>
        <p>
          Enviar un presupuesto claro y con diseño profesional no solo despeja dudas del comprador: genera confianza inmediata, fija un marco de seriedad y previene desacuerdos posteriores sobre qué estaba incluido y qué no en el precio convenido.
        </p>

        <h2>Cómo completar tu presupuesto en el generador paso a paso</h2>
        <p>
          Nuestra herramienta interactiva fue diseñada para que obtengas un documento listo para compartir en menos de dos minutos. El proceso se divide en cuatro pasos sencillos:
        </p>
        <ol>
          <li>
            <strong>Datos del emisor (tu negocio):</strong> Cargá el nombre o marca de tu emprendimiento, tu CUIT o DNI, condición tributaria (por ejemplo, Monotributista o Responsable Inscripto), dirección y vías de contacto (teléfono y correo). Opcionalmente podés adjuntar el logotipo de tu marca desde tu dispositivo para que encabece el documento.
          </li>
          <li>
            <strong>Datos del cliente:</strong> Indicá a quién va dirigida la cotización (nombre o razón social, CUIT/DNI y domicilio). Esto le otorga carácter personalizado y formal a la propuesta.
          </li>
          <li>
            <strong>Conceptos, cantidades y precios:</strong> Agregá cada producto o servicio con una descripción concisa, la cantidad requerida y su precio unitario. Si acordaste un beneficio especial, podés asignar un <em>porcentaje de descuento individual</em> por concepto. Si tenés dudas sobre tu margen de rentabilidad antes de presupuestar, apoyate en nuestra <Link href="/herramientas/calculadora-precios">calculadora de precios de venta</Link> para asegurar que tus costos queden cubiertos.
          </li>
          <li>
            <strong>Condiciones comerciales y descarga:</strong> Especificá la forma de pago (por ejemplo: transferencia, 50% de anticipo al confirmar y saldo contra entrega), el plazo de entrega estimado y la fecha límite de validez de la oferta. Por último, hacé clic en <strong>«Descargar PDF»</strong> o utilizá la opción de <strong>«Compartir»</strong> para enviar el enlace por WhatsApp.
          </li>
        </ol>

        <h2>Cálculo de importes: subtotales, descuentos e IVA en Argentina</h2>
        <p>
          El generador realiza todos los cálculos de manera automática para prevenir errores aritméticos que puedan perjudicar tu rentabilidad:
        </p>
        <ul>
          <li>
            <strong>Subtotal por ítem:</strong> Se calcula multiplicando la cantidad por el precio unitario y restando el descuento particular aplicado a esa línea de concepto.
          </li>
          <li>
            <strong>Subtotal general y descuentos globales:</strong> La herramienta suma todos los ítems netos y permite ingresar un descuento global o recargo financiero adicional sobre el importe acumulado.
          </li>
          <li>
            <strong>Tratamiento impositivo:</strong> Si sos <strong>Monotributista</strong>, tu cotización se expresa a precio final, dado que no generás débito fiscal. Si sos <strong>Responsable Inscripto</strong> y cotizás a clientes corporativos que computan crédito fiscal, podés activar el desglose del Impuesto al Valor Agregado aplicando la alícuota que corresponda (21% general o 10.5%). Si necesitás liquidar el impuesto en detalle, podés verificar tus números con nuestra <Link href="/herramientas/calculadora-iva">calculadora de IVA Argentina</Link>.
          </li>
        </ul>

        <h2>Diferencia legal entre Presupuesto, Remito y Factura fiscal de ARCA</h2>
        <p>
          Es fundamental distinguir el rol de cada documento comercial para operar con orden y cumplir con las obligaciones normativas en Argentina:
        </p>
      </div>

      {/* Tabla comparativa no-prose */}
      <div className="not-prose rounded-xl border border-border overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-subtle text-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3.5 font-bold">Comprobante</th>
                <th className="px-4 py-3.5 font-bold">Momento de emisión</th>
                <th className="px-4 py-3.5 font-bold">Efecto fiscal y legal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground-muted">
              <tr>
                <td className="px-4 py-3.5 font-semibold text-foreground">Presupuesto / Cotización</td>
                <td className="px-4 py-3.5">Etapa previa a la confirmación de la venta o servicio.</td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                    Sin validez fiscal
                  </span>
                  <div className="mt-1 text-xs text-foreground-subtle">Propuesta comercial para acordar precios, plazos y condiciones.</div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-semibold text-foreground">Remito comercial</td>
                <td className="px-4 py-3.5">Al momento de trasladar o entregar físicamente la mercadería.</td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md font-medium">
                    Constancia de entrega
                  </span>
                  <div className="mt-1 text-xs text-foreground-subtle">Acredita la recepción conforme por parte del cliente o transportista.</div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-semibold text-foreground">Factura Electrónica (A, B o C)</td>
                <td className="px-4 py-3.5">Al perfeccionarse la venta o percibirse el pago.</td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                    Comprobante oficial ARCA
                  </span>
                  <div className="mt-1 text-xs text-foreground-subtle">Documento tributario con CAE emitido ante la agencia fiscal nacional.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerta aclaratoria fiscal ARCA */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          <strong>Aclaración sobre la validez fiscal en Argentina:</strong> El documento generado por esta herramienta es una cotización comercial con fines organizativos y de propuesta formal para tus clientes. No constituye una factura electrónica ni reemplaza los comprobantes fiscales autorizados por <strong>ARCA (Agencia de Recaudación y Control Aduanero, ex AFIP)</strong>. Al concretar la operación comercial, recordá emitir la factura electrónica que corresponda según tu encuadre impositivo.
        </div>
      </div>

      {/* Funciones Free vs Pro */}
      <div className="prose prose-neutral max-w-none prose-headings:font-bold prose-headings:text-foreground prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-4 prose-p:text-foreground/80 prose-p:leading-relaxed">
        <h2>Funciones incluidas: Versión gratuita vs. Plan Pro</h2>
        <p>
          En PlayComun creemos en herramientas útiles y accesibles. Diseñamos el generador para que puedas utilizarlo sin restricciones en tu operatoria diaria, con opciones avanzadas de productividad en nuestro plan premium:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/10 mb-3">
              100% Gratis sin registro
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">Uso libre e ilimitado</h3>
            <ul className="text-xs sm:text-sm text-foreground-muted space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Descarga ilimitada de presupuestos en formato PDF de alta resolución.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Carga de logotipo propio y firma o sello digitalizado desde tu equipo.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Cálculos automáticos de subtotales, descuentos particulares e IVA.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Sin marcas de agua molestas ni publicidades sobre tu documento.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Guardado automático local en tu navegador para no perder el borrador actual.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-purple-50/40 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-light text-brand ring-1 ring-inset ring-brand/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Plan Pro para negocios
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">Productividad y gestión</h3>
            <ul className="text-xs sm:text-sm text-foreground-muted space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold">✓</span>
                <span><strong>Historial en la nube:</strong> Accedé a tus presupuestos anteriores desde cualquier computadora o celular.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold">✓</span>
                <span><strong>Agenda de clientes:</strong> Guardá CUIT, razón social y contactos frecuentes para cargarlos en un clic.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold">✓</span>
                <span><strong>Catálogo de ítems:</strong> Guardá tus productos y servicios con precios de lista para presupuestar más rápido.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold">✓</span>
                <span><strong>Perfil de empresa persistente:</strong> No vuelvas a cargar tus datos fiscales cada vez que abrís la app.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand font-bold">✓</span>
                <span><strong>Marca blanca:</strong> Eliminá por completo cualquier mención de la plataforma en el pie del PDF.</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border/60">
            <Link
              href="/planes"
              className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
            >
              Conocé las ventajas de PlayComun Pro <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Caja de herramientas complementarias */}
      <div className="not-prose rounded-2xl border border-slate-200 bg-surface-subtle p-6">
        <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-brand" />
          Herramientas complementarias para tus ventas
        </h3>
        <p className="text-xs text-foreground-muted leading-relaxed mb-4">
          Acompañá la emisión de tus presupuestos con nuestras utilidades comerciales gratuitas:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <Link
            href="/herramientas/calculadora-precios"
            className="p-3 rounded-xl border border-border bg-white hover:border-brand-border hover:shadow-xs transition-all group"
          >
            <span className="font-semibold text-foreground group-hover:text-brand block mb-0.5">
              Calculadora de precios de venta
            </span>
            <span className="text-foreground-subtle leading-tight block">
              Calculá markup, margen limpio y comisiones de cobro antes de cotizar.
            </span>
          </Link>
          <Link
            href="/herramientas/calculadora-iva"
            className="p-3 rounded-xl border border-border bg-white hover:border-brand-border hover:shadow-xs transition-all group"
          >
            <span className="font-semibold text-foreground group-hover:text-brand block mb-0.5">
              Calculadora de IVA Argentina
            </span>
            <span className="text-foreground-subtle leading-tight block">
              Desglosá alícuotas del 21%, 10.5% y 27% sobre importes netos o brutos.
            </span>
          </Link>
          <Link
            href="/herramientas/generador-documentos-comerciales"
            className="p-3 rounded-xl border border-border bg-white hover:border-brand-border hover:shadow-xs transition-all group"
          >
            <span className="font-semibold text-foreground group-hover:text-brand block mb-0.5">
              Generador de documentos comerciales
            </span>
            <span className="text-foreground-subtle leading-tight block">
              Confeccioná recibos de seña, órdenes de servicio y facturas proforma en PDF.
            </span>
          </Link>
          <Link
            href="/herramientas/generador-listas-precios"
            className="p-3 rounded-xl border border-border bg-white hover:border-brand-border hover:shadow-xs transition-all group"
          >
            <span className="font-semibold text-foreground group-hover:text-brand block mb-0.5">
              Generador de listas de precios
            </span>
            <span className="text-foreground-subtle leading-tight block">
              Creá catálogos de productos ordenados por categoría para enviar a tus clientes.
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
