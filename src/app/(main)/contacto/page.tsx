import { Mail, HelpCircle, ShieldCheck, Sparkles } from "lucide-react"
import { buildMetadata } from "@/lib/metadata"
import ContactForm from "@/components/home/ContactForm"
import Link from "next/link"

export const metadata = buildMetadata({
  title: "Contacto y soporte oficial",
  description: "Canal oficial de soporte y atención al usuario de PlayComun Online. Consultas sobre herramientas, suscripción Pro y asistencia técnica.",
  path: "/contacto",
})

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 py-12 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Atención al usuario
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Centro de soporte y contacto
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Estamos para ayudarte con el uso de las herramientas, consultas sobre tu cuenta, facturación y sugerencias para la plataforma.
          </p>
        </div>

        {/* Tarjetas de Canales y Guías */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Correo electrónico</h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
                Canal principal para consultas generales, soporte de herramientas y temas comerciales.
              </p>
            </div>
            <a
              href="mailto:playcomun.ok@gmail.com"
              className="text-sm font-bold text-purple-600 hover:text-purple-700 hover:underline break-all"
            >
              playcomun.ok@gmail.com
            </a>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Gestión de suscripción</h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
                Revisá el estado de tu plan Pro, historial de pagos y renovación automática en tu panel.
              </p>
            </div>
            <Link
              href="/cuenta/suscripcion"
              className="text-sm font-bold text-slate-900 hover:text-purple-600 hover:underline"
            >
              Ir a mi suscripción &rarr;
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Seguridad y privacidad</h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
                Nunca envíes contraseñas ni códigos de seguridad de tarjetas bancarias por email.
              </p>
            </div>
            <Link
              href="/privacidad"
              className="text-sm font-bold text-slate-700 hover:text-purple-600 hover:underline"
            >
              Ver política de privacidad &rarr;
            </Link>
          </div>

        </div>

        {/* Formulario de Contacto Reutilizado */}
        <div className="mb-16">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Envianos un mensaje
            </h2>
            <p className="text-sm text-slate-600">
              Completá el formulario a continuación y te responderemos por correo electrónico.
            </p>
          </div>
          <ContactForm embedded={true} />
        </div>

        {/* Preguntas Frecuentes Reales y Fundadas */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
            Preguntas frecuentes sobre el servicio
          </h2>

          <div className="space-y-6 divide-y divide-slate-100">
            <div className="pt-4 first:pt-0">
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                ¿Qué diferencia hay entre las herramientas gratuitas y la suscripción Pro?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Las calculadoras y generadores estándar pueden utilizarse sin costo. La suscripción PlayComun Pro desbloquea funciones avanzadas como almacenamiento en la nube de recetas, historial de presupuestos comerciales, tandem de códigos QR dinámicos editables y exportación a formatos avanzados.
              </p>
            </div>

            <div className="pt-6">
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                ¿Qué sucede con mis datos si cancelo la renovación automática de Pro?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Al cancelar la renovación, tu acceso Pro se mantiene activo hasta que finalice el período que ya pagaste. Tus datos guardados no se eliminan al vencer el ciclo; quedan protegidos en tu cuenta y podés volver a acceder a ellos cuando reactives tu plan.
              </p>
            </div>

            <div className="pt-6">
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                ¿Los documentos comerciales generados son facturas electrónicas de ARCA?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                No. Los documentos generados en PlayComun son presupuestos, órdenes de trabajo o borradores comerciales para gestión interna y clientes. No constituyen facturas electrónicas oficiales autorizadas por la Agencia de Recaudación y Control Aduanero (ARCA).
              </p>
            </div>

            <div className="pt-6">
              <h3 className="text-base font-bold text-slate-900 mb-1.5">
                ¿Cómo puedo ejercer el derecho de arrepentimiento o baja de servicio?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                En cumplimiento de las normas de defensa del consumidor en Argentina, podés acceder directamente al{" "}
                <Link href="/arrepentimiento" className="text-purple-600 font-bold hover:underline">
                  Botón de arrepentimiento
                </Link>{" "}
                para revocar contrataciones recientes, o al{" "}
                <Link href="/baja-servicio" className="text-purple-600 font-bold hover:underline">
                  Botón de baja de servicio
                </Link>{" "}
                para solicitar la interrupción de la renovación de tu suscripción.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
