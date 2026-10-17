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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold">QR no encontrado</h1>
          <p className="text-gray-600">El código QR que escaneaste no existe o fue eliminado.</p>
          <Link href="/" className="inline-flex justify-center items-center px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-purple-700 w-full font-medium">
            Ir a PlayComun
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div className="max-w-md bg-white p-6 rounded-2xl shadow-sm border border-red-100 space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Destino bloqueado por seguridad</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            El enlace configurado en este código QR no cumple con las políticas de seguridad y protección contra abuso de PlayComun.
          </p>
          <Link href="/" className="inline-flex justify-center items-center px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-purple-700 w-full font-medium text-sm">
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  if (qr.status === "paused") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold">QR Pausado</h1>
          <p className="text-gray-600">Este QR se encuentra temporalmente desactivado por su propietario.</p>
        </div>
      </div>
    )
  }

  if (qr.status === "archived") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold">QR Archivado</h1>
          <p className="text-gray-600">Este QR ya no está disponible.</p>
        </div>
      </div>
    )
  }

  // unconfigured
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center font-sora">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><rect width="3" height="3" x="7" y="7"/><rect width="3" height="3" x="14" y="7"/><rect width="3" height="3" x="7" y="14"/><rect width="3" height="3" x="14" y="14"/></svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">QR sin configurar</h1>
        <p className="text-gray-600">Este QR todavía no tiene un destino asignado.</p>
        
        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-4">Si sos el propietario, iniciá sesión para configurarlo.</p>
          <Link href={`/herramientas/generador-qr?activate=${resolvedParams.token}`} className="inline-flex justify-center items-center px-4 py-2 w-full bg-[#7C3AED] text-white font-medium rounded-lg hover:bg-purple-700">
            Configurar destino
          </Link>
        </div>
      </div>
    </div>
  )
}
