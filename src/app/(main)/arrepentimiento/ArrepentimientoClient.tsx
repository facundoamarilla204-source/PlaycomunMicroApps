"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { submitConsumerRequest, getConsumerRequestStatus } from "@/app/actions/consumer-requests"
import { RotateCcw, CheckCircle2, AlertCircle, Copy, Check, ShieldCheck, Info, Loader2, Search, Clock, FileText } from "lucide-react"
import Link from "next/link"

export default function ArrepentimientoClient() {
  const [activeTab, setActiveTab] = useState<"formulario" | "consulta">("formulario")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; trackingCode?: string; error?: string; isDuplicate?: boolean } | null>(null)
  const [copied, setCopied] = useState(false)

  // Estados para consulta de trámite existente
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTrackingCode, setSearchTrackingCode] = useState("")
  const [searchEmail, setSearchEmail] = useState("")
  const [searchResult, setSearchResult] = useState<{
    success: boolean
    error?: string
    request?: {
      trackingCode: string
      requestType: string
      status: "received" | "in_review" | "resolved" | "rejected"
      createdAt: string
      resolvedAt: string | null
      resolutionNotes: string | null
    }
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const formData = new FormData(e.currentTarget)
    const fullName = formData.get("fullName") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const paymentReference = formData.get("paymentReference") as string
    const details = formData.get("details") as string
    const website = formData.get("website") as string // Honeypot

    try {
      const res = await submitConsumerRequest({
        requestType: "arrepentimiento",
        fullName,
        email,
        phone,
        paymentReference,
        details,
        website
      })

      setResult(res)
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || "Ocurrió un error al procesar tu solicitud. Por favor, intentá nuevamente.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearchStatus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSearchLoading(true)
    setSearchResult(null)

    try {
      const res = await getConsumerRequestStatus(searchTrackingCode, searchEmail)
      setSearchResult(res)
    } catch (err: any) {
      setSearchResult({
        success: false,
        error: "Error de conexión al consultar el trámite. Por favor intentá nuevamente."
      })
    } finally {
      setSearchLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (result?.trackingCode) {
      navigator.clipboard.writeText(result.trackingCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const statusMap: Record<string, { label: string; color: string; desc: string }> = {
    received: {
      label: "Recibida (Pendiente de revisión)",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      desc: "Tu solicitud fue registrada con éxito en el sistema y se encuentra en espera de revisión por el equipo de operaciones."
    },
    in_review: {
      label: "En proceso de gestión",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      desc: "Estamos cotejando la operación con la pasarela de pagos de Mercado Pago para procesar la revocación correspondiente."
    },
    resolved: {
      label: "Trámite resuelto",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      desc: "La solicitud de arrepentimiento ha sido procesada de forma definitiva."
    },
    rejected: {
      label: "Solicitud no procedente",
      color: "bg-slate-100 text-slate-700 border-slate-300",
      desc: "La solicitud no pudo ser admitida (por ejemplo, por haber transcurrido el plazo legal de 10 días o no verificarse contratación activa)."
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Selector de pestañas: Nueva solicitud / Consultar estado */}
      <div className="flex rounded-2xl bg-slate-100 p-1 max-w-sm mx-auto" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "formulario"}
          onClick={() => setActiveTab("formulario")}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === "formulario"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Nueva solicitud
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "consulta"}
          onClick={() => setActiveTab("consulta")}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === "consulta"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Consultar estado
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "formulario" ? (
          result?.success && result.trackingCode ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 shadow-sm text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                Solicitud de arrepentimiento registrada
              </h2>
              <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
                {result.isDuplicate
                  ? "Esta solicitud ya había sido ingresada previamente. Conservá tu código oficial de trámite."
                  : "Conforme a la Ley 24.240 y la Disposición 954/2025, tu petición ha sido ingresada con éxito. Conservá el siguiente código de identificación único como comprobante fehaciente."}
              </p>

              <div className="bg-purple-50 border-2 border-dashed border-purple-200 rounded-2xl p-6 max-w-md mx-auto mb-8">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2">
                  Código de trámite oficial
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-purple-950 tracking-wider">
                    {result.trackingCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    title="Copiar código al portapapeles"
                    className="p-2 rounded-xl bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  {copied ? "¡Código copiado!" : "Hacé clic en el icono para copiar"}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mb-8 space-y-2">
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" /> Próximos pasos
                </p>
                <p>
                  1. Te enviamos una copia de esta constancia al correo electrónico ingresado.
                </p>
                <p>
                  2. Nuestro equipo cotejará la contratación en Mercado Pago para gestionar la devolución y baja correspondiente.
                </p>
                <p>
                  3. <strong>Tu cuenta y tus datos no se eliminan</strong> por este trámite. Podés continuar utilizando las herramientas del Plan Básico cuando quieras.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors min-h-[44px]"
                >
                  Registrar otra solicitud
                </button>
                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors text-center min-h-[44px] flex items-center justify-center"
                >
                  Volver al inicio
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 lg:p-12 shadow-sm"
            >
              <div className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
                  Formulario de revocación de contratación
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Completá los datos solicitados para revocar tu contratación reciente de PlayComun Pro. No es necesario tener la sesión iniciada para ejercer este derecho.
                </p>
              </div>

              <div className="bg-purple-50/80 border border-purple-200/70 rounded-2xl p-4 sm:p-5 mb-8 text-xs sm:text-sm text-purple-950 flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-purple-900 mb-0.5">Alcance legal</p>
                  <p className="leading-relaxed">
                    Podés solicitar el arrepentimiento dentro de los 10 días corridos desde la contratación del servicio. Esta acción tramita la revocación de la suscripción y el reintegro que corresponda. <strong>No eliminará tu cuenta de usuario ni borrará tus documentos guardados en PlayComun</strong>.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Honeypot oculto contra bots */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="block text-sm font-semibold text-slate-900">
                      Nombre y apellido completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      required
                      minLength={3}
                      maxLength={100}
                      placeholder="Ej: Laura Gómez"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm font-medium transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
                      Correo electrónico de la cuenta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      maxLength={255}
                      placeholder="email@ejemplo.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm font-medium transition-all"
                    />
                    <p className="text-[11px] text-slate-500">
                      Ingresá el mismo correo con el que registraste o pagaste tu suscripción.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-900">
                      Teléfono de contacto (Opcional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      maxLength={30}
                      placeholder="Ej: 11 1234-5678"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm font-medium transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="paymentReference" className="block text-sm font-semibold text-slate-900">
                      Número de comprobante o ID de Mercado Pago (Opcional)
                    </label>
                    <input
                      type="text"
                      id="paymentReference"
                      name="paymentReference"
                      maxLength={100}
                      placeholder="Ej: Operación MP #123456789"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="details" className="block text-sm font-semibold text-slate-900">
                    Motivo o aclaración adicional (Opcional)
                  </label>
                  <textarea
                    id="details"
                    name="details"
                    rows={4}
                    maxLength={2000}
                    placeholder="Podés indicarnos si deseás revocar el plan mensual o anual, o cualquier dato que nos ayude a ubicar tu operación..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm font-medium transition-all resize-none"
                  />
                </div>

                {result?.error && (
                  <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{result.error}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-slate-500">
                    Canal directo alternativo:{" "}
                    <a href="mailto:playcomun.ok@gmail.com" className="text-purple-600 font-semibold hover:underline">
                      playcomun.ok@gmail.com
                    </a>
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm min-h-[44px] text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Registrando solicitud...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>Solicitar arrepentimiento</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )
        ) : (
          /* Pestaña: Consultar Estado */
          <motion.div
            key="consulta"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 lg:p-12 shadow-sm space-y-8"
          >
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
                Consulta de estado de trámite
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ingresá tu código de trámite oficial (ej: ARR-...) y el correo electrónico con el que registraste la petición para consultar su avance en tiempo real.
              </p>
            </div>

            <form onSubmit={handleSearchStatus} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="searchCode" className="block text-sm font-semibold text-slate-900">
                    Código de trámite <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="searchCode"
                    value={searchTrackingCode}
                    onChange={(e) => setSearchTrackingCode(e.target.value)}
                    required
                    placeholder="Ej: ARR-20261016-XXXX"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm font-medium transition-all uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="searchEmail" className="block text-sm font-semibold text-slate-900">
                    Correo electrónico asociado <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="searchEmail"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    required
                    placeholder="email@ejemplo.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-sm font-medium transition-all"
                  />
                </div>
              </div>

              {searchResult?.error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{searchResult.error}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm min-h-[44px]"
                >
                  {searchLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Consultando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Consultar estado</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {searchResult?.success && searchResult.request && (
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                      Trámite {searchResult.request.trackingCode}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      Estado de tu solicitud de arrepentimiento
                    </h3>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusMap[searchResult.request.status]?.color || "bg-slate-100 text-slate-700"}`}>
                    {statusMap[searchResult.request.status]?.label || searchResult.request.status}
                  </span>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">
                  {statusMap[searchResult.request.status]?.desc}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200">
                  <div>
                    <strong>Fecha de ingreso:</strong>{" "}
                    {new Date(searchResult.request.createdAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
                  </div>
                  {searchResult.request.resolvedAt && (
                    <div>
                      <strong>Fecha de resolución:</strong>{" "}
                      {new Date(searchResult.request.resolvedAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
                    </div>
                  )}
                </div>

                {searchResult.request.resolutionNotes && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                    <strong>Observaciones del equipo:</strong>
                    <p className="mt-1 whitespace-pre-wrap">{searchResult.request.resolutionNotes}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
