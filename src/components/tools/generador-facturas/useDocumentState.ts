'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BusinessProfile,
  CommercialClient,
  CommercialDocument,
  CommercialProduct,
  CurrencyCode,
  DocumentLineItem,
  DocumentStatus,
  DocumentType,
  PartyInfo,
} from './types'
import {
  calculateDocumentTotals,
  calculateLineSubtotal,
} from './math'
import { getSampleDocument } from './sampleData'
import {
  clearSessionDraft,
  getSessionDraft,
  getSessionDocumentNumber,
  saveSessionDraft,
} from './storage/localStorageManager'
import {
  deleteCommercialClientServer,
  deleteCommercialDocumentServer,
  deleteCommercialProductServer,
  getBusinessProfileServer,
  getCommercialClientsServer,
  getCommercialDocumentsServer,
  getCommercialProductsServer,
  getCommercialUserStatusServer,
  getNextDocumentNumberServer,
  saveBusinessProfileServer,
  saveCommercialClientServer,
  saveCommercialDocumentServer,
  saveCommercialProductServer,
  importLocalDataToCloudServer,
} from '@/app/actions/commercial-documents'
import { validateCommercialDocument } from './validation'

interface UseDocumentStateOptions {
  initialType?: DocumentType
  lockType?: boolean
}

