'use client'

import React, { useState, useEffect } from 'react'
import { X, Loader2, User, Phone, Mail, MapPin, FileText } from 'lucide-react'
import { KitchenClient, SaveKitchenClientInput } from '@/lib/gastronomia/types'
import { saveKitchenClientServer } from '@/app/actions/kitchen-orders'

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (client: KitchenClient) => void
  client?: KitchenClient | null
}

export function ClientModal({
  isOpen,
  onClose,
  onSuccess,
  client,
}: ClientModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (client) {
      setName(client.name || '')
      setPhone(client.phone || '')
      setEmail(client.email || '')
      setAddress(client.address || '')
      setNotes(client.notes || '')
      setIsActive(client.is_active)
    } else {
      setName('')
      setPhone('')
      setEmail('')
      setAddress('')
      setNotes('')
      setIsActive(true)
    }
    setErrorMessage(null)
  }, [client, isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage('El nombre del cliente es obligatorio.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const payload: SaveKitchenClientInput = {
        id: client?.id,
        name: trimmedName,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        is_active: isActive,
      }

      const res = await saveKitchenClientServer(payload)
      if (res.error || !res.data) {
        setErrorMessage(res.error || 'No se pudo guardar el cliente.')
        setIsSaving(false)
        return
      }

      onSuccess(res.data)
      onClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al guardar cliente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-modal-title"
    >
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto max-h-[calc(100vh-2rem)] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-slate-50/75">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-900 border border-violet-200/80 flex items-center justify-center font-bold">
              <User className="w-5 h-5 text-[#7f22fe]" />
            </div>
            <div>
              <h3
                id="client-modal-title"
                className="text-base font-bold text-slate-900 font-sans"
              >
                {client ? 'Editar cliente' : 'Nuevo cliente'}
              </h3>
              <p className="text-xs text-slate-500">
                Directorio comercial de Amasia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f22fe]"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-900 border border-rose-200">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nombre o razón social *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Lucía Martínez / Pastelería Bella"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] transition-shadow min-h-[44px]"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: +54 9 11 1234-5678"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] transition-shadow min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] transition-shadow min-h-[44px]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Dirección de entrega habitual
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: Av. Corrientes 1234, 4to B"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] transition-shadow min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Observaciones gastronómicas y preferencias
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Preferencias de entrega, notas sobre empaque, alérgenos..."
                className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] transition-shadow resize-none"
              />
            </div>
          </div>

          {client && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_active_toggle"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#7f22fe] focus:ring-[#7f22fe] border-slate-300"
              />
              <label
                htmlFor="is_active_toggle"
                className="text-xs text-slate-700 font-medium cursor-pointer select-none"
              >
                Cliente activo (visible para nuevos pedidos comerciales)
              </label>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#7f22fe] hover:bg-[#6c1ce0] active:bg-[#5b14c4] text-white shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 min-h-[44px] active:scale-[0.98]"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {client ? 'Actualizar cliente' : 'Guardar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
