"use client"

import { useState } from "react"
import { Mail, CreditCard, ShieldCheck, Check, Copy } from "lucide-react"
import Link from "next/link"

export function ContactChannels() {
  const [copied, setCopied] = useState(false)
  const email = "playcomun.ok@gmail.com"

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
      {/* Canal 1: Correo electrónico */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
            <Mail className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Correo de soporte
          </h2>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Atención personalizada para dudas técnicas, cuentas y propuestas de herramientas.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <a
            href={`mailto:${email}`}
            className="text-sm font-semibold text-purple-700 hover:text-purple-900 break-all underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 rounded"
          >
            {email}
          </a>
          <button
            type="button"
            onClick={copyEmail}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200/80 transition-colors w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 min-h-[36px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span className="text-emerald-700 font-medium">Copiado al portapapeles</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>Copiar dirección</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canal 2: Gestión de suscripción */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
            <CreditCard className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Planes y suscripción
          </h2>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Consultá el estado de tu cuenta Pro, facturas abonadas o detené la renovación automática.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/cuenta/suscripcion"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-900 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 min-h-[44px]"
          >
            Administrar suscripción
          </Link>
        </div>
      </div>

      {/* Canal 3: Privacidad y Derechos */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Privacidad y datos
          </h2>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Protección de datos bajo la Ley 25.326. Solicitudes de baja o supresión de cuenta.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/privacidad"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-900 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 min-h-[44px]"
          >
            Ver política de privacidad
          </Link>
        </div>
      </div>
    </div>
  )
}
