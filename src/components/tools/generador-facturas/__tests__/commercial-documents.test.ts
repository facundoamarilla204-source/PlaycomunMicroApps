import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateLineSubtotal,
  calculateDocumentTotals,
  roundDecimal,
  formatCurrencyAmount,
} from '../math'
import {
  validateCommercialDocument,
  containsForbiddenPlaceholder,
} from '../validation'
import {
  getNextLocalDocumentNumber,
  getStoredBusinessProfile,
  saveStoredBusinessProfile,
  getStoredLocalClients,
  saveStoredLocalClient,
  deleteStoredLocalClient,
  getStoredLocalProducts,
  saveStoredLocalProduct,
  deleteStoredLocalProduct,
  getStoredLocalDocuments,
  saveStoredLocalDocument,
  deleteStoredLocalDocument,
  migrateLegacyDraftIfNeeded,
  getStoredActiveDraft,
  getSessionDraft,
  saveSessionDraft,
  clearSessionDraft,
  getSessionDocumentNumber,
} from '../storage/localStorageManager'
import { generateDocumentPdf } from '../pdfGenerator'
import { CommercialDocument, DocumentLineItem } from '../types'

// Mock de Storage para entorno Node
const createStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
}

if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.clear) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createStorageMock(),
    writable: true,
    configurable: true,
  })
}

if (typeof globalThis.sessionStorage === 'undefined' || !globalThis.sessionStorage.clear) {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createStorageMock(),
    writable: true,
    configurable: true,
  })
}

describe('1. Motor Matemático y Cálculos de Documentos', () => {
  it('Redondea a 2 decimales con precisión', () => {
    expect(roundDecimal(10.555, 2)).toBe(10.56)
    expect(roundDecimal(10.554, 2)).toBe(10.55)
    expect(roundDecimal(0, 2)).toBe(0)
  })

  it('Calcula subtotales por línea con cantidad, precio y descuento porcentual', () => {
    // 2 unidades a $1000 con 10% de descuento = 2000 - 200 = 1800
    expect(calculateLineSubtotal(2, 1000, 10)).toBe(1800)

    // 1 unidad a $500 sin descuento = 500
    expect(calculateLineSubtotal(1, 500, 0)).toBe(500)

    // Manejo de valores límite (descuento 100% = 0)
    expect(calculateLineSubtotal(5, 200, 100)).toBe(0)
  })

  it('Calcula totales generales sin impuestos y con descuento global', () => {
    const items: DocumentLineItem[] = [
      { id: '1', description: 'Servicio A', quantity: 1, unitPrice: 1000, discountPercent: 0, subtotal: 1000 },
      { id: '2', description: 'Servicio B', quantity: 2, unitPrice: 500, discountPercent: 0, subtotal: 1000 },
    ]

    const totals = calculateDocumentTotals(items, 10, false, 21)
    expect(totals.rawSubtotal).toBe(2000)
    expect(totals.globalDiscountAmount).toBe(200)
    expect(totals.taxableBase).toBe(1800)
    expect(totals.taxAmount).toBe(0)
    expect(totals.grandTotal).toBe(1800)
  })

  it('Calcula totales con IVA discriminado (21% y 10.5%)', () => {
    const items: DocumentLineItem[] = [
      { id: '1', description: 'Honorarios', quantity: 1, unitPrice: 10000, discountPercent: 0, subtotal: 10000 },
    ]

    // IVA 21%
    const totals21 = calculateDocumentTotals(items, 0, true, 21)
    expect(totals21.taxableBase).toBe(10000)
    expect(totals21.taxAmount).toBe(2100)
    expect(totals21.grandTotal).toBe(12100)

    // IVA 10.5%
    const totals105 = calculateDocumentTotals(items, 0, true, 10.5)
    expect(totals105.taxableBase).toBe(10000)
    expect(totals105.taxAmount).toBe(1050)
    expect(totals105.grandTotal).toBe(11050)
  })

  it('Formatea importes en las monedas soportadas', () => {
    const ars = formatCurrencyAmount(1500.5, 'ARS')
    expect(ars).toContain('1.500,50')
    expect(ars).toContain('$')

    const usd = formatCurrencyAmount(250, 'USD')
    expect(usd).toContain('USD $')
  })
})

