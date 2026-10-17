import { buildMetadata } from "@/lib/metadata"
import { Scale, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react"
import Link from "next/link"

export const metadata = buildMetadata({
  title: "Términos y condiciones de servicio",
  description: "Términos y condiciones generales de uso de PlayComun Online. Reglas de uso, suscripción Pro, pagos, cancelaciones y derechos del consumidor.",
  path: "/terminos",
})

export default function TerminosPage() {
  const lastUpdated = "16 de octubre de 2026"

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 mb-4">
            <Scale className="w-3.5 h-3.5" /> Condiciones de Uso
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
            Términos y Condiciones
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Última actualización: {lastUpdated}
          </p>
        </div>

        {/* Resumen de derechos clave */}
        <div className="bg-white border border-purple-100 rounded-2xl p-6 sm:p-8 shadow-xs mb-10 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
            Principios comerciales y de uso transparente
          </h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">•</span>
              <span><strong>Vigencia de tu período pagado:</strong> Si cancelás la renovación automática de PlayComun Pro, mantenés tu acceso premium hasta el último día del período que ya abonaste.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">•</span>
              <span><strong>Tus datos se conservan:</strong> La finalización de una suscripción Pro no borra tu cuenta ni tus documentos o recetas guardadas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 font-bold">•</span>
              <span><strong>Sin efectos colaterales automáticos:</strong> La cancelación de renovación, el trámite de arrepentimiento y la eliminación de cuenta son operaciones totalmente separadas.</span>
            </li>
          </ul>
        </div>

        {/* Contenido Completo */}
        <article className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-12 shadow-xs space-y-10 text-slate-700 text-sm sm:text-base leading-relaxed">
          
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">1</span>
              Aceptación y descripción de la plataforma
            </h2>
            <p>
              Bienvenido a <strong>PlayComun Online</strong>. Al acceder al sitio web, registrar una cuenta o contratar una suscripción Pro, aceptás estos Términos y Condiciones generales. Si no estás de acuerdo con alguna de estas disposiciones, te solicitamos no utilizar nuestros servicios.
            </p>
            <p>
              PlayComun Online es una plataforma digital que ofrece un catálogo de microherramientas web orientadas a cálculos comerciales, utilidades de oficina, generación de códigos QR, conversión de archivos y administración operativa para profesionales y emprendedores.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">2</span>
              Modalidades de servicio: Plan Básico y Suscripción Pro
            </h2>
            <p>
              La plataforma ofrece dos niveles de acceso claramente diferenciados:
            </p>
            <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-purple-200 text-sm text-slate-600">
              <div>
                <strong className="text-slate-900 block font-semibold">Plan Básico (Gratuito):</strong>
                Permite el uso sin costo de calculadoras comerciales (cuotas, porcentajes, descuentos, margen, IVA), recortador de audio, generador de códigos QR estáticos y herramientas estándar sin necesidad obligatoria de suscripción de pago.
              </div>
              <div>
                <strong className="text-slate-900 block font-semibold">PlayComun Pro (Suscripción paga):</strong>
                Desbloquea funcionalidades avanzadas que requieren procesamiento y almacenamiento en servidor, incluyendo la creación y edición de códigos QR dinámicos por tandas, almacenamiento en la nube de recetas con costeo de ingredientes, historial de presupuestos comerciales, seguimiento de movimientos de gastos y exportación en formatos avanzados.
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">3</span>
              Contratación, precios, facturación y pagos
            </h2>
            <p>
              Los precios de la suscripción PlayComun Pro se publican en Pesos Argentinos (ARS) en nuestra sección de <Link href="/planes" className="text-purple-600 font-semibold hover:underline">Planes</Link> e incluyen los impuestos aplicables cuando corresponda. Las modalidades disponibles son:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
              <li><strong>Suscripción Mensual:</strong> Se abona y renueva periódicamente cada mes de calendario.</li>
              <li><strong>Suscripción Anual:</strong> Se abona de forma anticipada con periodicidad de doce meses.</li>
            </ul>
            <p>
              El procesamiento de pagos se realiza a través de la infraestructura de <strong>Mercado Pago</strong> mediante débitos automáticos en tarjetas de crédito o débito registradas por el usuario. PlayComun no almacena los datos de tu tarjeta ni códigos CVV.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600 space-y-2">
              <p className="font-semibold text-slate-900">Estados de pago y regularización:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Aprobado:</strong> El pago se confirma de inmediato por la pasarela y la cuenta activa su estado Pro de forma sincronizada.</li>
                <li><strong>Pendiente / En proceso:</strong> Se espera la confirmación definitiva por parte del emisor bancario.</li>
                <li><strong>Cobro fallido (Past Due) y período de gracia:</strong> Si un cobro automático de renovación no puede completarse por fondos insuficientes o rechazo temporal de la tarjeta, el sistema otorga un período de gracia de tres (3) días corridos con acceso Pro activo mientras Mercado Pago reintenta el cobro.</li>
                <li><strong>Rechazado o revertido:</strong> Si el cobro fracasa definitivamente o se produce un contracargo o reembolso, el acceso Pro queda suspendido hasta la regularización de la suscripción.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">4</span>
              Regla comercial de cancelación: vigencia del período ya pagado
            </h2>
            <p>
              En PlayComun Online respetamos íntegramente lo que abonaste:
            </p>
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl text-sm text-purple-950 font-medium">
              Cuando cancelás la renovación automática de tu suscripción Pro desde tu panel en{" "}
              <Link href="/cuenta/suscripcion" className="text-purple-700 underline font-bold">
                Mi suscripción
              </Link>
              , <strong>mantenés tu acceso premium activo hasta el último día del ciclo que ya pagaste</strong>. No se realizarán nuevos débitos en tu medio de pago y no se te cobrará ninguna penalidad por cancelar.
            </div>
            <p className="text-sm text-slate-600">
              La cancelación de la renovación automática únicamente detiene los cobros futuros: <strong>no constituye una solicitud de eliminación de tu cuenta ni provoca la pérdida anticipada del servicio pagado</strong>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">5</span>
              Revocación de la contratación (Botón de arrepentimiento)
            </h2>
            <p>
              Conforme al artículo 34 de la Ley 24.240 de Defensa del Consumidor, la Resolución 424/2020 y la Disposición 954/2025, tenés derecho a revocar la aceptación del servicio contratado a distancia dentro del plazo de diez (10) días corridos computados a partir de la celebración de la contratación.
            </p>
            <p>
              Para ejercer este derecho, podés acceder al{" "}
              <Link href="/arrepentimiento" className="text-purple-600 font-bold hover:underline">
                Botón de arrepentimiento
              </Link>{" "}
              disponible de forma visible y destacada en el sitio. No se requiere registración previa para iniciar el trámite. Dentro de las veinticuatro (24) horas de enviada la solicitud, el sistema te informará un código de identificación para constancia y seguimiento de tu petición.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">6</span>
              Botón de baja de servicio y eliminación de cuenta
            </h2>
            <p>
              En cumplimiento de la Resolución 271/2020 de la Secretaría de Comercio Interior y la Disposición 954/2025, podés solicitar la baja de tu servicio contratado a través del{" "}
              <Link href="/baja-servicio" className="text-purple-600 font-bold hover:underline">
                Botón de baja de servicio
              </Link>
              . Si estás autenticado, podés detener la renovación con un clic directamente en tu panel de cuenta.
            </p>
            <p>
              Por su parte, la <strong>eliminación de cuenta</strong> es una operación independiente contemplada bajo la Ley 25.326. Si decidís eliminar tu cuenta de forma definitiva desde <Link href="/cuenta" className="text-purple-600 font-bold hover:underline">Mi Cuenta</Link>, se eliminará tu perfil, credenciales y favoritos, cancelando cualquier renovación pendiente en Mercado Pago. Los comprobantes contables de pagos previos se mantendrán archivados durante los plazos legalmente exigidos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">7</span>
              Aviso legal sobre documentos comerciales y ARCA
            </h2>
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 text-amber-950 text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />
                <span>Naturaleza no fiscal de los documentos generados</span>
              </div>
              <p>
                Los comprobantes, presupuestos, órdenes de trabajo o notas de pedido confeccionados a través de las herramientas de PlayComun Online <strong>son documentos comerciales internos para gestión operativa y presupuestaria</strong>.
              </p>
              <p className="font-semibold">
                PlayComun Online NO emite facturas electrónicas oficiales ni comprobantes fiscales autorizados por la Agencia de Recaudación y Control Aduanero (ARCA).
              </p>
              <p className="text-xs text-amber-900/80">
                El usuario es el único responsable de declarar sus operaciones comerciales y cumplir con los regímenes de facturación oficial y obligaciones tributarias que correspondan ante los organismos pertinentes.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">8</span>
              Usos prohibidos y protección contra abusos
            </h2>
            <p>
              Está terminantemente prohibido utilizar las herramientas de PlayComun Online para:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
              <li>Configurar códigos QR dinámicos que redirijan a sitios de phishing, malware, estafas o contenido ilícito.</li>
              <li>Intentar vulnerar, descompilar, sobrecargar o interferir con la infraestructura y seguridad de los servidores.</li>
              <li>Automatizar envíos masivos abusivos no autorizados que degraden el rendimiento de las herramientas para otros usuarios.</li>
            </ul>
            <p className="text-xs text-slate-500">
              PlayComun Online se reserva el derecho de suspender de forma inmediata enlaces QR fraudulentos o cuentas que violen estas restricciones de seguridad.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">9</span>
              Propiedad intelectual y resultados generados
            </h2>
            <p>
              El código fuente, diseño visual, logotipos y marca de PlayComun Online son propiedad de sus respectivos titulares y se encuentran protegidos por las leyes de propiedad intelectual.
            </p>
            <p>
              Los resultados generados por el usuario mediante el uso legítimo de las herramientas (cálculos de porcentajes, imágenes de códigos QR, archivos convertidos, listas de precios y presupuestos en PDF) son de exclusiva propiedad y responsabilidad del usuario titular.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 text-sm flex items-center justify-center font-black">10</span>
              Disponibilidad, modificaciones y canal de consultas
            </h2>
            <p>
              Nos esforzamos por mantener una alta disponibilidad técnica. Sin embargo, el servicio puede experimentar interrupciones programadas para mantenimiento o contingencias técnicas imprevistas.
            </p>
            <p>
              Cualquier modificación sustancial a estos términos será publicada con indicación de su fecha de vigencia. Para cualquier consulta legal, sugerencia o reclamo, nuestro canal oficial es:{" "}
              <a href="mailto:playcomun.ok@gmail.com" className="text-purple-600 font-bold hover:underline">
                playcomun.ok@gmail.com
              </a>
              .
            </p>
          </section>

        </article>

      </div>
    </div>
  )
}
