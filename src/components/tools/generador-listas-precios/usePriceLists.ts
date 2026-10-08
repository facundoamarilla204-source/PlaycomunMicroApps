"use client"
import { useState, useEffect } from 'react'
import { PriceList, PriceListProduct } from './types'
import { createClient } from '@/utils/supabase/client'

export function usePriceLists() {
  const [lists, setLists] = useState<PriceList[]>([])
  const [activeList, setActiveList] = useState<PriceList | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadLists()
  }, [])

  const loadLists = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('price_lists').select('*').order('updated_at', { ascending: false })
        if (data) {
          setLists(data as PriceList[])
        }
      } else {
        const saved = localStorage.getItem('localPriceList')
        if (saved) {
          const parsed = JSON.parse(saved)
          setActiveList(parsed)
          setLists([parsed])
        }
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const saveList = async (list: PriceList) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Here you would do upsert to Supabase
      }
      localStorage.setItem('localPriceList', JSON.stringify(list))
      setActiveList(list)
    } catch (err) {
      console.error(err)
    }
  }

  const addProduct = (product: PriceListProduct) => {
    let currentList = activeList
    if (!currentList) {
      currentList = { id: crypto.randomUUID(), name: "Mi Lista", products: [] }
    }
    const updated = { ...currentList, products: [...currentList.products, product] }
    saveList(updated)
  }

  const removeProduct = (productId: string) => {
    if (!activeList) return
    const updated = { ...activeList, products: activeList.products.filter(p => p.id !== productId) }
    saveList(updated)
  }
  
  const updatePricesMassively = (percentage: number, isIncrease: boolean) => {
    if (!activeList) return
    
    const factor = isIncrease ? (1 + percentage / 100) : (1 - percentage / 100)
    const updatedProducts = activeList.products.map(p => ({
      ...p,
      price: Math.round(p.price * factor)
    }))
    
    saveList({ ...activeList, products: updatedProducts })
  }

  return { lists, activeList, setActiveList, saveList, addProduct, removeProduct, updatePricesMassively, loading }
}