const defaultMeta = {
  presupuestoMeta: { validityDays: 15, deliveryTime: '2 semanas', commercialTerms: '50% anticipo y 50% contra entrega' },
  reciboMeta: { paymentConcept: '', paymentMethod: 'efectivo' as const, amountPaid: 0, totalOperationAmount: 0, pendingBalance: 0 },
  ordenTrabajoMeta: { equipmentOrTarget: '', brandModel: '', identifierNumber: '', reportedIssue: '', technicalDiagnosis: '', targetDeliveryDate: '', warrantyTerms: '' },
  facturaProformaMeta: { paymentConditions: '', validityUntil: '', originCountry: '' },
}

describe('2. Módulo de Validaciones Comerciales y Anti-Placeholders', () => {
  const baseDoc: CommercialDocument = {
    ...defaultMeta,
    id: 'test-doc-1',
    type: 'presupuesto',
    number: 'PRE-0001',
    issueDate: '2026-10-15',
    currency: 'ARS',
    emisor: {
      name: 'Estudio de Diseño y Desarrollo',
      taxId: '20-12345678-9',
      phone: '1122334455',
      email: 'contacto@estudio.com',
      address: 'Av. Corrientes 1234',
      city: 'CABA',
    },
    cliente: {
      name: 'Cliente Real SRL',
      taxId: '30-98765432-1',
      phone: '1199887766',
      email: 'pagos@clientereal.com',
      address: 'Calle Falsa 123',
      city: 'Rosario',
    },
    items: [
      {
        id: 'item-1',
        description: 'Desarrollo de aplicación web a medida',
        quantity: 1,
        unitPrice: 50000,
        discountPercent: 0,
        subtotal: 50000,
      },
    ],
    globalDiscountPercent: 0,
    applyTax: false,
    taxRate: 21,
    presupuestoMeta: {
      validityDays: 15,
      deliveryTime: '2 semanas',
      commercialTerms: '50% anticipo y 50% contra entrega',
    },
    designTemplate: 'modern',
    accentColor: '#7C3AED',
    footerNotes: 'Gracias por su confianza.',
    status: 'borrador',
  }

  it('Valida un documento completo y sin placeholders como válido', () => {
    const result = validateCommercialDocument(baseDoc)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('Detecta y rechaza nombres de emisor vacíos o placeholders de ejemplo', () => {
    const invalidDoc = {
      ...baseDoc,
      emisor: { ...baseDoc.emisor, name: 'Nombre del Emisor' },
    }
    const result = validateCommercialDocument(invalidDoc)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('placeholder de ejemplo')

    const emptyDoc = {
      ...baseDoc,
      emisor: { ...baseDoc.emisor, name: '' },
    }
    expect(validateCommercialDocument(emptyDoc).isValid).toBe(false)
  })

  it('Detecta y rechaza nombres de cliente vacíos o placeholders', () => {
    const invalidClientDoc = {
      ...baseDoc,
      cliente: { ...baseDoc.cliente, name: 'Nombre del Cliente' },
    }
    const result = validateCommercialDocument(invalidClientDoc)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('placeholder de ejemplo')
  })

  it('Detecta errores en líneas de ítems: descripción vacía, cantidad inválida o descuento > 100%', () => {
    const badItemDoc = {
      ...baseDoc,
      items: [
        {
          id: 'bad-1',
          description: '',
          quantity: 0,
          unitPrice: -10,
          discountPercent: 120,
          subtotal: 0,
        },
      ],
    }
    const result = validateCommercialDocument(badItemDoc)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(1)
  })

  it('Valida condiciones contextuales de un Recibo de Pago', () => {
    const reciboDoc: CommercialDocument = {
      ...baseDoc,
      type: 'recibo',
      number: 'REC-0001',
      reciboMeta: {
        paymentConcept: '',
        paymentMethod: 'transferencia',
        amountPaid: 0,
        totalOperationAmount: 10000,
        pendingBalance: 10000,
        receiverSignatureTitle: 'Firma',
      },
    }

    const result = validateCommercialDocument(reciboDoc)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.includes('concepto'))).toBe(true)
    expect(result.errors.some((e) => e.includes('monto pagado'))).toBe(true)
  })

  it('Valida condiciones contextuales de una Orden de Trabajo', () => {
    const otDoc: CommercialDocument = {
      ...baseDoc,
      type: 'orden-trabajo',
      number: 'OT-0001',
      ordenTrabajoMeta: {
        equipmentOrTarget: '',
        brandModel: '',
        identifierNumber: '',
        reportedIssue: '',
        technicalDiagnosis: '',
        targetDeliveryDate: '',
        warrantyTerms: '3 meses',
      },
    }

    const result = validateCommercialDocument(otDoc)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.includes('equipo, vehículo'))).toBe(true)
    expect(result.errors.some((e) => e.includes('falla reportada'))).toBe(true)
  })
})

