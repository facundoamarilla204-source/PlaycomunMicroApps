import Link from 'next/link'
import {
  FileText,
  Receipt,
  Wrench,
  FileSpreadsheet,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Coins,
} from 'lucide-react'

export function GeneradorFacturasContent() {
  return (
    <div className="space-y-12 text-slate-700 leading-relaxed">
      {/* INTRODUCCIÓN GENERAL */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-3">
          Documentos comerciales claros y listos para enviar a tus clientes
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          Emitir presupuestos, recibos o constancias de servicio en hojas de cálculo o editores de texto suele derivar en fórmulas desajustadas, tipografías inconsistentes o márgenes rotos al exportar a PDF.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Esta herramienta reúne los cuatro formatos de comprobante más utilizados en la actividad comercial cotidiana: <strong>Presupuestos, Recibos de pago, Órdenes de trabajo y Facturas proforma</strong>. Cada uno estructura sus campos según su función real, calcula importes y descuentos con matemática decimal precisa y genera un PDF vectorial auténtico, liviano y con texto seleccionable.
        </p>
      </div>

      {/* GUÍA DE LOS 4 TIPOS DE DOCUMENTOS */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-5">
          Estructura y uso de cada tipo de comprobante
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
          {/* 1. PRESUPUESTO */}
          <div className="p-4.5 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2.5">
            <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
              <FileText className="w-4.5 h-4.5 text-purple-600" />
              Presupuesto Comercial
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Propuesta comercial previa a la confirmación de una venta o servicio. Especifica productos o tareas, cantidades, precios unitarios, descuentos y la <strong>fecha límite de validez de la oferta</strong> para resguardar costos ante variaciones de insumos.
            </p>
            <div className="text-[11px] font-medium text-purple-900 bg-purple-100/80 px-2.5 py-0.5 rounded">
              Uso: Servicios profesionales, diseño, oficios, instalaciones y presupuestos de obra.
            </div>
          </div>

          {/* 2. RECIBO DE PAGO */}
          <div className="p-4.5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <Receipt className="w-4.5 h-4.5 text-emerald-600" />
              Recibo de Pago y Seña
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Constancia de cobro que documenta el <strong>monto percibido en el acto</strong>, el medio de pago utilizado, el concepto abonado, el total acordado de la operación y el <strong>saldo pendiente</strong> que resta liquidar.
            </p>
            <div className="text-[11px] font-medium text-emerald-900 bg-emerald-100/80 px-2.5 py-0.5 rounded">
              Uso: Cobro de señas, adelantos de trabajo, cuotas y cancelaciones finales.
            </div>
          </div>

          {/* 3. ORDEN DE TRABAJO */}
          <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
            <div className="flex items-center gap-2.5 text-blue-700 font-bold text-base">
              <Wrench className="w-5 h-5" />
              Orden de Trabajo Técnica
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Es el comprobante de recepción y seguimiento para servicios técnicos y talleres. Incluye la individualización del equipo, vehículo o inmueble (marca, modelo, número de serie o patente), la <strong>falla manifestada por el cliente</strong>, el diagnóstico previo, repuestos utilizados, fecha prometida de entrega y cláusulas de garantía.
            </p>
            <div className="text-[11px] font-semibold text-blue-800 bg-blue-100/70 px-2.5 py-1 rounded-md inline-block">
              Ideal para: Reparación de celulares, computadoras, talleres mecánicos y service de electrodomésticos.
            </div>
          </div>

          {/* 4. FACTURA PROFORMA */}
          <div className="p-5 rounded-2xl border border-slate-300 bg-slate-50 space-y-3">
            <div className="flex items-center gap-2.5 text-slate-800 font-bold text-base">
              <FileSpreadsheet className="w-5 h-5" />
              Factura Proforma (Informativa)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Un documento informativo que anticipa con exactitud los datos de una venta propuesta. Es ampliamente solicitada por empresas, administraciones públicas y entidades financieras para aprobar presupuestos corporativos, autorizar giros bancarios o solicitar créditos comerciales antes de emitir la factura definitiva.
            </p>
            <div className="text-[11px] font-semibold text-slate-800 bg-slate-200/80 px-2.5 py-1 rounded-md inline-block">
              Ideal para: Mayoristas, distribuidores, proveedores industriales y operaciones comerciales corporativas.
            </div>
          </div>
        </div>
      </div>

      {/* DIFERENCIA CON FACTURAS FISCALES DE ARCA (AFIP) */}
      <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50/50">
        <h3 className="text-lg font-bold text-amber-950 flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          Aclaración legal: ¿Estos documentos reemplazan una factura fiscal?
        </h3>
        <p className="text-sm text-amber-900 leading-relaxed mb-3">
          <strong>No.</strong> En Argentina, los comprobantes fiscales autorizados son regulados y emitidos exclusivamente a través de los sistemas oficiales de <strong>ARCA (Agencia de Recaudación y Control Aduanero, ex-AFIP)</strong> con Código de Autorización Electrónico (CAE), código de barras y regímenes formales (Facturas A, B, C, etc.).
        </p>
        <p className="text-sm text-amber-900 leading-relaxed">
          Los documentos generados en esta herramienta son <strong>comprobantes comerciales, de gestión interna, cotización y constancia entre partes</strong>. No generan crédito fiscal ni reemplazan las obligaciones tributarias vigentes. Podés utilizarlos libremente para acordar condiciones, recibir señas, entregar diagnósticos y cotizar sin necesidad de autorizaciones previas.
        </p>
      </div>

      {/* TABLA COMPARATIVA */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          Comparativa rápida de documentos
        </h3>
        <div className="overflow-x-auto not-prose rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Documento</th>
                <th className="py-3 px-4">Momento de entrega</th>
                <th className="py-3 px-4">Finalidad principal</th>
                <th className="py-3 px-4">Valor fiscal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-600">
              <tr>
                <td className="py-3 px-4 font-bold text-purple-700">Presupuesto</td>
                <td className="py-3 px-4">Antes de concretar la venta</td>
                <td className="py-3 px-4">Proponer precios, plazos y condiciones comerciales</td>
                <td className="py-3 px-4 text-slate-400">Sin valor fiscal</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-emerald-700">Recibo de pago</td>
                <td className="py-3 px-4">Al recibir dinero o seña</td>
                <td className="py-3 px-4">Acreditar el cobro y constatar saldo restante</td>
                <td className="py-3 px-4 text-slate-400">Sin valor fiscal (recibo X)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-blue-700">Orden de trabajo</td>
                <td className="py-3 px-4">Al ingresar el equipo o vehículo</td>
                <td className="py-3 px-4">Registrar diagnóstico, tareas y condiciones de retiro</td>
                <td className="py-3 px-4 text-slate-400">Constancia de servicio</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-800">Factura Proforma</td>
                <td className="py-3 px-4">Previo al pago en B2B</td>
                <td className="py-3 px-4">Aprobación administrativa previa de compras</td>
                <td className="py-3 px-4 text-slate-400">Comprobante informativo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* GUÍA PASO A PASO */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          Cómo generar tu documento en 4 sencillos pasos
        </h3>
        <ol className="list-decimal list-inside space-y-3 text-sm text-slate-700">
          <li>
            <strong>Elegí el tipo de comprobante:</strong> Seleccioná si necesitás un presupuesto, recibo, orden técnica o proforma para que el formulario adapte sus campos.
          </li>
          <li>
            <strong>Cargá tus datos comerciales:</strong> Ingresá el nombre de tu emprendimiento, teléfono, dirección y subí el logo de tu negocio para que aparezca en el encabezado.
          </li>
          <li>
            <strong>Agregá las líneas de productos o servicios:</strong> Definí cantidad, precio unitario y descuentos por ítem. Los importes y subtotales se calculan al instante con precisión decimal.
          </li>
          <li>
            <strong>Revisá la vista previa y descargá el PDF:</strong> Personalizá el color de acento y la plantilla, añadí notas bancarias o de garantía y hacé clic en <em>Descargar PDF</em> o compartilo por WhatsApp.
          </li>
        </ol>
      </div>

      {/* ENLACES INTERNOS A OTRAS HERRAMIENTAS */}
      <div className="pt-6 border-t border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          Herramientas complementarias para calcular precios y costos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 not-prose">
          <Link
            href="/herramientas/generador-listas-precios"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-bold text-purple-600 mb-1 flex items-center gap-1">
                Catálogos en PDF
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                Generador de listas de precios
              </h4>
              <p className="text-xs text-slate-500">
                Creá catálogos de productos organizados por categorías y exportalos a PDF con tu marca.
              </p>
            </div>
          </Link>

          <Link
            href="/herramientas/calculadora-precios"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-bold text-purple-600 mb-1 flex items-center gap-1">
                Fijación de precios
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                Calculadora de precio de venta
              </h4>
              <p className="text-xs text-slate-500">
                Calculá tu margen de ganancia real contemplando costos fijos, variables e impuestos.
              </p>
            </div>
          </Link>

          <Link
            href="/herramientas/calculadora-iva"
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-bold text-purple-600 mb-1 flex items-center gap-1">
                Impuestos comerciales
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                Calculadora de IVA Argentina
              </h4>
              <p className="text-xs text-slate-500">
                Agregá o desglosá alícuotas del 21%, 10.5% y 27% sobre precios brutos o finales.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
