import { notFound } from "next/navigation"
import { pingMobileSession } from "@/lib/signature-session"
import { MobileSignView } from "./MobileSignView"
import { buildMetadata } from "@/lib/metadata"
import Link from "next/link"
import { Smartphone, AlertTriangle } from "lucide-react"

export const metadata = buildMetadata({
  title: "Firmar desde el celular",
  description: "Capturá tu firma desde la pantalla táctil de tu teléfono y transferila a tu computadora de forma segura.",
  noindex: true,
})

export default async function MobileSignPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const resolvedParams = await params
  const { token } = resolvedParams

  if (!token || token.length < 16) {
    notFound()
  }

  // Ping mobile session to update status to "connected" and check validity
  const pingResult = await pingMobileSession(token)

  if (!pingResult.ok) {
    const isExpired = pingResult.status === "expired"
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            {isExpired ? "Sesión de firma expirada" : "Sesión no disponible"}
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            {isExpired
              ? "Esta sesión superó el tiempo límite de seguridad (15 minutos). Por favor generá un nuevo código QR en tu computadora."
              : "El enlace escaneado no es válido o ya fue utilizado."}
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex justify-center items-center px-5 py-3 min-h-[44px] bg-slate-100 text-slate-800 rounded-xl hover:bg-slate-200 font-semibold text-sm transition-colors w-full"
            >
              Ir a PlayComun Online
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <MobileSignView uploadToken={token} />
}
