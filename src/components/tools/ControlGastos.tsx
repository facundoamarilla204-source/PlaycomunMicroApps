'use client'

import React, { useState, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import {
  Search,
  SlidersHorizontal,
  Cloud,
  HardDrive,
  FileSpreadsheet,
  Crown,
  Settings2,
} from 'lucide-react'
import { useControlGastos } from './control-gastos/useControlGastos'
import { ExpenseForm } from './control-gastos/ExpenseForm'
import { ExpenseList } from './control-gastos/ExpenseList'
import { ExpenseSummary } from './control-gastos/ExpenseSummary'
import { CategoryModal } from './control-gastos/CategoryModal'
import { CloudSyncBanner } from './control-gastos/CloudSyncBanner'
import { PreservedDataNotice } from './control-gastos/PreservedDataNotice'
import { ProExpensesModal } from './control-gastos/ProExpensesModal'
import {
  Expense,
  PeriodFilter,
  SortFilter,
  MovementType,
  PAYMENT_METHODS,
} from './control-gastos/types'
import { filterAndSortMovements } from '@/lib/control-gastos'

export function ControlGastos({
  user,
  initialIsPro = false,
}: {
  user: User | null
  initialIsPro?: boolean
}) {
  const {
    userStatus,
    isCloudMode,
    movements,
    localMovementsCount,
    isLoading,
    isSyncing,
    error,
    showImportBanner,
    isProUpgradeModalOpen,
    setIsProUpgradeModalOpen,
    addMovement,
    updateMovement,
    deleteMovement,
    getCategoriesForType,
    customCategories,
    addCategory,
    renameCategory,
    deleteCategory,
    importLocalMovementsToCloud,
    discardLocalMovements,
    handleExportExcel,
  } = useControlGastos(user, initialIsPro)

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  // Filtros de búsqueda y período
  const [searchQuery, setSearchQuery] = useState('')
  const [period, setPeriod] = useState<PeriodFilter>('este-mes')
  const [typeFilter, setTypeFilter] = useState<'all' | MovementType>('all')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [paymentFilter, setPaymentFilter] = useState('Todos')
  const [sortBy, setSortBy] = useState<SortFilter>('mas-recientes')
  const [showFilters, setShowFilters] = useState(false)

  // Opciones de categorías para el filtro
  const allAvailableCategories = useMemo(() => {
    const expensesCats = getCategoriesForType('expense')
    const incomeCats = getCategoriesForType('income')
    return Array.from(new Set([...expensesCats, ...incomeCats]))
  }, [getCategoriesForType])

  // Movimientos filtrados
  const filteredExpenses = useMemo(() => {
    return filterAndSortMovements(movements, {
      searchQuery,
      period,
      typeFilter,
      categoryFilter,
      paymentFilter,
      sortBy,
      referenceDate: new Date(),
    })
  }, [movements, searchQuery, period, typeFilter, categoryFilter, paymentFilter, sortBy])

  // Etiqueta legible del período
  const periodLabel = useMemo(() => {
    switch (period) {
      case 'hoy':
        return 'Hoy'
      case 'esta-semana':
        return 'Esta semana'
      case 'este-mes':
        return 'Este mes'
      case 'mes-anterior':
        return 'Mes anterior'
      case 'todos':
      default:
        return 'Todos los movimientos'
    }
  }, [period])

  return (
    <div className="w-full max-w-6xl mx-auto pb-12 font-sans px-3 sm:px-4">
      {/* Cabecera Superior: Título, Indicador de Modo y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Control de Gastos y Finanzas
            </h1>
            {isCloudMode ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                <Cloud className="w-3.5 h-3.5 text-purple-600" />
                <span>Nube Pro</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                <span>Modo Local (Gratis)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {isCloudMode
              ? 'Tus movimientos están sincronizados con tu cuenta PlayComun Online.'
              : 'Tus registros se guardan en este dispositivo. Podés usarlos sin límites y sin registrarte.'}
          </p>
        </div>

        {/* Acciones de Cabecera */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors shadow-2xs"
            title="Administrar categorías"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Categorías</span>
          </button>

          {/* Botón Exportar a Excel */}
          <button
            type="button"
            onClick={() => {
              if (isCloudMode) {
                handleExportExcel({
                  searchQuery,
                  period,
                  typeFilter,
                  categoryFilter,
                  paymentFilter,
                  sortBy,
                })
              } else {
                setIsProUpgradeModalOpen(true)
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
              isCloudMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
            }`}
            title={
              isCloudMode
                ? 'Descargar reporte completo en Excel'
                : 'Función Pro: Exportar a Excel'
            }
          >
            <FileSpreadsheet
              className={`w-4 h-4 ${isCloudMode ? 'text-white' : 'text-emerald-600'}`}
            />
            <span>Exportar Excel</span>
            {!isCloudMode && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold">
                <Crown className="w-2.5 h-2.5" />
                <span>PRO</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Aviso de Movimientos Preservados (Si venció Pro) */}
      {!isCloudMode && userStatus.preservedCount > 0 && (
        <PreservedDataNotice
          preservedCount={userStatus.preservedCount}
          onUpgradeClick={() => setIsProUpgradeModalOpen(true)}
        />
      )}

      {/* Banner de Sincronización Pro (Si hay datos locales al iniciar Pro) */}
      {showImportBanner && (
        <CloudSyncBanner
          localCount={localMovementsCount}
          isSyncing={isSyncing}
          onImport={importLocalMovementsToCloud}
          onDiscard={discardLocalMovements}
        />
      )}

      {/* Layout Principal de Dos Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Lado Izquierdo: Formulario */}
        <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200 lg:sticky lg:top-24">
          <ExpenseForm
            onAdd={addMovement}
            onUpdate={updateMovement}
            editingExpense={editingExpense}
            onCancelEdit={() => setEditingExpense(null)}
            getCategoriesForType={getCategoriesForType}
            onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          />
        </div>

        {/* Lado Derecho: Resumen, Filtros y Lista */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Tarjetas de Resumen Dinámicas */}
          <ExpenseSummary expenses={filteredExpenses} periodLabel={periodLabel} />

          {/* Contenedor de Lista y Filtros */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-6 lg:p-7">
            {/* Barra de Filtros Principales */}
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Selector rápido de tipo: Todos / Ingresos / Gastos */}
                <div className="flex p-1 bg-slate-100 rounded-xl self-start sm:self-auto w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setTypeFilter('all')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      typeFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter('income')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      typeFilter === 'income'
                        ? 'bg-white text-emerald-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ingresos
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter('expense')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      typeFilter === 'expense'
                        ? 'bg-white text-rose-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Gastos
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-1 max-w-md">
                  {/* Buscador */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por descripción o nota..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs sm:text-sm font-medium"
                    />
                  </div>

                  {/* Botón Filtros Avanzados */}
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                      showFilters
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                    title="Filtros avanzados"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">Filtros</span>
                  </button>
                </div>
              </div>

              {/* Filtros Expandibles */}
              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-xs animate-in slide-in-from-top-2">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Período</label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="hoy">Hoy</option>
                      <option value="esta-semana">Esta semana</option>
                      <option value="este-mes">Este mes</option>
                      <option value="mes-anterior">Mes anterior</option>
                      <option value="todos">Todos los registros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Categoría</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="Todas">Todas las categorías</option>
                      {allAvailableCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Medio de Pago</label>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="Todos">Todos los medios</option>
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Ordenar por</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortFilter)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="mas-recientes">Más recientes</option>
                      <option value="mas-antiguos">Más antiguos</option>
                      <option value="mayor-monto">Mayor monto</option>
                      <option value="menor-monto">Menor monto</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl mb-4 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Listado de Movimientos */}
            <ExpenseList
              expenses={filteredExpenses}
              isLoading={isLoading}
              onEdit={setEditingExpense}
              onDelete={deleteMovement}
            />
          </div>
        </div>
      </div>

      {/* Modal de Gestión de Categorías */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        customCategories={customCategories}
        onAddCategory={addCategory}
        onRenameCategory={renameCategory}
        onDeleteCategory={deleteCategory}
      />

      {/* Modal Pro / Preservación de Datos */}
      <ProExpensesModal
        isOpen={isProUpgradeModalOpen}
        onClose={() => setIsProUpgradeModalOpen(false)}
        preservedCount={userStatus.preservedCount}
      />
    </div>
  )
}
