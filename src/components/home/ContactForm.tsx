"use client";

import { useState } from "react";
import { Loader2, Mail, Send, CheckCircle2 } from "lucide-react";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get("nombre"),
      email: formData.get("email"),
      mensaje: formData.get("mensaje"),
      website: formData.get("website"), // Honeypot
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Ocurrió un error inesperado.");
      }

      setSuccess(true);
      e.currentTarget.reset();
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al enviar el mensaje.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 bg-white border-t border-border/40 relative overflow-hidden">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Ponete en contacto
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            ¿Tenés alguna consulta, querés proponernos una idea o necesitás ayuda? Escribinos y te responderemos a la brevedad.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border/60 p-6 sm:p-10">
          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Mensaje enviado!</h3>
              <p className="text-slate-500 mb-8">
                Gracias por escribirnos. Recibimos tu mensaje y te vamos a contactar muy pronto a tu correo electrónico.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot field (hidden from real users) */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="nombre" className="block text-sm font-semibold text-slate-900">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-slate-400"
                    placeholder="Pablo Diaz"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-slate-400"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="mensaje" className="block text-sm font-semibold text-slate-900">
                  Mensaje
                </label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  required
                  rows={5}
                  minLength={10}
                  maxLength={2000}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-slate-400 resize-none"
                  placeholder="¿En qué te podemos ayudar?"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 bg-brand hover:bg-brand/90 text-white font-bold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar mensaje"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
