'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import {
  Expense,
  ExpenseInsert,
  ExpenseUpdate,
  CustomCategory,
  ExpenseUserStatus,
  LocalExpensesStorage,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  MovementType,
} from './types'
import {
  getExpenseUserStatusServer,
  getUserExpensesServer,
  createExpenseServer,
  updateExpenseServer,
  deleteExpenseServer,
  syncExpensesBatchServer,
  exportExpensesExcelServer,
} from '@/app/actions/expenses'
import {
  formatLocalDate,
  MovementFilterOptions,
} from '@/lib/control-gastos'

const GUEST_STORAGE_KEY = 'playcomun_control_gastos_guest_v1'
const LEGACY_STORAGE_KEY = 'playcomun_control_gastos_data_v1'

function getUserStorageKey(userId: string): string {
  return `playcomun_control_gastos_user_${userId}_v1`
}

function getActiveStorageKey(user: User | null): string {
  if (!user?.id) {
    return GUEST_STORAGE_KEY
  }
  return getUserStorageKey(user.id)
}

function generateSafeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'm_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
}

export function useControlGastos(user: User | null, initialIsPro: boolean = false) {
  // Estado de usuario y suscripción
  const [userStatus, setUserStatus] = useState<ExpenseUserStatus>({
    isAuthenticated: !!user,
    isPro: initialIsPro,
    userId: user?.id || null,
    preservedCount: 0,
  })

  // Movimientos
  const [cloudMovements, setCloudMovements] = useState<Expense[]>([])
  const [localMovements, setLocalMovements] = useState<Expense[]>([])
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])

  // Flags de carga y UI
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isImportBannerDismissed, setIsImportBannerDismissed] = useState(false)
  const [isProUpgradeModalOpen, setIsProUpgradeModalOpen] = useState(false)

  // 1. Cargar datos locales desde localStorage
  const loadLocalData = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      // 1. Migración o saneamiento seguro de la clave global legacy (playcomun_control_gastos_data_v1)
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (legacyRaw) {
        try {
          const legacyData = JSON.parse(legacyRaw) as LocalExpensesStorage
          if (user?.id) {
            // Usuario registrado: si no tiene storage personal aún, le migramos lo que tenía
            const userKey = getUserStorageKey(user.id)
            if (!localStorage.getItem(userKey)) {
              localStorage.setItem(userKey, legacyRaw)
            }
          } else {
            // Visitante no autenticado (Invitado):
            // Si la data legacy contiene movimientos que fueron creados por un usuario autenticado (con UUID en user_id),
            // NO se los mostramos al invitado. Se guardan en la clave de ese usuario para preservar sus datos.
            if (Array.isArray(legacyData.movements)) {
              const userMovements = legacyData.movements.filter(
                (m) => m.user_id && m.user_id !== 'local_user'
              )
              if (userMovements.length > 0 && userMovements[0].user_id) {
                const ownerKey = getUserStorageKey(userMovements[0].user_id)
                if (!localStorage.getItem(ownerKey)) {
                  localStorage.setItem(
                    ownerKey,
                    JSON.stringify({
                      ...legacyData,
                      movements: userMovements,
                    })
                  )
                }
              }

              // Solo movimientos anónimos de invitado pasan a GUEST_STORAGE_KEY si no existía ya
              const guestMovements = legacyData.movements.filter(
                (m) => !m.user_id || m.user_id === 'local_user'
              )
              if (guestMovements.length > 0 && !localStorage.getItem(GUEST_STORAGE_KEY)) {
                localStorage.setItem(
                  GUEST_STORAGE_KEY,
                  JSON.stringify({
                    ...legacyData,
                    movements: guestMovements,
                  })
                )
              }
            }
          }
          // Limpiar la clave legacy compartida
          localStorage.removeItem(LEGACY_STORAGE_KEY)
        } catch {
          localStorage.removeItem(LEGACY_STORAGE_KEY)
        }
      }

      // 2. Cargar desde la clave aislada correspondiente
      const activeKey = getActiveStorageKey(user)
      const stored = localStorage.getItem(activeKey)
      let parsedMovements: Expense[] = []
      let parsedCategories: CustomCategory[] = []

      if (stored) {
        const data = JSON.parse(stored) as LocalExpensesStorage
        if (Array.isArray(data.movements)) {
          // Filtro estricto: si no hay usuario logueado, NUNCA admitir movimientos con UUID de usuario
          const filteredMovements = !user
            ? data.movements.filter((m) => !m.user_id || m.user_id === 'local_user')
            : data.movements

          parsedMovements = filteredMovements.map((m) => ({
            ...m,
            id: m.id || generateSafeId(),
            type: m.type === 'income' ? 'income' : 'expense',
            amount: Number(m.amount) || 0,
            category: m.category || 'Otros',
            created_at: m.created_at || new Date().toISOString(),
            updated_at: m.updated_at || new Date().toISOString(),
          }))
        }
        if (Array.isArray(data.categories)) {
          parsedCategories = data.categories
        }
      }

      // 3. Migrar posibles movimientos huérfanos de sessionStorage.pending_expense
      const pending = sessionStorage.getItem('pending_expense')
      if (pending) {
        try {
          const pendingExp = JSON.parse(pending)
          const newExp: Expense = {
            id: generateSafeId(),
            user_id: user?.id || 'local_user',
            type: pendingExp.type === 'income' ? 'income' : 'expense',
            amount: Number(pendingExp.amount) || 0,
            description: pendingExp.description || 'Gasto pendiente',
            category: pendingExp.category || 'Otros',
            expense_date: pendingExp.expense_date || formatLocalDate(new Date()),
            payment_method: pendingExp.payment_method || null,
            notes: pendingExp.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          parsedMovements = [newExp, ...parsedMovements]
          sessionStorage.removeItem('pending_expense')
        } catch {
          sessionStorage.removeItem('pending_expense')
        }
      }

      setLocalMovements(parsedMovements)
      setCustomCategories(parsedCategories)
    } catch (e) {
      console.error('Error al cargar datos locales de control de gastos:', e)
    }
  }, [user])

  // Guardar en localStorage de forma segura en la clave aislada
  const persistLocalData = useCallback(
    (movements: Expense[], categories: CustomCategory[]) => {
      if (typeof window === 'undefined') return
      try {
        const key = getActiveStorageKey(user)
        const payload: LocalExpensesStorage = {
          version: 1,
          movements,
          categories,
          lastUpdated: new Date().toISOString(),
        }
        localStorage.setItem(key, JSON.stringify(payload))
      } catch (e) {
        console.error('Error al guardar en localStorage:', e)
      }
    },
    [user]
  )

  // 2. Verificar estado de usuario en servidor y cargar nube si es Pro
  const syncUserStatusAndCloud = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    loadLocalData()

    if (!user) {
      setUserStatus({
        isAuthenticated: false,
        isPro: false,
        userId: null,
        preservedCount: 0,
      })
      setCloudMovements([])
      setIsLoading(false)
      return
    }

    try {
      const status = await getExpenseUserStatusServer()
      setUserStatus(status)

      if (status.isPro) {
        const cloudRes = await getUserExpensesServer()
        if (cloudRes.data) {
          setCloudMovements(cloudRes.data)
        } else if (cloudRes.error) {
          console.warn('Error al cargar movimientos en la nube:', cloudRes.error)
        }
      } else {
        setCloudMovements([])
      }
    } catch (err) {
      console.error('Error al consultar estado de usuario:', err)
      setError('No se pudo verificar el estado de la cuenta. Operando en modo local.')
    } finally {
      setIsLoading(false)
    }
  }, [user, loadLocalData])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void syncUserStatusAndCloud()
  }, [syncUserStatusAndCloud])

  // Detectar si el usuario Pro tiene datos locales pendientes de sincronizar
  const showImportBanner = userStatus.isPro && localMovements.length > 0 && !isImportBannerDismissed

  // Conjunto activo de movimientos según el modo
  // Si el usuario es Pro, la fuente de verdad es la nube (cloudMovements).
  // Si no es Pro o no está autenticado, la fuente de verdad es el almacenamiento local (localMovements).
  const isCloudMode = userStatus.isAuthenticated && userStatus.isPro
  const activeMovements = isCloudMode ? cloudMovements : localMovements

  // 3. Crear movimiento (Ingreso o Gasto)
  const addMovement = async (
    data: Omit<ExpenseInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error?: string }> => {
    const amount = Number(data.amount)
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'El importe debe ser mayor a 0.' }
    }
    if (!data.description?.trim()) {
      return { success: false, error: 'La descripción es obligatoria.' }
    }

    const type: MovementType = data.type === 'income' ? 'income' : 'expense'
    const cleanPayload: {
      type: MovementType
      amount: number
      description: string
      category: string
      expense_date: string
      payment_method: string | null
      notes: string | null
    } = {
      type,
      amount,
      description: data.description.trim(),
      category: data.category?.trim() || 'Otros',
      expense_date: data.expense_date || formatLocalDate(new Date()),
      payment_method: data.payment_method || null,
      notes: data.notes?.trim() || null,
    }

    if (isCloudMode) {
      const res = await createExpenseServer(cleanPayload)
      if (res.error || !res.data) {
        return { success: false, error: res.error || 'Error al guardar en la nube.' }
      }
      setCloudMovements((prev) => [res.data!, ...prev])
      return { success: true }
    } else {
      // Modo Local (Gratis)
      const newMovement: Expense = {
        ...cleanPayload,
        id: generateSafeId(),
        user_id: user?.id || 'local_user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const updated = [newMovement, ...localMovements]
      setLocalMovements(updated)
      persistLocalData(updated, customCategories)
      return { success: true }
    }
  }

  // 4. Editar movimiento
  const updateMovement = async (
    id: string,
    updates: ExpenseUpdate
  ): Promise<{ success: boolean; error?: string }> => {
    if (isCloudMode) {
      const res = await updateExpenseServer(id, updates)
      if (res.error || !res.data) {
        return { success: false, error: res.error || 'Error al actualizar en la nube.' }
      }
      setCloudMovements((prev) => prev.map((m) => (m.id === id ? res.data! : m)))
      return { success: true }
    } else {
      // Modo Local
      const updated = localMovements.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            ...updates,
            updated_at: new Date().toISOString(),
          } as Expense
        }
        return m
      })
      setLocalMovements(updated)
      persistLocalData(updated, customCategories)
      return { success: true }
    }
  }

  // 5. Eliminar movimiento
  const deleteMovement = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (isCloudMode) {
      const res = await deleteExpenseServer(id)
      if (!res.success) {
        return { success: false, error: res.error || 'Error al eliminar en la nube.' }
      }
      setCloudMovements((prev) => prev.filter((m) => m.id !== id))
      return { success: true }
    } else {
      // Modo Local
      const updated = localMovements.filter((m) => m.id !== id)
      setLocalMovements(updated)
      persistLocalData(updated, customCategories)
      return { success: true }
    }
  }

  // 6. Administrar Categorías
  const addCategory = (name: string, type: MovementType) => {
    const trimmed = name.trim()
    if (!trimmed) return { success: false, error: 'El nombre de la categoría no puede estar vacío.' }

    const exists = customCategories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.type === type
    )
    if (exists) {
      return { success: false, error: 'Ya existe una categoría con ese nombre.' }
    }

    const newCat: CustomCategory = {
      id: generateSafeId(),
      name: trimmed,
      type,
    }
    const updated = [...customCategories, newCat]
    setCustomCategories(updated)
    persistLocalData(localMovements, updated)
    return { success: true }
  }

  const renameCategory = (id: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) return { success: false, error: 'El nuevo nombre no puede estar vacío.' }

    const target = customCategories.find((c) => c.id === id)
    if (!target) return { success: false, error: 'Categoría no encontrada.' }

    const oldName = target.name
    const updatedCategories = customCategories.map((c) =>
      c.id === id ? { ...c, name: trimmed } : c
    )
    setCustomCategories(updatedCategories)

    // Reasignar movimientos en local
    const updatedLocal = localMovements.map((m) =>
      m.category === oldName && m.type === target.type ? { ...m, category: trimmed } : m
    )
    setLocalMovements(updatedLocal)
    persistLocalData(updatedLocal, updatedCategories)

    // Si es modo nube, actualizar en nube
    if (isCloudMode) {
      setCloudMovements((prev) =>
        prev.map((m) =>
          m.category === oldName && m.type === target.type ? { ...m, category: trimmed } : m
        )
      )
    }

    return { success: true }
  }

  const deleteCategory = (id: string, reassignTo: string = 'Otros') => {
    const target = customCategories.find((c) => c.id === id)
    if (!target) return { success: false, error: 'Categoría no encontrada.' }

    const oldName = target.name
    const updatedCategories = customCategories.filter((c) => c.id !== id)
    setCustomCategories(updatedCategories)

    // Reasignar movimientos que utilizaban esta categoría para no dejarlos huérfanos
    const updatedLocal = localMovements.map((m) =>
      m.category === oldName && m.type === target.type ? { ...m, category: reassignTo } : m
    )
    setLocalMovements(updatedLocal)
    persistLocalData(updatedLocal, updatedCategories)

    if (isCloudMode) {
      setCloudMovements((prev) =>
        prev.map((m) =>
          m.category === oldName && m.type === target.type ? { ...m, category: reassignTo } : m
        )
      )
    }

    return { success: true }
  }

  // 7. Sincronización e Importación Local -> Nube (Solo Pro)
  const importLocalMovementsToCloud = async (): Promise<{
    success: boolean
    error?: string
  }> => {
    if (!userStatus.isPro) {
      setIsProUpgradeModalOpen(true)
      return { success: false, error: 'Se requiere suscripción Pro activa.' }
    }
    if (localMovements.length === 0) {
      return { success: true }
    }

    setIsSyncing(true)
    try {
      const res = await syncExpensesBatchServer(localMovements)
      if (res.error || !res.success) {
        throw new Error(res.error || 'Error al sincronizar con la nube.')
      }

      // Éxito: refrescar movimientos de la nube y limpiar la cola local
      const cloudRes = await getUserExpensesServer()
      if (cloudRes.data) {
        setCloudMovements(cloudRes.data)
      }

      setLocalMovements([])
      persistLocalData([], customCategories)
      setIsImportBannerDismissed(true)
      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al sincronizar movimientos'
      console.error('Error durante la importación a la nube:', err)
      return { success: false, error: msg }
    } finally {
      setIsSyncing(false)
    }
  }

  const discardLocalMovements = () => {
    setIsImportBannerDismissed(true)
    setLocalMovements([])
    persistLocalData([], customCategories)
  }

  // 8. Exportación a Excel (Protegido para Pro)
  const handleExportExcel = async (filterOptions: MovementFilterOptions) => {
    if (!userStatus.isPro) {
      setIsProUpgradeModalOpen(true)
      return
    }

    try {
      const res = await exportExpensesExcelServer(filterOptions)
      if (res.error || !res.base64 || !res.fileName) {
        alert(res.error || 'No se pudo generar el archivo Excel.')
        return
      }

      // Convertir base64 a Blob y disparar descarga
      const binaryString = window.atob(res.base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error al exportar a Excel:', err)
      alert('Hubo un problema al exportar el archivo Excel.')
    }
  }

  // Lista combinada de categorías según el tipo
  const getCategoriesForType = useCallback(
    (type: MovementType): string[] => {
      const defaults =
        type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES
      const customs = customCategories.filter((c) => c.type === type).map((c) => c.name)
      return Array.from(new Set([...defaults, ...customs]))
    },
    [customCategories]
  )

  return {
    userStatus,
    isCloudMode,
    movements: activeMovements,
    localMovementsCount: localMovements.length,
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
    refresh: syncUserStatusAndCloud,
  }
}
