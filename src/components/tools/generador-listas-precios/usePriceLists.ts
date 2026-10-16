"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  PriceList, 
  PriceListProduct, 
  Category, 
  RubroType, 
  RoundingRule, 
  PriceListUserStatus 
} from "./types"
import { 
  getPriceListUserStatusServer, 
  getUserPriceListsServer, 
  savePriceListServer, 
  deletePriceListServer, 
  duplicatePriceListServer 
} from "@/app/actions/price-lists"

const LOCAL_STORAGE_ACTIVE_KEY = "playcomun_price_list_current_v2"
const LEGACY_STORAGE_KEY = "playcomun_price_list_draft"

function createFreshList(rubro: RubroType = "general", name: string = "Nueva Lista de Precios"): PriceList {
  return {
    id: `local-${crypto.randomUUID()}`,
    rubro,
    name,
    business_name: "",
    contact_info: "",
    description: "",
    currency: "ARS",
    logo_url: "",
    categories: [],
    products: []
  }
}

export function usePriceLists() {
  const [activeList, setActiveList] = useState<PriceList | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingCloud, setSavingCloud] = useState(false)
  const [userStatus, setUserStatus] = useState<PriceListUserStatus>({
    isAuthenticated: false,
    isPro: false,
    userId: null,
    preservedCount: 0,
  })
  const [savedLists, setSavedLists] = useState<PriceList[]>([])
  const [loadingSavedLists, setLoadingSavedLists] = useState(false)

  // 1. Cargar estado de usuario en el servidor (Auth y Pro)
  const refreshUserStatus = useCallback(async () => {
    try {
      const status = await getPriceListUserStatusServer()
      setUserStatus(status)
      return status
    } catch (err) {
      console.error("Error al obtener estado de usuario:", err)
      return null
    }
  }, [])

  // 2. Cargar listas guardadas en la nube si es Pro
  const fetchSavedLists = useCallback(async () => {
    setLoadingSavedLists(true)
    try {
      const res = await getUserPriceListsServer()
      if (res.data) {
        setSavedLists(res.data)
      } else if (res.preservedCount) {
        setUserStatus(prev => ({ ...prev, preservedCount: res.preservedCount || 0 }))
      }
    } catch (err) {
      console.error("Error al obtener listas guardadas:", err)
    } finally {
      setLoadingSavedLists(false)
    }
  }, [])

  // 3. Inicialización inicial al montar
  useEffect(() => {
    refreshUserStatus().then(status => {
      if (status?.isPro) {
        fetchSavedLists()
      }
    })

    // Leer borrador activo de localStorage
    const savedActive = localStorage.getItem(LOCAL_STORAGE_ACTIVE_KEY)
    if (savedActive) {
      try {
        const parsed = JSON.parse(savedActive)
        setActiveList(parsed)
        setLoading(false)
        return
      } catch (e) {
        console.error("Error al parsear lista activa local:", e)
      }
    }

    // Fallback a borrador legacy si existía
    const legacyDraft = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacyDraft) {
      try {
        const parsed = JSON.parse(legacyDraft)
        setActiveList({
          ...parsed,
          currency: parsed.currency || "ARS"
        })
        localStorage.removeItem(LEGACY_STORAGE_KEY)
        setLoading(false)
        return
      } catch (e) {
        console.error("Error al migrar borrador legacy:", e)
      }
    }

    // Si no había nada, inicializar lista nueva limpia
    setActiveList(createFreshList("general"))
    setLoading(false)
  }, [refreshUserStatus, fetchSavedLists])

  // 4. Guardar cambios locales continuamente para evitar pérdidas por recarga accidental
  useEffect(() => {
    if (activeList) {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_KEY, JSON.stringify(activeList))
    }
  }, [activeList])

  // Iniciar una nueva lista (limpia y separada)
  const initNewList = (rubro: RubroType = "general", name: string = "Nueva Lista de Precios") => {
    const fresh = createFreshList(rubro, name)
    setActiveList(fresh)
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_KEY, JSON.stringify(fresh))
  }

  // Cargar una lista guardada en el editor
  const loadList = (list: PriceList) => {
    setActiveList(list)
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_KEY, JSON.stringify(list))
  }

  // Metadatos de cabecera
  const updateListName = (name: string) => {
    setActiveList(prev => prev ? { ...prev, name } : null)
  }

  const updateBusinessName = (business_name: string) => {
    setActiveList(prev => prev ? { ...prev, business_name } : null)
  }

  const updateContactInfo = (contact_info: string) => {
    setActiveList(prev => prev ? { ...prev, contact_info } : null)
  }

  const updateCurrency = (currency: string) => {
    setActiveList(prev => prev ? { ...prev, currency } : null)
  }

  const updateRubro = (rubro: RubroType) => {
    setActiveList(prev => prev ? { ...prev, rubro } : null)
  }

  const updateLogoUrl = (logo_url: string) => {
    setActiveList(prev => prev ? { ...prev, logo_url } : null)
  }

  // Categorías
  const addCategory = (name: string) => {
    if (!activeList || !name.trim()) return
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: name.trim(),
      sort_order: activeList.categories.length
    }
    setActiveList(prev => prev ? {
      ...prev,
      categories: [...prev.categories, newCategory]
    } : null)
  }

  const updateCategory = (id: string, newName: string) => {
    if (!activeList || !newName.trim()) return
    setActiveList(prev => prev ? {
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, name: newName.trim() } : c)
    } : null)
  }

  const removeCategory = (id: string) => {
    if (!activeList) return
    setActiveList(prev => prev ? {
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
      products: prev.products.filter(p => p.category_id !== id) // Limpia también sus productos
    } : null)
  }

  // Productos
  const addProduct = (product: Omit<PriceListProduct, "id" | "list_id" | "sort_order">) => {
    if (!activeList) return
    const newProduct: PriceListProduct = {
      ...product,
      id: crypto.randomUUID(),
      list_id: activeList.id,
      sort_order: activeList.products.filter(p => p.category_id === product.category_id).length
    }
    setActiveList(prev => prev ? {
      ...prev,
      products: [...prev.products, newProduct]
    } : null)
  }

  const updateProduct = (id: string, updates: Partial<PriceListProduct>) => {
    if (!activeList) return
    setActiveList(prev => prev ? {
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p)
    } : null)
  }

  const removeProduct = (id: string) => {
    if (!activeList) return
    setActiveList(prev => prev ? {
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    } : null)
  }

  // Ajuste masivo de precios
  const updatePricesMassively = ({
    percentage,
    increase = true,
    categoryId,
    roundingRule = "integer"
  }: {
    percentage: number
    increase: boolean
    categoryId?: string
    roundingRule?: RoundingRule
  }) => {
    if (!activeList || percentage <= 0) return
    const multiplier = increase ? (1 + percentage / 100) : (1 - percentage / 100)

    const applyRounding = (val: number): number => {
      switch (roundingRule) {
        case "none":
          return Number(val.toFixed(2))
        case "decimals":
          return Number(val.toFixed(2))
        case "integer":
          return Math.round(val)
        case "tens":
          return Math.round(val / 10) * 10
        case "fifties":
          return Math.round(val / 50) * 50
        case "hundreds":
          return Math.round(val / 100) * 100
        default:
          return Math.round(val)
      }
    }

    setActiveList(prev => {
      if (!prev) return null
      return {
        ...prev,
        products: prev.products.map(p => {
          if (categoryId && p.category_id !== categoryId) {
            return p
          }
          const rawNewPrice = p.price * multiplier
          const roundedPrice = applyRounding(rawNewPrice)
          return {
            ...p,
            price: Math.max(0, roundedPrice)
          }
        })
      }
    })
  }

  // Persistencia Pro en Supabase
  const saveToCloud = async (): Promise<{
    success: boolean
    error: string | null
    isProRequired?: boolean
  }> => {
    if (!activeList) return { success: false, error: "No hay lista activa" }
    
    // Si no está logueado o no es Pro
    if (!userStatus.isAuthenticated || !userStatus.isPro) {
      return { success: false, error: null, isProRequired: true }
    }

    setSavingCloud(true)
    try {
      const res = await savePriceListServer(activeList)
      if (res.error) {
        return { success: false, error: res.error, isProRequired: res.isProRequired }
      }
      if (res.data) {
        setActiveList(res.data)
        fetchSavedLists()
        return { success: true, error: null }
      }
      return { success: false, error: "Error desconocido" }
    } catch (e: any) {
      return { success: false, error: e?.message || "Error al conectar con la nube" }
    } finally {
      setSavingCloud(false)
    }
  }

  // Eliminar de la nube
  const deleteCloudList = async (id: string) => {
    const res = await deletePriceListServer(id)
    if (res.success) {
      setSavedLists(prev => prev.filter(l => l.id !== id))
      // Si eliminamos la lista que estaba activa, inicializamos una limpia
      if (activeList?.id === id) {
        initNewList()
      }
      return true
    }
    return false
  }

  // Duplicar en la nube
  const duplicateCloudList = async (id: string) => {
    const res = await duplicatePriceListServer(id)
    if (res.data) {
      fetchSavedLists()
      return res.data
    }
    return null
  }

  return {
    activeList,
    setActiveList,
    initNewList,
    loadList,
    updateListName,
    updateBusinessName,
    updateContactInfo,
    updateCurrency,
    updateRubro,
    updateLogoUrl,
    addCategory,
    updateCategory,
    removeCategory,
    addProduct,
    updateProduct,
    removeProduct,
    updatePricesMassively,
    saveToCloud,
    deleteCloudList,
    duplicateCloudList,
    savedLists,
    loadingSavedLists,
    fetchSavedLists,
    userStatus,
    refreshUserStatus,
    savingCloud,
    loading
  }
}
