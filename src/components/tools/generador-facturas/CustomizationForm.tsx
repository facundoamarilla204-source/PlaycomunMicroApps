'use client'

import React from 'react'
import { DesignTemplate, CommercialDocument } from './types'
import { Palette, LayoutTemplate, MessageSquare, Check } from 'lucide-react'

interface Props {
  designTemplate: DesignTemplate
  accentColor: string
  footerNotes: string
  onUpdateGeneral: (field: keyof CommercialDocument, value: unknown) => void
}

const TEMPLATES: { id: DesignTemplate; label: string; desc: string }[] = [
  {
    id: 'modern',
    label: 'Moderno',
    desc: 'Banda de acento superior, recuadros redondeados y estilo visual contemporáneo.',
  },
  {
    id: 'classic',
    label: 'Clásico / Formal',
    desc: 'Líneas estructuradas, tipografía sobria y formato comercial tradicional.',
  },
  {
    id: 'minimal',
    label: 'Minimalista',
    desc: 'Diseño limpio sin fondos pesados, gran legibilidad y bajo consumo de tinta.',
  },
]

const ACCENT_COLORS = [
  { hex: '#7C3AED', name: 'Violeta PlayComún' },
  { hex: '#2563EB', name: 'Azul Corporativo' },
  { hex: '#059669', name: 'Verde Esmeralda' },
  { hex: '#D97706', name: 'Ámbar Cálido' },
  { hex: '#334155', name: 'Carbón Sobrio' },
  { hex: '#DC2626', name: 'Rojo Carmesí' },
]

export function CustomizationForm({
  designTemplate,
  accentColor,
  footerNotes,
  onUpdateGeneral,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            6. Presentación y datos al pie
          </h3>
          <p className="text-[11px] text-slate-500">
            Estilo de impresión, color de acento y datos bancarios o de garantía
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PLANTILLAS EDITORIALES */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5">
              <LayoutTemplate className="w-3.5 h-3.5 text-purple-600" />
              Estilo de presentación del documento
            </span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TEMPLATES.map((tmpl) => {
              const isSelected = designTemplate === tmpl.id
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => onUpdateGeneral('designTemplate', tmpl.id)}
                  className={`p-3 text-left rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/60 shadow-2xs ring-1 ring-purple-600/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{tmpl.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">{tmpl.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* COLOR DE ACENTO */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-600" />
              Color de acento del documento
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            {ACCENT_COLORS.map((c) => {
              const isSelected = accentColor.toUpperCase() === c.hex.toUpperCase()
              return (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onUpdateGeneral('accentColor', c.hex)}
                  title={c.name}
                  className={`relative w-8 h-8 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    isSelected ? 'ring-2 ring-offset-2 ring-purple-600 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              )
            })}
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-slate-500">Personalizado:</span>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onUpdateGeneral('accentColor', e.target.value)}
                className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Aplica a los títulos principales, encabezados de tabla y badges del PDF.
          </p>
        </div>
      </div>

      {/* PIE DE PÁGINA / OBSERVACIONES */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
            Notas al pie, observaciones y datos bancarios
          </span>
        </label>
        <textarea
          rows={3}
          value={footerNotes}
          onChange={(e) => onUpdateGeneral('footerNotes', e.target.value)}
          placeholder="Ej. Datos bancarios para transferencias: CBU 0720... / Alias: mi.negocio.mp / Condiciones de entrega..."
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
        />
        <p className="text-[10px] text-slate-500 mt-1">
          Aparece al pie del documento impreso antes de la firma.
        </p>
      </div>
    </div>
  )
}
