'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  Truck,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Layers,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react'
import type { Supplier } from '@/lib/gastronomia/types'
import { deleteSupplierServer } from '@/app/actions/suppliers'
import { SupplierModal } from './SupplierModal'
import { SupplierIngredientsManager } from './SupplierIngredientsManager'

interface SuppliersListProps {
  initialSuppliers: Supplier[]
}

export function SuppliersList({ initialSuppliers }: SuppliersListProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')

  // Modales
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null | 'new'>(null)
  const [managingIngredientsSupplier, setManagingIngredientsSupplier] = useState<Supplier | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      (s.contact_name && s.contact_name.toLowerCase().includes(search.toLowerCase().trim()))

    if (!matchesSearch) return false

    if (statusFilter === 'active') return s.is_active
    if (statusFilter === 'inactive') return !s.is_active
    return true
  })

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al proveedor "${name}"? Esta acción no se puede deshacer.`)) {
      return
    }
    setDeletingId(id)
    const res = await deleteSupplierServer(id)
    setDeletingId(null)
    if (!res.error) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id))
    } else {
      alert(res.error)
    }
  }

  const handleSaved = (savedSupplier: Supplier) => {
    setSuppliers((prev) => {
      const idx = prev.findIndex((s) => s.id === savedSupplier.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = savedSupplier
        return next
      }
      return [savedSupplier, ...prev]
    })
    setEditingSupplier(null)
  }

  return (
    <div className="space-y-6">
      {/* Barra de Búsqueda y Botón Nuevo */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar proveedor por nombre o contacto..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-md transition-colors min-h-[36px] ${
                statusFilter === 'active' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Activos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors min-h-[36px] ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Todos ({suppliers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-md transition-colors min-h-[36px] ${
                statusFilter === 'inactive' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Inactivos
            </button>
          </div>

          <button
            type="button"
            onClick={() => setEditingSupplier('new')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-hover rounded-xl shadow-xs transition-colors shrink-0 min-h-[44px] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo proveedor</span>
          </button>
        </div>
      </div>

      {/* Lista de Proveedores */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-xs">
          <Truck className="h-10 w-10 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-slate-800">
            No se encontraron proveedores
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? 'No hay proveedores que coincidan con la búsqueda.'
              : 'Registrá tus proveedores habituales para comparar precios, presentaciones y preparar órdenes de compra.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => setEditingSupplier('new')}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Registrar primer proveedor</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className={`bg-white rounded-xl border p-4 sm:p-5 shadow-xs transition-colors space-y-3.5 ${
                supplier.is_active ? 'border-slate-200/90' : 'border-slate-200/60 opacity-75 bg-slate-50/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {supplier.name}
                    </h3>
                    {!supplier.is_active && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Inactivo
                      </span>
                    )}
                  </div>
                  {supplier.contact_name && (
                    <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                      Contacto: {supplier.contact_name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingSupplier(supplier)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Editar datos de proveedor"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(supplier.id, supplier.name)}
                    disabled={deletingId === supplier.id}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    title="Eliminar proveedor"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Contactos */}
              <div className="space-y-1.5 text-xs text-slate-600">
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                )}
                {supplier.notes && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                    {supplier.notes}
                  </p>
                )}
              </div>

              {/* Acciones y Métricas */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setManagingIngredientsSupplier(supplier)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline min-h-[36px]"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>
                    {supplier.ingredients_count || 0} insumo(s) asociado(s)
                  </span>
                </button>

                <Link
                  href={`/cocina-pro/compras/nueva?supplier_id=${supplier.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors min-h-[36px]"
                >
                  <ShoppingCart className="h-3.5 w-3.5 text-slate-600" />
                  <span>Crear compra</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo / Editar Proveedor */}
      {editingSupplier && (
        <SupplierModal
          supplier={editingSupplier === 'new' ? null : editingSupplier}
          onClose={() => setEditingSupplier(null)}
          onSuccess={handleSaved}
        />
      )}

      {/* Modal de Insumos / Presentaciones Asociadas */}
      {managingIngredientsSupplier && (
        <SupplierIngredientsManager
          supplier={managingIngredientsSupplier}
          onClose={() => {
            setManagingIngredientsSupplier(null)
          }}
          onUpdated={(count) => {
            setSuppliers((prev) =>
              prev.map((s) =>
                s.id === managingIngredientsSupplier.id
                  ? { ...s, ingredients_count: count }
                  : s
              )
            )
          }}
        />
      )}
    </div>
  )
}
