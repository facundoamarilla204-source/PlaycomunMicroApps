'use client'

import React, { useState, useRef } from 'react'
import { 
  Building2, 
  Tag, 
  Coins, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  FolderOpen,
  Crown,
  Edit2,
  Check,
  Upload,
  Trash2,
  Image as ImageIcon,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react'
import { PriceList, RubroType } from './types'
import { getBusinessProfileServer } from '@/app/actions/commercial-documents'

interface Props {
  list: PriceList
  isPro: boolean
  savedCount: number
  onUpdateName: (name: string) => void
  onUpdateBusinessName: (bName: string) => void
  onUpdateContactInfo: (contact: string) => void
  onUpdateCurrency: (currency: string) => void
  onUpdateRubro: (rubro: RubroType) => void
  onUpdateLogoUrl: (url: string) => void
  onNewList: () => void
  onOpenLibrary: () => void
  onOpenUpgradeModal: () => void
}

const RUBROS: { id: RubroType; title: string }[] = [
  { id: "general", title: "General Minimalista" },
  { id: "gastronomia", title: "Gastronomía (Menú)" },
  { id: "indumentaria", title: "Indumentaria y Moda" },
  { id: "mayorista", title: "Mayoristas y Distribuidores" },
  { id: "peluqueria", title: "Peluquería y Estética" },
  { id: "profesionales", title: "Servicios Profesionales" },
]

const CURRENCIES = [
  { code: 'ARS', label: 'ARS ($)' },
  { code: 'USD', label: 'USD (USD $)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'UYU', label: 'UYU ($U)' },
  { code: 'CLP', label: 'CLP ($)' },
]

export function PriceListHeader({
  list,
  isPro,
  savedCount,
  onUpdateName,
  onUpdateBusinessName,
  onUpdateContactInfo,
  onUpdateCurrency,
  onUpdateRubro,
  onUpdateLogoUrl,
  onNewList,
  onOpenLibrary,
  onOpenUpgradeModal,
}: Props) {
  const [showBusinessDetails, setShowBusinessDetails] = useState(true)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState(list.name)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Si tiene al menos un dato comercial, se considera activo por defecto
  const hasBusinessData = Boolean(list.business_name || list.contact_info || list.logo_url)
  const [includeBusinessInfo, setIncludeBusinessInfo] = useState<boolean>(hasBusinessData)

  const handleSaveTitle = () => {
    if (!tempTitle.trim()) return
    onUpdateName(tempTitle.trim())
    setIsEditingTitle(false)
  }

  const handleToggleInclude = () => {
    const nextState = !includeBusinessInfo
    setIncludeBusinessInfo(nextState)
    if (!nextState) {
      // Al desactivar, vaciamos los campos del PDF
      onUpdateBusinessName('')
      onUpdateContactInfo('')
      onUpdateLogoUrl('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleClearBusinessData = () => {
    onUpdateBusinessName('')
    onUpdateContactInfo('')
    onUpdateLogoUrl('')
    setIncludeBusinessInfo(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAutoFillProfile = async () => {
    if (!isPro) {
      onOpenUpgradeModal()
      return
    }
    setLoadingProfile(true)
    try {
      const res = await getBusinessProfileServer()
      if (res.data) {
        if (res.data.name) onUpdateBusinessName(res.data.name)
        const contactParts = [res.data.phone, res.data.email, res.data.city].filter(Boolean).join(' • ')
        if (contactParts) onUpdateContactInfo(contactParts)
        if (res.data.logo) onUpdateLogoUrl(res.data.logo)
        if (res.data.defaultCurrency) onUpdateCurrency(res.data.defaultCurrency)
        setIncludeBusinessInfo(true)
        setShowBusinessDetails(true)
      } else {
        alert("No se encontraron datos comerciales guardados en tu perfil. Podés escribirlos a continuación.")
      }
    } catch (e) {
      console.error("Error al cargar perfil comercial:", e)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert("El archivo es demasiado grande. El logo debe pesar menos de 2 MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        onUpdateLogoUrl(dataUrl)
        setIncludeBusinessInfo(true)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    onUpdateLogoUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 sm:p-7 shadow-xs border border-slate-200/90 space-y-5">
      {/* Barra superior de herramientas y navegación */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewList}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 active:bg-slate-950 transition-colors shadow-xs"
            title="Crear una lista limpia separada"
          >
            <Plus size={15} /> Nueva Lista
          </button>

          <button
            type="button"
            onClick={onOpenLibrary}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            title="Ver biblioteca de listas"
          >
            <FolderOpen size={15} className="text-purple-600" />
            <span>Mis Listas</span>
            {isPro && savedCount > 0 && (
              <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[10px] font-extrabold text-purple-700">
                {savedCount}
              </span>
            )}
            {!isPro && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md">
                <Crown size={10} /> PRO
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Moneda */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Coins size={14} className="text-slate-500" />
            <select
              value={list.currency || 'ARS'}
              onChange={(e) => onUpdateCurrency(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Selector de Plantilla / Rubro */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Tag size={14} className="text-purple-600" />
            <select
              value={list.rubro}
              onChange={(e) => onUpdateRubro(e.target.value as RubroType)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {RUBROS.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Título de la lista */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
          Nombre de la Lista
        </label>
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              className="flex-1 rounded-xl border border-purple-500 px-3.5 py-2 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-100"
              autoFocus
            />
            <button
              onClick={handleSaveTitle}
              className="rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-700"
            >
              <Check size={16} />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => {
              setTempTitle(list.name)
              setIsEditingTitle(true)
            }}
            className="group flex items-center justify-between cursor-pointer rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50/80 px-2 py-1 -mx-2 transition-all"
            title="Click para renombrar la lista"
          >
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {list.name || 'Lista de Precios'}
            </h1>
            <span className="flex items-center gap-1 text-xs text-slate-600 group-hover:text-purple-600 font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
              <Edit2 size={13} /> Editar título
            </span>
          </div>
        )}
      </div>

      {/* SECCIÓN DE DATOS COMERCIALES Y LOGO (CON ACTIVACIÓN / DESACTIVACIÓN) */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* Toggle de activación / desactivación */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleInclude}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors ${
                includeBusinessInfo
                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {includeBusinessInfo ? <Eye size={14} className="text-purple-700" /> : <EyeOff size={14} />}
              <span>{includeBusinessInfo ? 'Datos de negocio incluidos' : 'Sin datos de negocio (Solo lista)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBusinessDetails(!showBusinessDetails)}
              className="text-slate-400 hover:text-slate-700 p-1"
              title="Expandir / Contraer campos"
            >
              {showBusinessDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Acciones de autocompletado y limpieza */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoFillProfile}
              disabled={loadingProfile}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors shadow-2xs"
            >
              <Building2 size={13} />
              <span>{isPro ? (loadingProfile ? 'Cargando...' : 'Cargar datos guardados') : 'Cargar datos (PRO)'}</span>
            </button>

            {hasBusinessData && (
              <button
                type="button"
                onClick={handleClearBusinessData}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Quitar todos los datos del negocio y logo"
              >
                <Trash2 size={12} />
                <span>Quitar</span>
              </button>
            )}
          </div>
        </div>

        {/* Campos visibles cuando está expandido */}
        {showBusinessDetails && (
          <div className="pt-3 border-t border-slate-200/70 space-y-3.5">
            {!includeBusinessInfo && (
              <p className="text-xs text-slate-500 italic bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5">
                Los datos comerciales están desactivados para esta lista. El PDF se generará con un diseño limpio centrado exclusivamente en el catálogo.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre Comercial / Marca</label>
                <input
                  type="text"
                  placeholder="Ej: Panadería Los Aromos"
                  value={list.business_name || ''}
                  onChange={(e) => {
                    onUpdateBusinessName(e.target.value)
                    if (e.target.value) setIncludeBusinessInfo(true)
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Contacto / Redes / Dirección</label>
                <input
                  type="text"
                  placeholder="Ej: Tel: 11-2345-6789 • Instagram: @losaromos"
                  value={list.contact_info || ''}
                  onChange={(e) => {
                    onUpdateContactInfo(e.target.value)
                    if (e.target.value) setIncludeBusinessInfo(true)
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>
            </div>

            {/* SECCIÓN DEL LOGO COMERCIAL */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {list.logo_url ? (
                  <div className="relative group w-14 h-14 rounded-lg border border-slate-200 bg-slate-50 p-1 flex items-center justify-center overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={list.logo_url}
                      alt="Logo de la lista"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon size={18} />
                    <span className="text-[9px] mt-0.5">Sin logo</span>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-slate-800">Logo de la cabecera</h4>
                  <p className="text-[11px] text-slate-500">
                    {list.logo_url 
                      ? 'Imagen cargada en el encabezado del PDF' 
                      : 'Cargá tu logo en PNG, JPG o WEBP (hasta 2 MB)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  id="list-logo-upload"
                  onChange={handleLogoUpload}
                />
                
                <label
                  htmlFor="list-logo-upload"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors"
                >
                  <Upload size={13} />
                  <span>{list.logo_url ? 'Cambiar logo' : 'Subir logo'}</span>
                </label>

                {list.logo_url && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                    title="Quitar imagen de logo"
                  >
                    <Trash2 size={13} />
                    <span>Quitar</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
