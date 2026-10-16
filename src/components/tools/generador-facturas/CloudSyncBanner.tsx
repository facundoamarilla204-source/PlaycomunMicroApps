'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CloudUpload, CheckCircle2, X } from 'lucide-react'

interface Props {
  localDocsCount: number
  localClientsCount: number
  localProductsCount: number
  onImportToCloud: () => Promise<void>
}

export function CloudSyncBanner({
  localDocsCount,
  localClientsCount,
  localProductsCount,
  onImportToCloud,
}: Props) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)

  const totalLocalItems = localDocsCount + localClientsCount + localProductsCount
  if (totalLocalItems === 0 || isDismissed) return null

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await onImportToCloud()
      setSyncSuccess(true)
      setTimeout(() => {
        setIsDismissed(true)
      }, 3000)
    } catch (err) {
      console.error('Error importando a la nube:', err)
      alert('Hubo un error al sincronizar con tu cuenta. Por favor intentá nuevamente.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-5 p-4 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            {syncSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            ) : (
              <CloudUpload className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              {syncSuccess
                ? '¡Datos sincronizados con éxito con tu cuenta!'
                : 'Sincronizar información guardada en tu dispositivo'}
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {syncSuccess
                ? 'Tus comprobantes, clientes y productos ahora están respaldados en la nube.'
                : `Tenés ${localDocsCount} ${localDocsCount === 1 ? 'documento' : 'documentos'}${
                    localClientsCount > 0 ? ` y ${localClientsCount} clientes` : ''
                  } en este navegador. Importalos para acceder desde cualquier computadora o celular.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {!syncSuccess && (
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? 'Sincronizando...' : 'Sincronizar con mi cuenta'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Descartar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
