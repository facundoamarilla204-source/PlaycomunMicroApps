import { getQrByTokenPublic } from "@/app/actions/qr"
import { redirect } from "next/navigation"
import Link from "next/link"
import { buildMetadata } from "@/lib/metadata"
import { validateDestinationUrl } from "@/lib/safe-url"

export const metadata = buildMetadata({
  title: "Acceso QR",
  noindex: true,
})

export default async function QrPublicResolver({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = await params
  const qr = await getQrByTokenPublic(resolvedParams.token)

  if (!qr) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">QR no encontrado</h1>
          <p className="text-sm text-slate-600 leading-relaxed">El código QR que escaneaste no existe o fue eliminado.</p>
          <Link href="/" className="inline-flex justify-center items-center px-5 py-2.5 min-h-[44px] bg-brand text-white rounded-xl hover:bg-brand-hover active:bg-brand-active w-full font-semibold text-sm transition-colors shadow-xs">
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (qr.status === "active" && qr.destination_url) {
    const safeCheck = validateDestinationUrl(qr.destination_url)
    if (safeCheck.isValid) {
      redirect(qr.destination_url)
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-red-100 space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Destino bloqueado por seguridad</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            El enlace configurado en este código QR no cumple con las políticas de seguridad y protección contra abuso de PlayComun.
          </p>
          <Link href="/" className="inline-flex justify-center items-center px-5 py-2.5 min-h-[44px] bg-brand text-white rounded-xl hover:bg-brand-hover active:bg-brand-active w-full font-semibold text-sm transition-colors shadow-xs">
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (qr.status === "paused") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">QR en pausa</h1>
          <p className="text-sm text-slate-600 leading-relaxed">Este código QR se encuentra temporalmente desactivado por su creador.</p>
          <Link href="/" className="inline-flex justify-center items-center px-5 py-2.5 min-h-[44px] bg-slate-100 text-slate-800 rounded-xl hover:bg-slate-200 w-full font-semibold text-sm transition-colors">
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (qr.status === "archived") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">QR archivado</h1>
          <p className="text-sm text-slate-600 leading-relaxed">Este código QR ya no está disponible.</p>
          <Link href="/" className="inline-flex justify-center items-center px-5 py-2.5 min-h-[44px] bg-slate-100 text-slate-800 rounded-xl hover:bg-slate-200 w-full font-semibold text-sm transition-colors">
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  // unconfigured
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
        <div className="w-14 h-14 bg-purple-50 text-brand rounded-2xl flex items-center justify-center mx-auto border border-purple-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><rect width="3" height="3" x="7" y="7"/><rect width="3" height="3" x="14" y="7"/><rect width="3" height="3" x="7" y="14"/><rect width="3" height="3" x="14" y="14"/></svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">QR sin configurar</h1>
        <p className="text-sm text-slate-600 leading-relaxed">Este código QR todavía no tiene un destino asignado.</p>
        
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <p className="text-xs text-slate-500">Si sos el propietario, podés configurar su destino ahora.</p>
          <Link href={`/herramientas/generador-qr?activate=${resolvedParams.token}`} className="inline-flex justify-center items-center px-5 py-2.5 min-h-[44px] w-full bg-brand text-white font-semibold rounded-xl hover:bg-brand-hover active:bg-brand-active text-sm shadow-xs transition-colors">
            Configurar destino
          </Link>
        </div>
      </div>
    </div>
  )
}
