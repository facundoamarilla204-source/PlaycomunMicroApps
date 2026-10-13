'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CommercialDocument,
  CurrencyCode,
  DocumentLineItem,
  DocumentType,
  PartyInfo,
} from './types'
import {
  calculateDocumentTotals,
  calculateLineSubtotal,
  generateDefaultDocNumber,
  roundDecimal,
} from './math'
import { getSampleDocument } from './sampleData'

const STORAGE_KEY = 'playcomun_comercial_doc_draft_v1'

function createEmptyDocument(type: DocumentType = 'presupuesto'): CommercialDocument {
  const today = new Date().toISOString().split('T')[0]
  return {
    id: `doc-${Date.now()}`,
    type,
    number: generateDefaultDocNumber(type),
    issueDate: today,
    currency: 'ARS',
    emisor: {
      name: '',
      taxId: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      logo: '',
    },
    cliente: {
      name: '',
      taxId: '',
      phone: '',
      email: '',
      address: '',
      city: '',
    },
    items: [
      {
        id: `item-${Date.now()}-1`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        subtotal: 0,
      },
    ],
    globalDiscountPercent: 0,
    applyTax: false,
    taxRate: 21,
    presupuestoMeta: {
      validityDays: 15,
      deliveryTime: '',
      commercialTerms: '',
    },
    reciboMeta: {
      paymentConcept: '',
      paymentMethod: 'efectivo',
      amountPaid: 0,
      totalOperationAmount: 0,
      pendingBalance: 0,
      receiverSignatureTitle: 'Firma y Aclaración',
    },
    ordenTrabajoMeta: {
      equipmentOrTarget: '',
      brandModel: '',
      identifierNumber: '',
      reportedIssue: '',
      technicalDiagnosis: '',
      targetDeliveryDate: '',
      warrantyTerms: '3 meses sobre mano de obra',
    },
    facturaProformaMeta: {
      paymentConditions: '',
      validityUntil: '',
    },
    designTemplate: 'modern',
    accentColor: '#7C3AED',
    footerNotes: '',
  }
}

