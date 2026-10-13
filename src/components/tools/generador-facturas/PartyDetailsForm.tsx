'use client'

import React, { useRef } from 'react'
import { PartyInfo } from './types'
import { Building2, User, Upload, Trash2, Image as ImageIcon } from 'lucide-react'

interface Props {
  emisor: PartyInfo
  cliente: PartyInfo
  onUpdateEmisor: (field: keyof PartyInfo, value: string) => void
  onUpdateCliente: (field: keyof PartyInfo, value: string) => void
}

export function PartyDetailsForm({
  emisor,
  cliente,
  onUpdateEmisor,
  onUpdateCliente,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        onUpdateEmisor('logo', dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    onUpdateEmisor('logo', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-0.5">
          2. Emisor y cliente
        </label>
        <p className="text-xs text-slate-500">
          Identificación de las partes involucradas en la operación comercial.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DATOS DEL EMISOR (TU NEGOCIO) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Emisor (Tus Datos)</h3>
                <p className="text-[11px] text-slate-500">Datos comerciales de tu negocio o actividad</p>
              </div>
            </div>
          </div>

        {/* LOGO UPLOAD */}
        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Logo comercial (Opcional)
          </label>
          <div className="flex items-center gap-3">
            {emisor.logo ? (
              <div className="relative group w-16 h-16 rounded-md border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={emisor.logo}
                  alt="Logo del negocio"
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  title="Eliminar logo"
                  className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-md border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
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
                id="emisor-logo-upload"
                onChange={handleLogoUpload}
              />
              <label
                htmlFor="emisor-logo-upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg cursor-pointer border border-purple-200 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {emisor.logo ? 'Cambiar logo' : 'Subir imagen de logo'}
              </label>
              <p className="text-[10px] text-slate-500 mt-1">
                PNG, JPG o WEBP hasta 2MB. Se incluirá en el encabezado del PDF.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre o Razón Social *
            </label>
            <input
              type="text"
              placeholder="Ej. Estudio Pixel / Taller San Jorge"
              value={emisor.name}
              onChange={(e) => onUpdateEmisor('name', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Identificación fiscal (Opcional)
              </label>
              <input
                type="text"
                placeholder="CUIT, CUIL, DNI o RUT"
                value={emisor.taxId || ''}
                onChange={(e) => onUpdateEmisor('taxId', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                placeholder="+54 11 1234-5678"
                value={emisor.phone || ''}
                onChange={(e) => onUpdateEmisor('phone', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="contacto@tuempresa.com"
                value={emisor.email || ''}
                onChange={(e) => onUpdateEmisor('email', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dirección / Ubicación
              </label>
              <input
                type="text"
                placeholder="Calle 123, Ciudad"
                value={emisor.address || ''}
                onChange={(e) => onUpdateEmisor('address', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DATOS DEL CLIENTE / RECEPTOR */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cliente (Destinatario)</h3>
              <p className="text-[11px] text-slate-500">A quién va dirigido el documento</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre o Razón Social del Cliente *
            </label>
            <input
              type="text"
              placeholder="Ej. Distribuidora Los Andes / Juan Pérez"
              value={cliente.name}
              onChange={(e) => onUpdateCliente('name', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CUIT / DNI / Identificación
              </label>
              <input
                type="text"
                placeholder="Identificación del cliente"
                value={cliente.taxId || ''}
                onChange={(e) => onUpdateCliente('taxId', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono de contacto
              </label>
              <input
                type="text"
                placeholder="+54 11 9876-5432"
                value={cliente.phone || ''}
                onChange={(e) => onUpdateCliente('phone', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email del cliente
              </label>
              <input
                type="email"
                placeholder="cliente@ejemplo.com"
                value={cliente.email || ''}
                onChange={(e) => onUpdateCliente('email', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dirección / Entrega
              </label>
              <input
                type="text"
                placeholder="Domicilio del cliente"
                value={cliente.address || ''}
                onChange={(e) => onUpdateCliente('address', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}
