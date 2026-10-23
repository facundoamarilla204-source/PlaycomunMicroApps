'use client'

import { useState } from 'react'
import { X, Truck, AlertCircle, Check } from 'lucide-react'
import type { Supplier } from '@/lib/gastronomia/types'
import { saveSupplierServer } from '@/app/actions/suppliers'

interface SupplierModalProps {
  supplier: Supplier | null
  onClose: () => void
  onSuccess: (saved: Supplier) => void
}

export function SupplierModal({
  supplier,
  onClose,
  onSuccess,
}: SupplierModalProps) {
  const [name, setName] = useState(supplier?.name || '')
  const [contactName, setContactName] = useState(supplier?.contact_name || '')
  const [phone, setPhone] = useState(supplier?.phone || '')
  const [email, setEmail] = useState(supplier?.email || '')
  const [address, setAddress] = useState(supplier?.address || '')
  const [notes, setNotes] = useState(supplier?.notes || '')
  const [isActive, setIsActive] = useState(supplier ? supplier.is_active : true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('El nombre del proveedor es obligatorio.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const res = await saveSupplierServer({
      id: supplier?.id,
      name: name.trim(),
      contact_name: contactName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
      is_active: isActive,
    })

    setIsSubmitting(false)

    if (res.error || !res.data) {
      setError(res.error || 'Error al guardar el proveedor.')
    } else {
      onSuccess({
        ...res.data,
        ingredients_count: supplier?.ingredients_count || 0,
      })
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-supplier-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[calc(100vh-2rem)] shadow-xl border border-slate-200 flex flex-col overflow-hidden my-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <h3 id="modal-supplier-title" className="text-sm font-bold text-slate-900">
                {supplier ? 'Editar proveedor' : 'Nuevo proveedor'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {supplier ? 'Actualizá los datos de contacto y notas' : 'Registrá un nuevo abastecedor comercial'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="supplier-name"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Razón social o nombre comercial *
            </label>
            <input
              id="supplier-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej. Molino Central S.A."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="supplier-contact"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Persona de contacto
              </label>
              <input
                id="supplier-contact"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ej. Roberto Gómez"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="supplier-phone"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Teléfono / WhatsApp
              </label>
              <input
                id="supplier-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 9 11 1234-5678"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="supplier-email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Correo electrónico
              </label>
              <input
                id="supplier-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pedidos@molinocentral.com"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="supplier-address"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Dirección o zona de entrega
              </label>
              <input
                id="supplier-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Corrientes 1234, CABA"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="supplier-notes"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Notas u horarios de recepción
            </label>
            <textarea
              id="supplier-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Días de reparto martes y jueves. Pedido mínimo $50.000."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="supplier-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            <label
              htmlFor="supplier-active"
              className="text-xs font-semibold text-slate-700 select-none cursor-pointer"
            >
              Proveedor activo para compras y sugerencias
            </label>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover disabled:opacity-50 rounded-lg shadow-xs transition-colors min-h-[44px] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Guardar proveedor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
