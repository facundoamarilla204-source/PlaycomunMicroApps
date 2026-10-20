import { Headphones } from "lucide-react"
import { buildMetadata } from "@/lib/metadata"
import { Breadcrumbs } from "@/components/seo/Breadcrumbs"
import ContactForm from "@/components/home/ContactForm"
import { ContactChannels } from "@/components/contact/ContactChannels"
import { ContactFaqAccordion } from "@/components/contact/ContactFaqAccordion"
import Link from "next/link"

export const metadata = buildMetadata({
  title: "Contacto y soporte oficial",
  description: "Canal oficial de soporte y atención al usuario de PlayComun Online. Consultas sobre herramientas, suscripción Pro y asistencia técnica.",
  path: "/contacto",
})

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado con Breadcrumbs y tipografía sobria */}
        <div className="mb-10 sm:mb-12">
          <Breadcrumbs items={[{ label: "Contacto y soporte" }]} />

          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
              <Headphones className="w-3.5 h-3.5" aria-hidden="true" />
              Atención directa
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
            Contacto y soporte
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Escribinos ante cualquier duda sobre el catálogo de herramientas, estado de tu cuenta Pro, sugerencias de nuevas utilidades o gestiones administrativas.
          </p>
        </div>

        {/* Canales principales de contacto */}
        <ContactChannels />

        {/* Formulario de contacto directo */}
        <section className="mb-14">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">
              Envianos tu consulta
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Completá los campos a continuación. Te responderemos directamente por correo electrónico a la brevedad.
            </p>
          </div>
          <ContactForm embedded={true} />
        </section>

        {/* Preguntas frecuentes dinámicas y accesibles */}
        <section className="mb-14">
          <ContactFaqAccordion />
        </section>

        {/* Aviso de derechos y trámites del consumidor */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 text-sm text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-900">
              Trámites de contratación a distancia (Argentina)
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Resolución 424/2020 y Disposición 954/2025 de Defensa del Consumidor.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/arrepentimiento"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-900 text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 min-h-[44px] inline-flex items-center"
            >
              Botón de arrepentimiento
            </Link>
            <Link
              href="/baja-servicio"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-900 text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 min-h-[44px] inline-flex items-center"
            >
              Botón de baja
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
