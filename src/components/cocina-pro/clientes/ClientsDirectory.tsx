'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Edit2,
  Trash2,
  FileText,
} from 'lucide-react'
import { KitchenClient } from '@/lib/gastronomia/types'
import { ClientModal } from './ClientModal'
import {
  toggleKitchenClientActiveServer,
  deleteKitchenClientServer,
} from '@/app/actions/kitchen-orders'

interface ClientsDirectoryProps {
  initialClients: KitchenClient[]
}

export function ClientsDirectory({ initialClients }: ClientsDirectoryProps) {
  const [clients, setClients] = useState<KitchenClient[]>(initialClients)
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<KitchenClient | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const filteredClients = useMemo(() => {
    let result = clients

    if (!showInactive) {
      result = result.filter((c) => c.is_active)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q))
      )
    }

    return result
  }, [clients, searchQuery, showInactive])

  const handleCreateNew = () => {
    setEditingClient(null)
    setIsModalOpen(true)
  }

  const handleEdit = (client: KitchenClient) => {
    setEditingClient(client)
    setIsModalOpen(true)
  }

  const handleModalSuccess = (savedClient: KitchenClient) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === savedClient.id)
      if (exists) {
        return prev.map((c) => (c.id === savedClient.id ? savedClient : c))
      }
      return [savedClient, ...prev]
    })
    setActionSuccess(
      editingClient
        ? `Cliente "${savedClient.name}" actualizado.`
        : `Cliente "${savedClient.name}" creado con éxito.`
    )
    setTimeout(() => setActionSuccess(null), 3000)
  }

  const handleToggleActive = async (client: KitchenClient) => {
    setActionError(null)
    const newStatus = !client.is_active
    const res = await toggleKitchenClientActiveServer(client.id, newStatus)

    if (res.error) {
      setActionError(res.error)
      return
    }

    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, is_active: newStatus } : c))
    )
    setActionSuccess(
      newStatus
        ? `Cliente "${client.name}" reactivado.`
        : `Cliente "${client.name}" desactivado.`
    )
    setTimeout(() => setActionSuccess(null), 3000)
  }

  const handleDelete = async (client: KitchenClient) => {
    if (client.orders_count && client.orders_count > 0) {
      setActionError(
        `No se puede eliminar a "${client.name}" porque tiene ${client.orders_count} pedido(s) histórico(s). Puedes desactivarlo para que no aparezca en nuevos pedidos.`
      )
      return
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente a "${client.name}"?`
    )
    if (!confirmDelete) return

    setActionError(null)
    const res = await deleteKitchenClientServer(client.id)

    if (res.error) {
      setActionError(res.error)
      return
    }

    setClients((prev) => prev.filter((c) => c.id !== client.id))
    setActionSuccess(`Cliente "${client.name}" eliminado.`)
    setTimeout(() => setActionSuccess(null), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con identidad de Amasia */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-900 border border-violet-200/80">
              Directorio comercial
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Amasia</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#7f22fe]" />
            Clientes de Amasia ({clients.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
            Agenda de contactos comerciales para registrar pedidos de pastelería y cocina con datos de entrega y notas técnicas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNew}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#7f22fe] hover:bg-[#6c1ce0] active:bg-[#5b14c4] text-white text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7f22fe] shadow-xs transition-all min-h-[44px] cursor-pointer shrink-0 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Nuevo cliente</span>
        </button>
      </div>

      {/* Avisos */}
      {actionError && (
        <div className="p-4 rounded-xl text-xs sm:text-sm font-medium bg-rose-50 text-rose-900 border border-rose-200">
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl text-xs sm:text-sm font-medium bg-emerald-50 text-emerald-900 border border-emerald-200">
          {actionSuccess}
        </div>
      )}

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono, email o dirección..."
            className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7f22fe]/20 focus:border-[#7f22fe] focus:bg-white transition-all min-h-[44px]"
          />
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 px-3 py-2 rounded-xl bg-slate-50/60 border border-slate-200/70 hover:bg-slate-100 select-none transition-colors min-h-[44px]">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded text-[#7f22fe] focus:ring-[#7f22fe] border-slate-300"
          />
          <span>Mostrar inactivos ({clients.filter((c) => !c.is_active).length})</span>
        </label>
      </div>

      {/* Listado de clientes */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-white">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 font-sans">
            {searchQuery ? 'Sin resultados para la búsqueda' : 'Aún no registraste clientes'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'Probá modificando los términos de búsqueda o incluyendo clientes inactivos.'
              : 'Agregá a tus clientes frecuentes para seleccionarlos rápidamente al registrar pedidos comerciales.'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#7f22fe] hover:bg-[#6c1ce0] text-white transition-all min-h-[44px] shadow-xs active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Crear primer cliente
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Vista móvil: tarjetas estructuradas (md:hidden) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredClients.map((c) => (
              <div
                key={c.id}
                className={`p-4 rounded-2xl border bg-white shadow-xs transition-shadow ${
                  c.is_active
                    ? 'border-slate-200/90'
                    : 'border-slate-200 opacity-60 bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-sans">
                      {c.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          c.is_active
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}
                      >
                        {c.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      {c.orders_count !== undefined && c.orders_count > 0 && (
                        <span className="text-[11px] font-semibold text-violet-900 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200/80">
                          {c.orders_count} pedido(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/cocina-pro/pedidos/nuevo?clientId=${c.id}`}
                    className="p-2 text-[#7f22fe] hover:bg-violet-50 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center border border-violet-200/80 active:scale-[0.98]"
                    title="Crear pedido para este cliente"
                    aria-label={`Crear pedido para ${c.name}`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </Link>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${c.phone}`} className="hover:underline">
                        {c.phone}
                      </a>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}
                  {c.notes && (
                    <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-500 italic">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{c.notes}</span>
                    </div>
                  )}
                </div>

                {/* Acciones móviles */}
                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(c)}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg min-h-[44px] flex items-center"
                  >
                    {c.is_active ? 'Desactivar' : 'Reactivar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(c)}
                    className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Editar ${c.name}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Eliminar ${c.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Vista escritorio: tabla estructurada (hidden md:block) */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Contacto</th>
                  <th className="py-3.5 px-4">Dirección</th>
                  <th className="py-3.5 px-4 text-center">Pedidos</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      !c.is_active ? 'opacity-60 bg-slate-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{c.name}</div>
                      {c.notes && (
                        <div className="text-xs text-slate-500 font-normal truncate max-w-xs">
                          {c.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {c.phone && <div>{c.phone}</div>}
                      {c.email && <div className="text-slate-400">{c.email}</div>}
                      {!c.phone && !c.email && <span className="text-slate-400">Sin datos</span>}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {c.address || <span className="text-slate-400">Sin dirección</span>}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-900 border border-violet-200/80">
                        {c.orders_count || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}
                      >
                        {c.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/cocina-pro/pedidos/nuevo?clientId=${c.id}`}
                          className="p-2 text-[#7f22fe] hover:text-[#6c1ce0] hover:bg-violet-50 rounded-lg transition-all active:scale-[0.98]"
                          title="Crear pedido comercial"
                          aria-label={`Crear pedido para ${c.name}`}
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleEdit(c)}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar cliente"
                          aria-label={`Editar ${c.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-xs"
                          title={c.is_active ? 'Desactivar cliente' : 'Reactivar cliente'}
                        >
                          {c.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar cliente"
                          aria-label={`Eliminar ${c.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de edición / alta */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        client={editingClient}
      />
    </div>
  )
}