function createEmptyDocument(type: DocumentType = 'presupuesto', profile?: BusinessProfile): CommercialDocument {
  const today = new Date().toISOString().split('T')[0]
  return {
    id: `doc-tmp-${Date.now()}`,
    type,
    number: '', // Se asigna temporal o correlativamente en runtime
    issueDate: today,
    currency: profile?.defaultCurrency || 'ARS',
    emisor: {
      name: profile?.name || '',
      taxId: profile?.taxId || '',
      phone: profile?.phone || '',
      email: profile?.email || '',
      address: profile?.address || '',
      city: profile?.city || '',
      logo: profile?.logo || '',
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
    designTemplate: profile?.defaultTemplate || 'modern',
    accentColor: profile?.defaultAccentColor || '#7C3AED',
    footerNotes: profile?.defaultNotes || '',
    status: 'borrador',
  }
}

export function useDocumentState(options: UseDocumentStateOptions = {}) {
  const effectiveType = options.initialType || 'presupuesto'
  const isTypeLocked = Boolean(options.lockType)

  const [doc, setDoc] = useState<CommercialDocument>(() => createEmptyDocument(effectiveType))
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [clients, setClients] = useState<CommercialClient[]>([])
  const [products, setProducts] = useState<CommercialProduct[]>([])
  const [historyDocs, setHistoryDocs] = useState<CommercialDocument[]>([])

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false)
  const [isDemoActive, setIsDemoActive] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  // 1. Detectar autenticación y estado PRO en el servidor
  useEffect(() => {
    let isSubscribed = true

    async function initStatus() {
      try {
        const userStatus = await getCommercialUserStatusServer()
        if (!isSubscribed) return

        setIsAuthenticated(userStatus.isAuthenticated)
        setIsPro(userStatus.isPro)
        setUserId(userStatus.userId)

        if (userStatus.isPro) {
          // Si el usuario es PRO: cargar datos persistentes de Supabase
          const [srvProfile, srvClients, srvProducts, srvDocs] = await Promise.all([
            getBusinessProfileServer(),
            getCommercialClientsServer(),
            getCommercialProductsServer(),
            getCommercialDocumentsServer(),
          ])

          if (!isSubscribed) return

          if (srvProfile.data) {
            setProfile(srvProfile.data)
          }
          if (srvClients.data) setClients(srvClients.data)
          if (srvProducts.data) setProducts(srvProducts.data)
          if (srvDocs.data) setHistoryDocs(srvDocs.data)

          // Cargar borrador de sesión o nuevo con numeración Pro
          const sessionDraft = getSessionDraft()
          if (sessionDraft) {
            // Si hay un perfil Pro configurado en el servidor, sincronizar emisor si el borrador estaba vacío
            if (srvProfile.data) {
              const p = srvProfile.data
              if (!sessionDraft.emisor?.name || sessionDraft.emisor.name.trim() === '') {
                sessionDraft.emisor = {
                  name: p.name,
                  taxId: p.taxId || '',
                  phone: p.phone || '',
                  email: p.email || '',
                  address: p.address || '',
                  city: p.city || '',
                  logo: p.logo || '',
                }
              }
              if (p.defaultCurrency && !sessionDraft.currency) {
                sessionDraft.currency = p.defaultCurrency
              }
              if (p.defaultTemplate && !sessionDraft.designTemplate) {
                sessionDraft.designTemplate = p.defaultTemplate
              }
              if (p.defaultAccentColor && !sessionDraft.accentColor) {
                sessionDraft.accentColor = p.defaultAccentColor
              }
            }

            // Si el número era de sesión temporal (ej: PRE-TMP-1), asignar correlativo Pro
            if (!sessionDraft.number || sessionDraft.number.includes('-TMP-')) {
              const nextNumRes = await getNextDocumentNumberServer(sessionDraft.type || effectiveType)
              if (nextNumRes.data) {
                sessionDraft.number = nextNumRes.data
              }
            }

            setDoc(sessionDraft)
            saveSessionDraft(sessionDraft)
            setIsLoadedFromStorage(true)
          } else {
            const nextNumRes = await getNextDocumentNumberServer(effectiveType)
            const newDoc = createEmptyDocument(effectiveType, srvProfile.data || undefined)
            if (nextNumRes.data) {
              newDoc.number = nextNumRes.data
            }
            setDoc(newDoc)
            saveSessionDraft(newDoc)
          }
        } else {
          // Si es usuario GRATIS (anónimo o sin Pro):
          // Usar estrictamente sessionStorage temporal de pestaña
          const sessionDraft = getSessionDraft()
          if (sessionDraft) {
            setDoc(sessionDraft)
            setIsLoadedFromStorage(true)
          } else {
            const newDoc = createEmptyDocument(effectiveType)
            newDoc.number = getSessionDocumentNumber(effectiveType)
            setDoc(newDoc)
          }
        }
      } catch (err) {
        console.error('Error inicializando estado comercial:', err)
        // Fallback seguro a sesión temporal
        const sessionDraft = getSessionDraft()
        if (sessionDraft) {
          setDoc(sessionDraft)
          setIsLoadedFromStorage(true)
        } else {
          const newDoc = createEmptyDocument(effectiveType)
          newDoc.number = getSessionDocumentNumber(effectiveType)
          setDoc(newDoc)
        }
      } finally {
        if (isSubscribed) setIsInitializing(false)
      }
    }

    void initStatus()

    return () => {
      isSubscribed = false
    }
  }, [effectiveType])

  // 2. Persistencia temporal en sessionStorage (para recuperación en recargas de página)
  useEffect(() => {
    if (isInitializing) return
    saveSessionDraft(doc)
  }, [doc, isInitializing])

  // 3. Cálculos matemáticos en tiempo real
  const totals = useMemo(() => {
    return calculateDocumentTotals(
      doc.items,
      doc.globalDiscountPercent,
      doc.applyTax,
      doc.taxRate
    )
  }, [doc.items, doc.globalDiscountPercent, doc.applyTax, doc.taxRate])

  // Sincronizar subtotales en las líneas si cambian precios/cantidades
  const syncLineSubtotals = useCallback((items: DocumentLineItem[]): DocumentLineItem[] => {
    return items.map((item) => ({
      ...item,
      subtotal: calculateLineSubtotal(item.quantity, item.unitPrice, item.discountPercent),
    }))
  }, [])

  // Modificadores del documento
  const setDocumentType = useCallback(
    async (type: DocumentType) => {
      if (isTypeLocked) return
      let newNumber = ''
      if (isPro) {
        const nextNum = await getNextDocumentNumberServer(type)
        newNumber = nextNum.data || ''
      } else {
        newNumber = getSessionDocumentNumber(type)
      }

      setDoc((prev) => ({
        ...prev,
        type,
        number: newNumber || prev.number,
      }))
    },
    [isPro, isTypeLocked]
  )

  const setCurrency = useCallback((currency: CurrencyCode) => {
    setDoc((prev) => ({ ...prev, currency }))
  }, [])

  const updateEmisor = useCallback((field: keyof PartyInfo, value: string) => {
    setDoc((prev) => ({
      ...prev,
      emisor: {
        ...prev.emisor,
        [field]: value,
      },
    }))
  }, [])

  const updateCliente = useCallback((field: keyof PartyInfo, value: string) => {
    setDoc((prev) => ({
      ...prev,
      cliente: {
        ...prev.cliente,
        [field]: value,
      },
    }))
  }, [])

  const updateDocGeneral = useCallback(
    (field: keyof CommercialDocument, value: unknown) => {
      setDoc((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const updatePresupuestoMeta = useCallback((field: string, value: unknown) => {
    setDoc((prev) => ({
      ...prev,
      presupuestoMeta: {
        ...prev.presupuestoMeta,
        [field]: value,
      },
    }))
  }, [])

  const updateReciboMeta = useCallback((field: string, value: unknown) => {
    setDoc((prev) => {
      const nextRecibo = {
        ...prev.reciboMeta,
        [field]: value,
      }
      if (field === 'amountPaid' || field === 'totalOperationAmount') {
        const total = Number(nextRecibo.totalOperationAmount) || 0
        const paid = Number(nextRecibo.amountPaid) || 0
        nextRecibo.pendingBalance = Math.max(0, total - paid)
      }
      return {
        ...prev,
        reciboMeta: nextRecibo,
      }
    })
  }, [])

  const updateOrdenTrabajoMeta = useCallback((field: string, value: unknown) => {
    setDoc((prev) => ({
      ...prev,
      ordenTrabajoMeta: {
        ...prev.ordenTrabajoMeta,
        [field]: value,
      },
    }))
  }, [])

  const updateFacturaProformaMeta = useCallback((field: string, value: unknown) => {
    setDoc((prev) => ({
      ...prev,
      facturaProformaMeta: {
        ...prev.facturaProformaMeta,
        [field]: value,
      },
    }))
  }, [])

  // Gestión de ítems
  const addLineItem = useCallback(() => {
    setDoc((prev) => {
      const newItem: DocumentLineItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        subtotal: 0,
      }
      return {
        ...prev,
        items: [...prev.items, newItem],
      }
    })
  }, [])

  const duplicateLineItem = useCallback(
    (id: string) => {
      setDoc((prev) => {
        const target = prev.items.find((i) => i.id === id)
        if (!target) return prev
        const clone: DocumentLineItem = {
          ...target,
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        }
        const index = prev.items.findIndex((i) => i.id === id)
        const updated = [...prev.items]
        updated.splice(index + 1, 0, clone)
        return {
          ...prev,
          items: syncLineSubtotals(updated),
        }
      })
    },
    [syncLineSubtotals]
  )

  const removeLineItem = useCallback(
    (id: string) => {
      setDoc((prev) => {
        if (prev.items.length <= 1) return prev
        const filtered = prev.items.filter((i) => i.id !== id)
        return {
          ...prev,
          items: syncLineSubtotals(filtered),
        }
      })
    },
    [syncLineSubtotals]
  )

  const updateLineItem = useCallback(
    (id: string, field: keyof DocumentLineItem, value: string | number) => {
      setDoc((prev) => {
        const updated = prev.items.map((item) => {
          if (item.id !== id) return item
          const draft = { ...item, [field]: value }
          draft.subtotal = calculateLineSubtotal(draft.quantity, draft.unitPrice, draft.discountPercent)
          return draft
        })
        return {
          ...prev,
          items: updated,
        }
      })
    },
    []
  )

  // Aplicar cliente desde agenda
  const applyClient = useCallback((client: CommercialClient) => {
    setDoc((prev) => ({
      ...prev,
      cliente: {
        name: client.name,
        taxId: client.taxId || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        city: client.city || '',
      },
    }))
  }, [])

  // Aplicar producto desde catálogo
  const applyProduct = useCallback(
    (product: CommercialProduct) => {
      setDoc((prev) => {
        const lastItem = prev.items[prev.items.length - 1]
        const shouldReplaceLast =
          prev.items.length === 1 && !lastItem.description.trim() && lastItem.unitPrice === 0

        const newItem: DocumentLineItem = {
          id: `item-${Date.now()}`,
          description: product.description ? `${product.name} - ${product.description}` : product.name,
          quantity: 1,
          unitPrice: product.defaultUnitPrice || 0,
          discountPercent: product.defaultDiscountPercent || 0,
          subtotal: calculateLineSubtotal(
            1,
            product.defaultUnitPrice || 0,
            product.defaultDiscountPercent || 0
          ),
        }

        const items = shouldReplaceLast ? [newItem] : [...prev.items, newItem]
        return {
          ...prev,
          items: syncLineSubtotals(items),
        }
      })
    },
    [syncLineSubtotals]
  )

  // ==========================================
  // OPERACIONES PRO EN LA NUBE (RECHAZAN EN GRATIS)
  // ==========================================
  const saveDocument = useCallback(
    async (targetStatus: DocumentStatus = 'borrador') => {
      if (!isPro) {
        return { success: false, error: 'Guardar comprobantes en la nube requiere una suscripción Pro activa.' }
      }

      const docToSave = { ...doc, status: targetStatus }
      const res = await saveCommercialDocumentServer(docToSave)
      if (res.error) {
        return { success: false, error: res.error }
      }

      if (res.data) {
        setDoc(res.data)
        const srvDocs = await getCommercialDocumentsServer()
        if (srvDocs.data) setHistoryDocs(srvDocs.data)
      }
      return { success: true, error: null }
    },
    [doc, isPro]
  )

  const duplicateDocument = useCallback(
    async (sourceDoc: CommercialDocument) => {
      if (!isPro) {
        return { success: false, error: 'Duplicar comprobantes en la nube requiere suscripción Pro activa.' }
      }

      const nextNum = await getNextDocumentNumberServer(sourceDoc.type)
      const duplicated: CommercialDocument = {
        ...sourceDoc,
        id: `doc-dup-${Date.now()}`,
        number: nextNum.data || '',
        issueDate: new Date().toISOString().split('T')[0],
        status: 'borrador',
      }

      const res = await saveCommercialDocumentServer(duplicated)
      if (res.data) {
        setDoc(res.data)
        const srvDocs = await getCommercialDocumentsServer()
        if (srvDocs.data) setHistoryDocs(srvDocs.data)
      }
      return { success: !res.error, error: res.error }
    },
    [isPro]
  )

  const deleteDocument = useCallback(
    async (id: string) => {
      if (!isPro) {
        return { success: false, error: 'Operación permitida solo para cuentas Pro.' }
      }
      const res = await deleteCommercialDocumentServer(id)
      if (res.success) {
        setHistoryDocs((prev) => prev.filter((d) => d.id !== id))
      }
      return res
    },
    [isPro]
  )

  const saveClient = useCallback(
    async (clientData: Partial<CommercialClient>) => {
      if (!isPro) {
        return { success: false, error: 'La agenda de clientes guardados requiere suscripción Pro activa.' }
      }
      const res = await saveCommercialClientServer(clientData)
      if (res.data) {
        const srvClients = await getCommercialClientsServer()
        if (srvClients.data) setClients(srvClients.data)
      }
      return { success: !res.error, error: res.error }
    },
    [isPro]
  )

  const deleteClient = useCallback(
    async (id: string) => {
      if (!isPro) {
        return { success: false, error: 'Operación permitida solo para cuentas Pro.' }
      }
      const res = await deleteCommercialClientServer(id)
      if (res.success) {
        setClients((prev) => prev.filter((c) => c.id !== id))
      }
      return res
    },
    [isPro]
  )

  const saveProduct = useCallback(
    async (productData: Partial<CommercialProduct>) => {
      if (!isPro) {
        return { success: false, error: 'El catálogo de productos guardados requiere suscripción Pro activa.' }
      }
      const res = await saveCommercialProductServer(productData)
      if (res.data) {
        const srvProducts = await getCommercialProductsServer()
        if (srvProducts.data) setProducts(srvProducts.data)
      }
      return { success: !res.error, error: res.error }
    },
    [isPro]
  )

  const deleteProduct = useCallback(
    async (id: string) => {
      if (!isPro) {
        return { success: false, error: 'Operación permitida solo para cuentas Pro.' }
      }
      const res = await deleteCommercialProductServer(id)
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id))
      }
      return res
    },
    [isPro]
  )

  const saveBusinessProfile = useCallback(
    async (profileData: BusinessProfile) => {
      if (!isPro) {
        return { success: false, error: 'Guardar tu perfil comercial de forma permanente requiere suscripción Pro activa.' }
      }
      const res = await saveBusinessProfileServer(profileData)
      if (res.error) {
        return { success: false, error: res.error }
      }

      const updatedProfile = res.data || profileData
      setProfile(updatedProfile)

      // Aplicar los datos del emisor al documento en curso y sincronizar borrador de sesión
      setDoc((prev) => {
        const nextDoc: CommercialDocument = {
          ...prev,
          emisor: {
            ...prev.emisor,
            name: updatedProfile.name,
            taxId: updatedProfile.taxId || '',
            phone: updatedProfile.phone || '',
            email: updatedProfile.email || '',
            address: updatedProfile.address || '',
            city: updatedProfile.city || '',
            logo: updatedProfile.logo || '',
          },
          currency: updatedProfile.defaultCurrency || prev.currency,
          designTemplate: updatedProfile.defaultTemplate || prev.designTemplate,
          accentColor: updatedProfile.defaultAccentColor || prev.accentColor,
          footerNotes: updatedProfile.defaultNotes || prev.footerNotes,
        }
        saveSessionDraft(nextDoc)
        return nextDoc
      })

      return { success: true, error: null }
    },
    [isPro]
  )

  const importLocalDataToCloud = useCallback(
    async (payload: {
      documents: CommercialDocument[]
      clients: Partial<CommercialClient>[]
      products: Partial<CommercialProduct>[]
      profile?: BusinessProfile | null
    }) => {
      if (!isPro) {
        return { success: false, error: 'La importación a la nube requiere una cuenta con suscripción Pro activa.' }
      }
      const res = await importLocalDataToCloudServer(payload)
      if (res.success) {
        const [srvClients, srvProducts, srvDocs] = await Promise.all([
          getCommercialClientsServer(),
          getCommercialProductsServer(),
          getCommercialDocumentsServer(),
        ])
        if (srvClients.data) setClients(srvClients.data)
        if (srvProducts.data) setProducts(srvProducts.data)
        if (srvDocs.data) setHistoryDocs(srvDocs.data)
      }
      return res
    },
    [isPro]
  )

  // Cargar ejemplo demostrativo
  const loadSample = useCallback(
    (typeToLoad?: DocumentType) => {
      const type = isTypeLocked ? effectiveType : (typeToLoad || doc.type)
      const sample = getSampleDocument(type)
      setDoc(sample)
      setIsDemoActive(true)
    },
    [doc.type, effectiveType, isTypeLocked]
  )

  // Reiniciar a documento nuevo
  const resetDocument = useCallback(async () => {
    clearSessionDraft()
    let newNumber = ''
    if (isPro) {
      const nextRes = await getNextDocumentNumberServer(effectiveType)
      newNumber = nextRes.data || ''
    } else {
      newNumber = getSessionDocumentNumber(effectiveType)
    }

    const empty = createEmptyDocument(effectiveType, profile || undefined)
    empty.number = newNumber
    setDoc(empty)
    setIsDemoActive(false)
  }, [effectiveType, isPro, profile])

  return {
    doc,
    setDoc,
    profile,
    clients,
    products,
    historyDocs,
    totals,
    isAuthenticated,
    isPro,
    userId,
    isLoadedFromStorage,
    isDemoActive,
    isInitializing,
    isTypeLocked,
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
    applyClient,
    applyProduct,
    saveDocument,
    duplicateDocument,
    deleteDocument,
    saveClient,
    deleteClient,
    saveProduct,
    deleteProduct,
    saveBusinessProfile,
    importLocalDataToCloud,
    loadSample,
    resetDocument,
  }
}
