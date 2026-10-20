"use client"

import React, { useState } from "react"
import { motion } from "motion/react"
import { Copy, Check, X, CheckSquare, Square } from "lucide-react"
import { SignatureElement } from "@/lib/pdf-sign/types"

interface MultiPageApplyModalProps {
  isOpen: boolean
  onClose: () => void
  element: SignatureElement | null
  totalPages: number
  onApplyToPages: (targetPageIndices: number[]) => void
}

export function MultiPageApplyModal({
  isOpen,
  onClose,
  element,
  totalPages,
  onApplyToPages,
}: MultiPageApplyModalProps) {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())

  if (!isOpen || !element) return null

  const handleSelectAll = () => {
    const all = new Set<number>()
    for (let i = 0; i < totalPages; i++) {
      all.add(i)
    }
    setSelectedPages(all)
  }

  const handleClearAll = () => {
    setSelectedPages(new Set())
  }

  const handleSelectAllExceptCurrent = () => {
    const except = new Set<number>()
    for (let i = 0; i < totalPages; i++) {
      if (i !== element.pageIndex) {
        except.add(i)
      }
    }
    setSelectedPages(except)
  }

  const togglePage = (pageIdx: number) => {
    const next = new Set(selectedPages)
    if (next.has(pageIdx)) next.delete(pageIdx)
    else next.add(pageIdx)
    setSelectedPages(next)
  }

  const handleConfirm = () => {
    onApplyToPages(Array.from(selectedPages))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100/70 text-brand flex items-center justify-center border border-purple-200/60">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Aplicar en otras páginas</h2>
              <p className="text-xs text-slate-500">
                Copia este elemento en las páginas que elijas con su misma posición.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Acciones rápidas de selección */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleSelectAllExceptCurrent}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            Todas excepto actual
          </button>
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            Todas ({totalPages})
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            Deseleccionar
          </button>
        </div>

        {/* Lista de páginas con casillas de verificación */}
        <div className="p-4 overflow-y-auto max-h-64 space-y-1.5">
          {Array.from({ length: totalPages }, (_, i) => {
            const isCurrent = i === element.pageIndex
            const isChecked = selectedPages.has(i)
            return (
              <label
                key={i}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isCurrent
                    ? "bg-purple-50/40 border-purple-200"
                    : isChecked
                    ? "bg-purple-50 border-brand text-slate-900 shadow-2xs"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePage(i)}
                    className="w-4 h-4 rounded text-brand focus:ring-brand border-slate-300"
                  />
                  <span className="text-xs font-semibold">Página {i + 1}</span>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-bold text-brand uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-purple-200">
                    Página actual
                  </span>
                )}
              </label>
            )
          })}
        </div>

        {/* Pie de modal */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-medium">
            {selectedPages.size} {selectedPages.size === 1 ? "página seleccionada" : "páginas seleccionadas"}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedPages.size === 0}
              className="px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-white text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-40 min-h-[44px] flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Aplicar ({selectedPages.size})
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
