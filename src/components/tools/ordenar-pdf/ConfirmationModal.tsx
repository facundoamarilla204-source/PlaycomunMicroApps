"use client"

import React from "react"
import { motion, AnimatePresence } from "motion/react"
import { AlertTriangle, X, Trash2 } from "lucide-react"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  danger = true,
}: ConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  danger ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                }`}
              >
                {danger ? (
                  <Trash2 className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar modal"
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium text-xs hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`px-5 py-2.5 rounded-xl font-medium text-xs text-white shadow-sm transition-colors ${
                danger
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                  : "bg-violet-600 hover:bg-violet-700 shadow-violet-600/20"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
