import { buildMetadata } from "@/lib/metadata"
import { RotateCcw, ShieldCheck, Scale, FileText } from "lucide-react"
import ArrepentimientoClient from "./ArrepentimientoClient"
import Link from "next/link"

export const metadata = buildMetadata({
  title: "Botón de arrepentimiento: Revocación de contratación",
  description: "Canal oficial para solicitar la revocación de la contratación de PlayComun Pro conforme al Art. 34 de la Ley 24.240 y Disposición 954/2025.",
  path: "/arrepentimiento",
})

export default function ArrepentimientoPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-12 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 mb-4">
            <RotateCcw className="w-3.5 h-3.5" /> Defensa del Consumidor
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3">
            Botón de arrepentimiento
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Revocación de servicios contratados a distancia en los términos de la Ley 24.240 (Art. 34), Resolución 424/2020 y Disposición 954/2025 de la República Argentina.
          </p>
        </div>

        {/* Componente del formulario interactivo */}
        <ArrepentimientoClient />

        {/* Marco normativo explicativo */}
        <div className="mt-12 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs text-xs sm:text-sm text-slate-600 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-600" />
            Información legal aplicable
          </h3>
          <ul className="space-y-2 list-disc pl-4 text-slate-600 leading-relaxed">
            <li>
              <strong>Plazo de revocación:</strong> Tenés derecho a revocar la aceptación del servicio contratado dentro del plazo de 10 (diez) días corridos contados a partir de la fecha de contratación.
            </li>
            <li>
              <strong>Código de trámite:</strong> Conforme a la Disposición 954/2025, al enviar tu petición se te otorga un código de identificación único para el seguimiento del trámite por este mismo canal y vía correo electrónico.
            </li>
            <li>
              <strong>Comprobaciones de seguridad:</strong> En los términos de la Disposición 3/2026, la plataforma podrá realizar comprobaciones razonables destinadas exclusivamente a comprobar la identidad y seguridad de la titularidad de la cuenta.
            </li>
            <li>
              <strong>Preservación de cuenta y datos:</strong> El ejercicio del derecho de arrepentimiento se limita a la revocación de la suscripción y devolución de los fondos cobrados. No causa la eliminación de tu cuenta ni el borrado de tus datos guardados en el Plan Básico.
            </li>
          </ul>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>¿Tenés dudas sobre cómo funciona?</span>
            <div className="flex gap-4">
              <Link href="/terminos" className="text-purple-600 font-semibold hover:underline">
                Ver términos y condiciones
              </Link>
              <Link href="/contacto" className="text-purple-600 font-semibold hover:underline">
                Centro de ayuda
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
