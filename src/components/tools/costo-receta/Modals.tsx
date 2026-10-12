'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, LogIn, X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: () => void
}

export function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 sm:p-7">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-4">
                <LogIn className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                Iniciá sesión para guardar
              </h3>
              <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
                Para guardar tus recetas, consultarlas cuando quieras y descargar tus fichas técnicas en PDF, necesitás tener una cuenta en PlayComún. ¡Es 100% gratuita!
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="flex-1 py-2.5 px-4 border border-neutral-200 rounded-xl text-neutral-700 font-semibold text-sm hover:bg-neutral-50 transition-colors"
                  onClick={onClose}
                >
                  Continuar sin guardar
                </button>
                <button
                  type="button"
                  className="flex-1 py-2.5 px-4 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand-hover shadow-xs transition-colors"
                  onClick={onLogin}
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface DeleteConfirmModalProps {
  isOpen: boolean
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmModal({
  isOpen,
  loading,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
          >
            <div className="p-6 sm:p-7">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-4 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                ¿Eliminar receta?
              </h3>
              <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
                Esta acción no se puede deshacer. La receta se eliminará permanentemente de tu cuenta y no podrás recuperarla.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="flex-1 py-2.5 px-4 border border-neutral-200 rounded-xl text-neutral-700 font-semibold text-sm hover:bg-neutral-50 transition-colors"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 shadow-xs transition-colors disabled:opacity-50"
                  onClick={onConfirm}
                  disabled={loading}
                >
                  {loading ? 'Eliminando...' : 'Eliminar receta'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
