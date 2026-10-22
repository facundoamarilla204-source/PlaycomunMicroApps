'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CloudUpload, CheckCircle2, X } from 'lucide-react'

interface Props {
  localCount: number
  isSyncing: boolean
  onImport: () => Promise<{ success: boolean; error?: string }>
  onDiscard: () => void
}

export function CloudSyncBanner({
  localCount,
  isSyncing,
  onImport,
  onDiscard,
}: Props) {
  const [syncSuccess, setSyncSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (localCount <= 0) return null

  const handleSync = async () => {
    setErrorMsg(null)
    const res = await onImport()
    if (res.success) {
      setSyncSuccess(true)
    } else {
      setErrorMsg(res.error || 'Error al sincronizar datos.')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            {syncSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            ) : (
              <CloudUpload className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {syncSuccess
                ? '¡Movimientos sincronizados con tu cuenta Pro!'
                : 'Movimientos guardados en tu dispositivo listos para sincronizar'}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {syncSuccess
                ? 'Tus movimientos locales fueron incorporados exitosamente a la nube.'
                : `Tenés ${localCount} ${localCount === 1 ? 'movimiento registrado' : 'movimientos registrados'} en este navegador. Como usuario Pro podés incorporarlos a tu cuenta en la nube con un solo clic.`}
            </p>
            {errorMsg && (
              <p className="text-xs text-red-600 font-semibold mt-1">{errorMsg}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          {!syncSuccess && (
            <>
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
              </button>
              <button
                type="button"
                onClick={onDiscard}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                title="Mantener movimientos solo en este dispositivo"
              >
                Omitir
              </button>
            </>
          )}

          {syncSuccess && (
            <button
              type="button"
              onClick={onDiscard}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