export function useDocumentState() {
  const [doc, setDoc] = useState<CommercialDocument>(() => createEmptyDocument('presupuesto'))
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false)
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false)
  const [isDemoActive, setIsDemoActive] = useState(false)

  // Cargar borrador de localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as CommercialDocument
        if (parsed && parsed.type && Array.isArray(parsed.items)) {
          setDoc(parsed)
          setIsLoadedFromStorage(true)
          setHasUnsavedDraft(true)
        }
      }
    } catch {
      // Ignorar errores de localStorage
    }
  }, [])

  // Auto-guardado en localStorage cada vez que doc cambie (salvo si es demo)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc))
      setHasUnsavedDraft(true)
    } catch {
      // Manejar cuota de storage
    }
  }, [doc])

  // Recalcular saldo pendiente en Recibo automáticamente si cambia amountPaid o total
  const totals = useMemo(() => {
    return calculateDocumentTotals(
      doc.items,
      doc.globalDiscountPercent,
      doc.applyTax,
      doc.taxRate
    )
  }, [doc.items, doc.globalDiscountPercent, doc.applyTax, doc.taxRate])

  // Si es un recibo y el totalOperationAmount es 0 o coincide con el total de los ítems, sugerirlo
  useEffect(() => {
    if (doc.type === 'recibo') {
      const opTotal = doc.reciboMeta.totalOperationAmount || totals.grandTotal
      const paid = doc.reciboMeta.amountPaid || 0
      const pending = roundDecimal(Math.max(0, opTotal - paid))
      if (doc.reciboMeta.pendingBalance !== pending) {
        setDoc((prev) => ({
          ...prev,
          reciboMeta: {
            ...prev.reciboMeta,
            pendingBalance: pending,
          },
        }))
      }
    }
  }, [doc.type, doc.reciboMeta.amountPaid, doc.reciboMeta.totalOperationAmount, totals.grandTotal, doc.reciboMeta.pendingBalance])

  const setDocumentType = useCallback((newType: DocumentType) => {
    setIsDemoActive(false)
    setDoc((prev) => {
      // Mantener datos de emisor y cliente, pero refrescar el número sugerido si era default
      const currentPrefix = prev.number.split('-')[0]
      const isDefaultNumber = ['PRE', 'REC', 'OT', 'PRO', 'DOC'].includes(currentPrefix)
      const newNumber = isDefaultNumber ? generateDefaultDocNumber(newType) : prev.number

      // Color de acento temático por defecto según tipo si no fue personalizado
      let accent = prev.accentColor
      if (accent === '#7C3AED' || accent === '#059669' || accent === '#2563EB' || accent === '#334155') {
        if (newType === 'recibo') accent = '#059669'
        else if (newType === 'orden-trabajo') accent = '#2563EB'
        else if (newType === 'factura-proforma') accent = '#334155'
        else accent = '#7C3AED'
      }

      return {
        ...prev,
        type: newType,
        number: newNumber,
        accentColor: accent,
      }
    })
  }, [])

  const setCurrency = useCallback((currency: CurrencyCode) => {
    setDoc((prev) => ({ ...prev, currency }))
  }, [])

  const updateEmisor = useCallback((field: keyof PartyInfo, value: string) => {
    setIsDemoActive(false)
    setDoc((prev) => ({
      ...prev,
      emisor: { ...prev.emisor, [field]: value },
    }))
  }, [])

  const updateCliente = useCallback((field: keyof PartyInfo, value: string) => {
    setIsDemoActive(false)
    setDoc((prev) => ({
      ...prev,
      cliente: { ...prev.cliente, [field]: value },
    }))
  }, [])

  const updateDocGeneral = useCallback(
    (field: keyof CommercialDocument, value: unknown) => {
      setIsDemoActive(false)
      setDoc((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const updatePresupuestoMeta = useCallback((field: string, value: unknown) => {
    setIsDemoActive(false)
    setDoc((prev) => ({
      ...prev,
      presupuestoMeta: { ...prev.presupuestoMeta, [field]: value },
    }))
  }, [])

  const updateReciboMeta = useCallback((field: string, value: unknown) => {
    setIsDemoActive(false)
    setDoc((prev) => {
      const nextMeta = { ...prev.reciboMeta, [field]: value }
      if (field === 'amountPaid' || field === 'totalOperationAmount') {
        const opTotal = Number(field === 'totalOperationAmount' ? value : nextMeta.totalOperationAmount) || 0
        const paid = Number(field === 'amountPaid' ? value : nextMeta.amountPaid) || 0
        nextMeta.pendingBalance = roundDecimal(Math.max(0, opTotal - paid))
      }
      return { ...prev, reciboMeta: nextMeta }
    })
  }, [])

  const updateOrdenTrabajoMeta = useCallback((field: string, value: unknown) => {
    setIsDemoActive(false)
    setDoc((prev) => ({
      ...prev,
      ordenTrabajoMeta: { ...prev.ordenTrabajoMeta, [field]: value },
    }))
  }, [])

  const updateFacturaProformaMeta = useCallback((field: string, value: unknown) => {
    setIsDemoActive(false)
    setDoc((prev) => ({
      ...prev,
      facturaProformaMeta: { ...prev.facturaProformaMeta, [field]: value },
    }))
  }, [])

  // Líneas de ítems
  const addLineItem = useCallback(() => {
    setIsDemoActive(false)
    const newItem: DocumentLineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      subtotal: 0,
    }
    setDoc((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }))
  }, [])

  const duplicateLineItem = useCallback((id: string) => {
    setIsDemoActive(false)
    setDoc((prev) => {
      const targetIndex = prev.items.findIndex((i) => i.id === id)
      if (targetIndex === -1) return prev
      const original = prev.items[targetIndex]
      const duplicated: DocumentLineItem = {
        ...original,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        description: `${original.description} (Copia)`,
      }
      const newItems = [...prev.items]
      newItems.splice(targetIndex + 1, 0, duplicated)
      return { ...prev, items: newItems }
    })
  }, [])

  const removeLineItem = useCallback((id: string) => {
    setIsDemoActive(false)
    setDoc((prev) => {
      if (prev.items.length <= 1) {
        // Dejar al menos 1 línea vacía
        return {
          ...prev,
          items: [
            {
              id: `item-${Date.now()}`,
              description: '',
              quantity: 1,
              unitPrice: 0,
              discountPercent: 0,
              subtotal: 0,
            },
          ],
        }
      }
      return {
        ...prev,
        items: prev.items.filter((i) => i.id !== id),
      }
    })
  }, [])

  const updateLineItem = useCallback(
    (id: string, field: keyof DocumentLineItem, value: string | number) => {
      setIsDemoActive(false)
      setDoc((prev) => {
        const newItems = prev.items.map((item) => {
          if (item.id !== id) return item
          const updated = { ...item, [field]: value }
          const qty = Number(field === 'quantity' ? value : item.quantity) || 0
          const price = Number(field === 'unitPrice' ? value : item.unitPrice) || 0
          const disc = Number(field === 'discountPercent' ? value : item.discountPercent) || 0
          updated.subtotal = calculateLineSubtotal(qty, price, disc)
          return updated
        })
        return { ...prev, items: newItems }
      })
    },
    []
  )

  // Cargar ejemplo del tipo actual
  const loadSample = useCallback((typeToLoad?: DocumentType) => {
    const type = typeToLoad || doc.type
    const sample = getSampleDocument(type)
    setDoc(sample)
    setIsDemoActive(true)
  }, [doc.type])

  // Descartar y empezar documento nuevo
  const resetDocument = useCallback(() => {
    const empty = createEmptyDocument(doc.type)
    setDoc(empty)
    setIsDemoActive(false)
    try {
      localStorage.removeItem(STORAGE_KEY)
      setHasUnsavedDraft(false)
    } catch {
      // noop
    }
  }, [doc.type])

  return {
    doc,
    setDoc,
    totals,
    isLoadedFromStorage,
    hasUnsavedDraft,
    isDemoActive,
    setDocumentType,
    setCurrency,
    updateEmisor,
    updateCliente,
    updateDocGeneral,
    updatePresupuestoMeta,
    updateReciboMeta,
    updateOrdenTrabajoMeta,
    updateFacturaProformaMeta,
    addLineItem,
    duplicateLineItem,
    removeLineItem,
    updateLineItem,
    loadSample,
    resetDocument,
  }
}
