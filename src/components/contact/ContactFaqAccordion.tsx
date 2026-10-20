"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, HelpCircle } from "lucide-react"
import Link from "next/link"

interface FaqItem {
  id: string
  question: string
  answer: React.ReactNode
}

const FAQS: FaqItem[] = [
  {
    id: "faq-pro-vs-free",
    question: "¿Qué diferencia hay entre las herramientas gratuitas y la suscripción Pro?",
    answer: (
      <p className="text-sm text-slate-700 leading-relaxed">
        Las calculadoras de comercio (cuotas, porcentajes, margen, IVA) y herramientas estándar pueden utilizarse sin costo de forma inmediata. La suscripción PlayComun Pro desbloquea almacenamiento en la nube para recetas y costeo, historial guardado de presupuestos, tandas de códigos QR dinámicos editables y exportación en formatos avanzados sin límites.
      </p>
    ),
  },
  {
    id: "faq-cancelacion-datos",
    question: "¿Qué sucede con mis datos si cancelo la renovación automática de Pro?",
    answer: (
      <p className="text-sm text-slate-700 leading-relaxed">
        Al cancelar la renovación automática desde tu panel, conservás el acceso premium completo hasta el último día del ciclo ya abonado. Al finalizar el período, tus recetas, códigos y documentos no se borran; quedan protegidos en tu cuenta y podés consultarlos o reactivarlos cuando lo desees.
      </p>
    ),
  },
  {
    id: "faq-arca",
    question: "¿Los documentos generados reemplazan una factura electrónica de ARCA?",
    answer: (
      <p className="text-sm text-slate-700 leading-relaxed">
        No. Los documentos, presupuestos y notas de pedido elaborados en PlayComun son comprobantes comerciales internos para orden presupuestario y cotización. No constituyen facturas electrónicas oficiales ni comprobantes fiscales autorizados por la Agencia de Recaudación y Control Aduanero (ARCA).
      </p>
    ),
  },
  {
    id: "faq-derechos-baja",
    question: "¿Cómo tramitar el arrepentimiento de compra o la baja del servicio?",
    answer: (
      <p className="text-sm text-slate-700 leading-relaxed">
        En cumplimiento de la Ley 24.240 y normativas vigentes en Argentina, disponés de acceso libre al{" "}
        <Link href="/arrepentimiento" className="font-semibold text-purple-700 underline hover:text-purple-800">
          Botón de arrepentimiento
        </Link>{" "}
        dentro de los 10 días corridos de la contratación, y al{" "}
        <Link href="/baja-servicio" className="font-semibold text-purple-700 underline hover:text-purple-800">
          Botón de baja de servicio
        </Link>{" "}
        para detener renovaciones en cualquier momento.
      </p>
    ),
  },
]

export function ContactFaqAccordion() {
  const [openId, setOpenId] = useState<string | null>("faq-pro-vs-free")

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
          <HelpCircle className="w-4 h-4" aria-hidden="true" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Preguntas frecuentes y respuestas claras
        </h2>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq) => {
          const isOpen = openId === faq.id
          const panelId = `panel-${faq.id}`
          const buttonId = `button-${faq.id}`

          return (
            <div
              key={faq.id}
              className={`rounded-xl border transition-colors ${
                isOpen ? "border-purple-200 bg-purple-50/20" : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(faq.id)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 rounded-xl"
              >
                <span className="text-sm sm:text-base">{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 flex-shrink-0 ${
                    isOpen ? "rotate-180 text-purple-700" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-0 border-t border-purple-100/60 mt-1">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
