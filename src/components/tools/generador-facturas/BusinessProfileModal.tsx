'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { BusinessProfile, CurrencyCode, DesignTemplate } from './types'
import { CURRENCIES } from './math'
import { Building2, Upload, Trash2, X, Image as ImageIcon, Check } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  profile: BusinessProfile
  onSaveProfile: (profile: BusinessProfile) => Promise<void>
}

const TEMPLATES: { id: DesignTemplate; label: string }[] = [
  { id: 'modern', label: 'Moderno' },
  { id: 'classic', label: 'Clásico' },
  { id: 'minimal', label: 'Minimalista' },
]

const ACCENT_COLORS = [
  { hex: '#7C3AED', name: 'Violeta PlayComún' },
  { hex: '#2563EB', name: 'Azul Corporativo' },
  { hex: '#059669', name: 'Verde Esmeralda' },
  { hex: '#D97706', name: 'Ámbar Cálido' },
  { hex: '#334155', name: 'Carbón Sobrio' },
  { hex: '#DC2626', name: 'Rojo Carmesí' },
]

export function BusinessProfileModal({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}: Props) {
  const [form, setForm] = useState<BusinessProfile>(() => ({ ...profile }))
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isOpen) {
      setForm({ ...profile })
      setErrorMessage(null)
    }
  }, [profile, isOpen])

  if (!isOpen) return null

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('El logo no debe superar los 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        setForm((prev) => ({ ...prev, logo: dataUrl }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setForm((prev) => ({ ...prev, logo: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    if (!form.name.trim()) {
      setErrorMessage('Ingresá el nombre o razón social de tu negocio.')
      return
    }
    setIsSaving(true)
    try {
      await onSaveProfile(form)
      onClose()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al guardar el perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Perfil Comercial y Datos del Negocio</h3>
              <p className="text-xs text-slate-500">Configurá tus datos una sola vez para utilizarlos en todos tus documentos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 py-4 space-y-4 pr-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* LOGO */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Logo del negocio o marca
            </label>
            <div className="flex items-center gap-3">
              {form.logo ? (
                <div className="relative group w-16 h-16 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px]">Sin logo</span>
                </div>
              )}

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  id="profile-modal-logo"
                  onChange={handleLogoUpload}
                />
                <label
                  htmlFor="profile-modal-logo"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg cursor-pointer border border-purple-200 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {form.logo ? 'Cambiar logo' : 'Subir imagen de logo'}
                </label>
                <p className="text-[10px] text-slate-500 mt-1">
                  Formatos PNG, JPG o WEBP hasta 2MB. Se incluirá en el encabezado de todos tus comprobantes.
                </p>
              </div>
            </div>
          </div>

          {/* DATOS FISCALES Y DE CONTACTO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Nombre o Razón Social *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Estudio Pixel / Taller San Jorge"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Identificación fiscal (CUIT / CUIL / DNI)
              </label>
              <input
                type="text"
                value={form.taxId || ''}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                placeholder="30-12345678-9"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Teléfono comercial / WhatsApp
              </label>
              <input
                type="text"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+54 11 1234-5678"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Correo electrónico comercial
              </label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="hola@tunegocio.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Dirección / Domicilio
              </label>
              <input
                type="text"
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Av. Belgrano 500"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Ciudad / Provincia
              </label>
              <input
                type="text"
                value={form.city || ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Córdoba, Argentina"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
          </div>

          {/* PREFERENCIAS PREDETERMINADAS */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">Valores por defecto en nuevos documentos</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Moneda habitual</label>
                <select
                  value={form.defaultCurrency}
                  onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value as CurrencyCode })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  {Object.values(CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Plantilla visual</label>
                <select
                  value={form.defaultTemplate}
                  onChange={(e) => setForm({ ...form, defaultTemplate: e.target.value as DesignTemplate })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Color de acento predeterminado</label>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_COLORS.map((c) => {
                  const isSel = form.defaultAccentColor.toUpperCase() === c.hex.toUpperCase()
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setForm({ ...form, defaultAccentColor: c.hex })}
                      className={`w-6 h-6 rounded-full cursor-pointer flex items-center justify-center ${
                        isSel ? 'ring-2 ring-purple-600 ring-offset-2 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSel && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                Datos bancarios y notas al pie frecuentes
              </label>
              <textarea
                rows={2}
                value={form.defaultNotes || ''}
                onChange={(e) => setForm({ ...form, defaultNotes: e.target.value })}
                placeholder="CBU / Alias / Condiciones de entrega..."
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Guardando perfil...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