describe('3. Persistencia Local Versionada y Numeración Correlativa', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('Genera secuencias correlativas independientes por tipo de documento', () => {
    const pre1 = getNextLocalDocumentNumber('presupuesto')
    const pre2 = getNextLocalDocumentNumber('presupuesto')
    const rec1 = getNextLocalDocumentNumber('recibo')
    const ot1 = getNextLocalDocumentNumber('orden-trabajo')
    const pro1 = getNextLocalDocumentNumber('factura-proforma')

    expect(pre1).toBe('PRE-0001')
    expect(pre2).toBe('PRE-0002')
    expect(rec1).toBe('REC-0001')
    expect(ot1).toBe('OT-0001')
    expect(pro1).toBe('PRO-0001')
  })

  it('Persiste y recupera el perfil del negocio de forma aislada a los borradores', () => {
    const profile = {
      name: 'Mi Empresa Digital',
      taxId: '30-11223344-5',
      phone: '1155443322',
      email: 'info@empresa.com',
      address: 'Calle San Martín 500',
      city: 'Córdoba',
      logo: 'data:image/png;base64,samplelogodata',
      defaultCurrency: 'USD' as const,
      defaultTemplate: 'classic' as const,
      defaultAccentColor: '#2563EB',
      defaultNotes: 'Plazo de pago 30 días.',
    }

    saveStoredBusinessProfile(profile)
    const retrieved = getStoredBusinessProfile()

    expect(retrieved.name).toBe('Mi Empresa Digital')
    expect(retrieved.defaultCurrency).toBe('USD')
    expect(retrieved.defaultAccentColor).toBe('#2563EB')
    expect(retrieved.logo).toBe('data:image/png;base64,samplelogodata')
  })

  it('Guarda, lista y elimina clientes en el almacenamiento local', () => {
    const client = saveStoredLocalClient({
      name: 'Pedro Gómez',
      taxId: '20-33445566-7',
      phone: '1144332211',
      email: 'pedro@gomez.com',
      address: 'Belgrano 100',
      city: 'Mendoza',
      notes: 'Cliente habitual',
    })

    expect(client.id).toBeDefined()
    const allClients = getStoredLocalClients()
    expect(allClients).toHaveLength(1)
    expect(allClients[0].name).toBe('Pedro Gómez')

    deleteStoredLocalClient(client.id)
    expect(getStoredLocalClients()).toHaveLength(0)
  })

  it('Guarda, lista y elimina productos y servicios en el almacenamiento local', () => {
    const product = saveStoredLocalProduct({
      name: 'Mantenimiento Mensual Servidor',
      description: 'Copias de seguridad y parches',
      defaultUnitPrice: 15000,
      defaultDiscountPercent: 5,
      category: 'Sistemas',
      isActive: true,
    })

    expect(product.id).toBeDefined()
    const allProducts = getStoredLocalProducts()
    expect(allProducts).toHaveLength(1)
    expect(allProducts[0].name).toBe('Mantenimiento Mensual Servidor')

    deleteStoredLocalProduct(product.id)
    expect(getStoredLocalProducts()).toHaveLength(0)
  })

  it('Gestiona el historial local de documentos sin sobrescribir comprobantes anteriores', () => {
    const doc1: CommercialDocument = {
      ...defaultMeta,
      id: 'doc-hist-1',
      type: 'presupuesto',
      number: 'PRE-0001',
      issueDate: '2026-10-15',
      currency: 'ARS',
      emisor: { name: 'Emisor 1' },
      cliente: { name: 'Cliente A' },
      items: [{ id: '1', description: 'Item 1', quantity: 1, unitPrice: 100, discountPercent: 0, subtotal: 100 }],
      globalDiscountPercent: 0,
      applyTax: false,
      taxRate: 21,
      designTemplate: 'modern',
      accentColor: '#7C3AED',
      footerNotes: '',
      status: 'enviado',
    }

    const doc2: CommercialDocument = {
      ...defaultMeta,
      id: 'doc-hist-2',
      type: 'recibo',
      number: 'REC-0001',
      issueDate: '2026-10-15',
      currency: 'ARS',
      emisor: { name: 'Emisor 1' },
      cliente: { name: 'Cliente B' },
      items: [{ id: '1', description: 'Item Recibo', quantity: 1, unitPrice: 500, discountPercent: 0, subtotal: 500 }],
      globalDiscountPercent: 0,
      applyTax: false,
      taxRate: 21,
      designTemplate: 'modern',
      accentColor: '#7C3AED',
      footerNotes: '',
      status: 'cobrado',
    }

    saveStoredLocalDocument(doc1)
    saveStoredLocalDocument(doc2)

    const history = getStoredLocalDocuments()
    expect(history).toHaveLength(2)

    deleteStoredLocalDocument('doc-hist-1')
    const updatedHistory = getStoredLocalDocuments()
    expect(updatedHistory).toHaveLength(1)
    expect(updatedHistory[0].id).toBe('doc-hist-2')
  })

  it('Migra borradores legacy sin romper ni perder datos', () => {
    const legacyDraft = {
      type: 'presupuesto',
      number: 'PRE-9999',
      emisor: { name: 'Negocio Migrado' },
      cliente: { name: 'Cliente Migrado' },
      items: [{ id: '1', description: 'Item Migrado', quantity: 2, unitPrice: 200, discountPercent: 0, subtotal: 400 }],
    }

    localStorage.setItem('playcomun_comercial_doc_draft_v1', JSON.stringify(legacyDraft))

    const migrated = migrateLegacyDraftIfNeeded()
    expect(migrated).not.toBeNull()
    expect(migrated?.emisor.name).toBe('Negocio Migrado')

    const activeV2 = getStoredActiveDraft()
    expect(activeV2?.emisor.name).toBe('Negocio Migrado')

    const profile = getStoredBusinessProfile()
    expect(profile.name).toBe('Negocio Migrado')
  })
})

