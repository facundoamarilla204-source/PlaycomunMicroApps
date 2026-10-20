"use client"

import { useState } from "react"
import { Loader2, Mail, Send, CheckCircle2, ShieldAlert } from "lucide-react"

interface ContactFormProps {
  embedded?: boolean
  title?: string
  subtitle?: string
}

export default function ContactForm({
  embedded = false,
  title = "Ponete en contacto",
  subtitle = "¿Tenés alguna consulta, querés proponernos una idea o necesitás ayuda? Escribinos y te responderemos a la brevedad."
}: ContactFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      nombre: formData.get("nombre"),
      email: formData.get("email"),
      mensaje: formData.get("mensaje"),
      website: formData.get("website"), // Honeypot
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Ocurrió un error inesperado al enviar tu mensaje.")
      }

      setSuccess(true)
      form.reset()
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al enviar el mensaje.")
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <div className={`w-full ${embedded ? "" : "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 relative z-10"}`}>
      {!embedded && (
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            {title}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-10">
        {success ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Mensaje enviado con éxito</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
              Recibimos tu consulta. Nuestro equipo te responderá directamente al correo electrónico que ingresaste.
            </p>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-colors text-sm min-h-[44px]"
            >
              Enviar otra consulta
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo honeypot oculto para prevenir spam automatizado */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="nombre" className="block text-sm font-semibold text-slate-900">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-slate-400 text-sm font-medium"
                  placeholder="Tu nombre y apellido"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-slate-400 text-sm font-medium"
                  placeholder="nombre@ejemplo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="mensaje" className="block text-sm font-semibold text-slate-900">
                Consulta o detalle <span className="text-red-500">*</span>
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                required
                rows={5}
                minLength={10}
                maxLength={2000}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-slate-400 resize-none text-sm font-medium"
                placeholder="Describí tu consulta técnica, comercial o de soporte..."
              />
            </div>

            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/80 border border-amber-200/70 rounded-xl text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Por tu seguridad, nunca incluyas contraseñas, números completos de tarjeta de crédito ni códigos de seguridad (CVV) en este mensaje.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-xs text-slate-500">
                También podés escribir directamente a{" "}
                <a
                  href="mailto:playcomun.ok@gmail.com"
                  className="text-brand font-semibold hover:underline"
                >
                  playcomun.ok@gmail.com
                </a>
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-7 py-3 bg-brand hover:bg-brand-hover active:bg-brand-active text-white font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm min-h-[44px] text-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando mensaje...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar consulta</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <section id="contacto" className="py-20 bg-white border-t border-slate-200/80 relative overflow-hidden">
      {content}
    </section>
  )
}
