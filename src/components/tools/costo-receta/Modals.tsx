'use client'

import React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, LogIn, X, Crown, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react'

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
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 p-1 rounded-lg cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 sm:p-7">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <LogIn className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                Iniciá sesión en tu cuenta
              </h3>
              <p className="text-neutral-600 text-sm mb-6 leading-relaxed">
                Para guardar recetas en tu biblioteca personal, editarlas y gestionarlas desde cualquier dispositivo, ingresá a tu cuenta con suscripción Pro.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="flex-1 py-2.5 px-4 border border-neutral-200 rounded-xl text-neutral-700 font-semibold text-sm hover:bg-neutral-50 transition-colors cursor-pointer"
                  onClick={onClose}
                >
                  Seguir calculando
                </button>
                <button
                  type="button"
                  className="flex-1 py-2.5 px-4 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 shadow-xs transition-colors cursor-pointer"
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
                  className="flex-1 py-2.5 px-4 border border-neutral-200 rounded-xl text-neutral-700 font-semibold text-sm hover:bg-neutral-50 transition-colors cursor-pointer"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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

interface ProUpgradeModalProps {
  isOpen: boolean
  feature?: 'save' | 'library' | 'duplicate' | 'edit'
  preservedCount?: number
  isAuthenticated?: boolean
  onClose: () => void
  onLogin?: () => void
}

export function ProUpgradeModal({
  isOpen,
  feature = 'save',
  preservedCount = 0,
  isAuthenticated = false,
  onClose,
  onLogin,
}: ProUpgradeModalProps) {
  const titles = {
    save: 'Guardá tus recetas en la nube con Pro',
    library: 'Tu biblioteca de recetas personalizada',
    duplicate: 'Duplicá recetas para crear variantes',
    edit: 'Modificá y actualizá tus recetas guardadas',
  }

  const descriptions = {
    save: 'El cálculo en la calculadora es 100% libre y gratuito. Para almacenar tus creaciones en tu biblioteca permanente, editarlas y descargarlas cuando quieras, activá PlayComún Pro.',
    library: 'Accedé a todo tu catálogo de recetas calculadas desde cualquier computadora, tablet o celular con sincronización en tiempo real.',
    duplicate: 'Crea variantes de tus recetas favoritas (con o sin azúcar, versiones reducidas, empaques diferentes) manteniendo la receta base intacta.',
    edit: 'Ajustá ingredientes, mermas y precios de costo sobre tus recetas guardadas para actualizar tus precios de venta al instante.',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-slate-200"
          >
            {/* Header limpio */}
            <div className="p-6 border-b border-slate-100 relative">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-3">
                <Crown className="w-3 h-3 text-purple-600" />
                PlayComún Pro
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {titles[feature]}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                {descriptions[feature]}
              </p>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4">
              {preservedCount > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                  Tenés <strong>{preservedCount} {preservedCount === 1 ? 'receta guardada' : 'recetas guardadas'}</strong> en tu cuenta. Al activar Pro volverán a estar disponibles de inmediato.
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Incluido con Pro:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Guardado de recetas sin límite</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Duplicación rápida para crear variantes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Exportación de catálogo en PDF</span>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-slate-500 text-center">
                Podés seguir usando la calculadora de forma gratuita para cálculos individuales.
              </p>

              {/* Botones de acción */}
              <div className="space-y-2 pt-1">
                <Link
                  href="/planes"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs text-center shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Ver planes Pro</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {!isAuthenticated && onLogin ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onLogin()
                    }}
                    className="w-full py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-xs text-center transition-colors cursor-pointer"
                  >
                    Ya tengo cuenta Pro
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Seguir calculando gratis
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
