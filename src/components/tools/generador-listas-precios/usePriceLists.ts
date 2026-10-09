"use client"
import { useState, useEffect } from "react"
import { PriceList, PriceListProduct, Category, MassUpdateType, RubroType } from "./types"
import { createClient } from "@/utils/supabase/client"

const LOCAL_STORAGE_KEY = "playcomun_price_list_draft"

export function usePriceLists() {
  const [activeList, setActiveList] = useState<PriceList | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Load from local storage initially
  useEffect(() => {
    const draft = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (draft) {
      try {
        setActiveList(JSON.parse(draft))
      } catch (e) {
        console.error("Failed to parse local draft", e)
      }
    }
    setLoading(false)
  }, [])

  // Save to local storage whenever it changes
  useEffect(() => {
    if (activeList) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(activeList))
    }
  }, [activeList])

  const initList = (rubro: RubroType) => {
    setActiveList({
      id: crypto.randomUUID(),
      rubro,
      name: "Nueva Lista",
      categories: [],
      products: []
    })
  }

  const updateRubro = (rubro: RubroType) => {
    setActiveList(prev => prev ? { ...prev, rubro } : null)
  }

  const addCategory = (name: string) => {
    if (!activeList) return
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name,
      sort_order: activeList.categories.length
    }
    setActiveList(prev => prev ? {
      ...prev,
      categories: [...prev.categories, newCategory]
    } : null)
  }

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

  const removeProduct = (id: string) => {
    if (!activeList) return
    setActiveList(prev => prev ? {
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    } : null)
  }

  const updatePricesMassively = (percentage: number, increase: boolean) => {
    if (!activeList) return
    const multiplier = increase ? (1 + percentage / 100) : (1 - percentage / 100)
    
    setActiveList(prev => prev ? {
      ...prev,
      products: prev.products.map(p => ({
        ...p,
        price: p.price * multiplier
      }))
    } : null)
  }

  return {
    activeList,
    setActiveList,
    initList,
    updateRubro,
    addCategory,
    addProduct,
    removeProduct,
    updatePricesMassively,
    loading
  }
}
