import Link from "next/link"

export function GeneradorPresupuestosContent() {
  return (
    <div className="prose prose-neutral max-w-[720px] prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-foreground/80 prose-p:leading-relaxed prose-strong:font-semibold prose-strong:text-foreground prose-a:text-brand hover:prose-a:text-brand-dark">
      <h2>¿Qué es un presupuesto y por qué es importante para tu negocio?</h2>
      <p>
        Un presupuesto es un documento comercial mediante el cual un profesional o una empresa detalla el costo de un producto o servicio antes de que el cliente tome la decisión de compra. A diferencia de una factura, un presupuesto no tiene valor fiscal, sino que funciona como una propuesta formal que establece las condiciones de trabajo, los importes y las obligaciones de ambas partes.
      </p>
      <p>
        Entregar una cotización bien diseñada no solo te ayuda a organizar tu trabajo, sino que transmite confianza y seriedad. Utilizar un <strong>generador de presupuestos</strong> te asegura que todos los datos importantes estén presentes, aumentando las probabilidades de que el cliente acepte tu oferta.
      </p>

      <h2>Ventajas de hacer un presupuesto online</h2>
      <p>
        Antiguamente, crear un documento de este tipo requería pelear con plantillas de Word o Excel, ajustando márgenes y fórmulas. Al <strong>hacer un presupuesto online</strong>, te ahorrás ese dolor de cabeza. Las ventajas principales de usar nuestro <strong>generador de presupuestos gratis</strong> son:
      </p>
      <ul>
        <li><strong>Velocidad:</strong> En menos de un minuto podés completar la información y enviarla.</li>
        <li><strong>Diseño profesional automático:</strong> No tenés que saber de diseño gráfico para que tu documento luzca increíble.</li>
        <li><strong>Cálculos sin errores:</strong> Los subtotales, descuentos y el total se calculan de manera automática para evitar perder dinero por un error de tipeo.</li>
        <li><strong>Fácil de enviar:</strong> Podés descargar tu <strong>presupuesto en PDF</strong> al instante y enviarlo por WhatsApp o email sin que se mueva ningún elemento del diseño.</li>
      </ul>

      <h2>¿Qué información debe incluir para ser válido?</h2>
      <p>
        Para <strong>crear un presupuesto</strong> claro y profesional, asegurate de incluir siempre:
      </p>
      <ul>
        <li><strong>Tus datos:</strong> Nombre o razón social, teléfono, email de contacto y (opcionalmente) dirección y CUIT.</li>
        <li><strong>Datos del cliente:</strong> A quién va dirigida la propuesta comercial.</li>
        <li><strong>Fechas clave:</strong> La fecha de emisión y, sobre todo en contextos de inflación, la fecha de vencimiento de la oferta.</li>
        <li><strong>Conceptos detallados:</strong> Una lista de los servicios o productos con su descripción, cantidad, precio unitario y descuento si lo hubiera.</li>
        <li><strong>Condiciones comerciales:</strong> Podés usar el campo de "Observaciones" para detallar la forma de pago (por ejemplo, 50% de adelanto), los plazos de entrega, o qué aspectos no están incluidos en el precio.</li>
      </ul>

      <h2>¿En qué se diferencia de una Factura o un Remito?</h2>
      <div className="not-prose my-6 rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-50 text-neutral-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Documento</th>
              <th className="px-4 py-3 font-semibold">Momento de uso</th>
              <th className="px-4 py-3 font-semibold">Valor legal/fiscal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            <tr>
              <td className="px-4 py-3"><strong>Presupuesto</strong></td>
              <td className="px-4 py-3">Antes de la venta (como propuesta).</td>
              <td className="px-4 py-3">Ninguno. Es un acuerdo comercial.</td>
            </tr>
            <tr>
              <td className="px-4 py-3"><strong>Remito</strong></td>
              <td className="px-4 py-3">Al momento de entregar la mercadería.</td>
              <td className="px-4 py-3">Legal. Comprueba la entrega física.</td>
            </tr>
            <tr>
              <td className="px-4 py-3"><strong>Factura</strong></td>
              <td className="px-4 py-3">Al finalizar la venta o cobrar.</td>
              <td className="px-4 py-3">Fiscal. Comprueba la venta ante AFIP.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Paso a paso: cómo hacer un presupuesto online en PDF</h2>
      <ol>
        <li><strong>Completá tus datos de contacto:</strong> Ingresá tu nombre o marca, teléfono y correo electrónico para que tu cliente sepa a quién responderle.</li>
        <li><strong>Definí al destinatario:</strong> Indicá el nombre de la persona o empresa y la fecha de validez de la propuesta.</li>
        <li><strong>Detallá los conceptos y precios:</strong> Agregá cada servicio o producto. Si tenés dudas sobre tus costos o márgenes antes de cotizar, podés ayudarte con nuestra <Link href="/herramientas/calculadora-precios">calculadora de precio de venta</Link> para no presupuestar por debajo de tus costos.</li>
        <li><strong>Revisá la vista previa y descargá:</strong> Hacé clic en "Descargar PDF" para obtener tu archivo listo para compartir por WhatsApp o email sin marcas de agua molestas.</li>
      </ol>

      <div className="not-prose my-8 p-6 rounded-2xl bg-purple-50/60 border border-purple-200/80">
        <h3 className="text-base font-bold text-purple-950 mb-2">Herramientas complementarias para tu negocio</h3>
        <p className="text-xs text-purple-900/80 leading-relaxed mb-3">
          Optimizá tu ciclo de ventas combinando el presupuesto con otras herramientas de PlayComun:
        </p>
        <ul className="text-xs text-purple-900 space-y-1.5 list-disc list-inside">
          <li>Para emitir comprobantes de cobro o señas de trabajo, usá el <Link href="/herramientas/generador-documentos-comerciales" className="font-semibold underline hover:text-brand">generador de documentos comerciales</Link>.</li>
          <li>Para actualizar tu catálogo completo con aumentos masivos, utilizá el <Link href="/herramientas/generador-listas-precios" className="font-semibold underline hover:text-brand">generador de listas de precios en PDF</Link>.</li>
          <li>Para calcular con exactitud el impacto impositivo de tus propuestas, consultá la <Link href="/herramientas/calculadora-iva" className="font-semibold underline hover:text-brand">calculadora de IVA Argentina</Link>.</li>
        </ul>
      </div>
    </div>
  )
}