describe('4. Modalidad Gratis vs Pro (Almacenamiento Temporal y Marca de Agua)', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('Almacena el borrador temporal de la modalidad Gratis estrictamente en sessionStorage', () => {
    const freeDraft: CommercialDocument = {
      ...defaultMeta,
      id: 'doc-free-1',
      type: 'presupuesto',
      number: 'PRE-TMP-1',
      issueDate: '2026-10-15',
      currency: 'ARS',
      emisor: { name: 'Negocio Temporal' },
      cliente: { name: 'Cliente Temporal' },
      items: [{ id: '1', description: 'Servicio puntual', quantity: 1, unitPrice: 2000, discountPercent: 0, subtotal: 2000 }],
      globalDiscountPercent: 0,
      applyTax: false,
      taxRate: 21,
      designTemplate: 'modern',
      accentColor: '#7C3AED',
      footerNotes: '',
      status: 'borrador',
    }

    saveSessionDraft(freeDraft)

    // Recupera de sessionStorage
    const retrieved = getSessionDraft()
    expect(retrieved).not.toBeNull()
    expect(retrieved?.emisor.name).toBe('Negocio Temporal')

    // NO debe haberse guardado en localStorage
    expect(localStorage.getItem('playcomun_session_draft_v2')).toBeNull()

    // Al limpiar la sesión, se vacía
    clearSessionDraft()
    expect(getSessionDraft()).toBeNull()
  })

  it('Genera identificador temporal de sesión para documentos gratuitos', () => {
    const tmp1 = getSessionDocumentNumber('presupuesto')
    const tmp2 = getSessionDocumentNumber('presupuesto')
    const recTmp = getSessionDocumentNumber('recibo')

    expect(tmp1).toBe('PRE-TMP-1')
    expect(tmp2).toBe('PRE-TMP-2')
    expect(recTmp).toBe('REC-TMP-1')
  })

  it('Genera PDF con marca de PlayComún para Gratis y marca blanca para Pro', async () => {
    const validDoc: CommercialDocument = {
      ...defaultMeta,
      id: 'doc-test-pdf',
      type: 'presupuesto',
      number: 'PRE-0001',
      issueDate: '2026-10-15',
      currency: 'ARS',
      emisor: { name: 'Mi Empresa Real' },
      cliente: { name: 'Cliente Real' },
      items: [{ id: '1', description: 'Consultoría especializada', quantity: 1, unitPrice: 1000, discountPercent: 0, subtotal: 1000 }],
      globalDiscountPercent: 0,
      applyTax: false,
      taxRate: 21,
      designTemplate: 'modern',
      accentColor: '#7C3AED',
      footerNotes: 'Condiciones generales de prueba.',
      status: 'borrador',
    }

    // Modalidad Gratis
    const freeBlob = await generateDocumentPdf(validDoc, 'blob', { isPro: false })
    expect(freeBlob).toBeDefined()

    // Modalidad Pro
    const proBlob = await generateDocumentPdf(validDoc, 'blob', { isPro: true })
    expect(proBlob).toBeDefined()
  })
})
