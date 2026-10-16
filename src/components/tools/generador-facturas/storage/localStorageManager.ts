import {
  BusinessProfile,
  CommercialClient,
  CommercialDocument,
  CommercialProduct,
  DocumentType,
} from '../types'

export const STORAGE_KEYS = {
  PROFILE_V2: 'playcomun_business_profile_v2',
  DRAFT_V2: 'playcomun_active_draft_v2',
  DOCUMENTS_V2: 'playcomun_local_documents_v2',
  CLIENTS_V2: 'playcomun_local_clients_v2',
  PRODUCTS_V2: 'playcomun_local_products_v2',
  SEQUENCES_V2: 'playcomun_local_sequences_v2',
  LOGO_V2: 'playcomun_business_logo_v2',
  LEGACY_V1: 'playcomun_comercial_doc_draft_v1',
  LEGACY_BACKUP: 'playcomun_v1_migration_backup',
} as const

export const SESSION_KEYS = {
  DRAFT_V2: 'playcomun_session_draft_v2',
  SEQUENCES_V2: 'playcomun_session_seq_v2',
} as const

const DEFAULT_PREFIXES: Record<DocumentType, string> = {
  presupuesto: 'PRE',
  recibo: 'REC',
  'orden-trabajo': 'OT',
  'factura-proforma': 'PRO',
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage
  }
  return null
}

function getSessionStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage
  }
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage
  }
  return null
}

function safeGetItem<T>(key: string, fallback: T, useSession: boolean = false): T {
  const storage = useSession ? getSessionStorage() : getStorage()
  if (!storage) return fallback
  try {
    const raw = storage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn(`[PlayComun Storage] Error leyendo clave ${key}:`, err)
    return fallback
  }
}

function safeSetItem(key: string, value: unknown, useSession: boolean = false): boolean {
  const storage = useSession ? getSessionStorage() : getStorage()
  if (!storage) return false
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch (err) {
    console.error(`[PlayComun Storage] Error guardando clave ${key}:`, err)
    return false
  }
}

// ==========================================
// ALMACENAMIENTO TEMPORAL DE SESIÓN (MODALIDAD GRATIS)
// ==========================================
export function getSessionDraft(): CommercialDocument | null {
  return safeGetItem<CommercialDocument | null>(SESSION_KEYS.DRAFT_V2, null, true)
}

export function saveSessionDraft(doc: CommercialDocument): boolean {
  return safeSetItem(SESSION_KEYS.DRAFT_V2, doc, true)
}

export function clearSessionDraft(): void {
  const storage = getSessionStorage()
  if (!storage) return
  try {
    storage.removeItem(SESSION_KEYS.DRAFT_V2)
  } catch {
    // noop
  }
}

/**
 * Genera un identificador de sesión para usuarios Gratis (ej: PRE-TMP-1).
 * Deja en claro que es temporal para esa pestaña y no correlativo persistente.
 */
export function getSessionDocumentNumber(type: DocumentType, increment: boolean = true): string {
  const prefix = DEFAULT_PREFIXES[type] || 'DOC'
  const sequences = safeGetItem<Record<string, number>>(SESSION_KEYS.SEQUENCES_V2, {}, true)
  const currentNum = sequences[type] || 0
  const nextNum = currentNum + 1

  if (increment) {
    sequences[type] = nextNum
    safeSetItem(SESSION_KEYS.SEQUENCES_V2, sequences, true)
  }

  return `${prefix}-TMP-${nextNum}`
}

/**
 * Migración retrocompatible desde v1 a v2 (solo si existía borrador legacy anterior)
 */
export function migrateLegacyStorageIfNeeded(): CommercialDocument | null {
  const storage = getStorage()
  if (!storage) return null
  try {
    const legacyRaw = storage.getItem(STORAGE_KEYS.LEGACY_V1)
    if (!legacyRaw) return null

    if (!storage.getItem(STORAGE_KEYS.LEGACY_BACKUP)) {
      storage.setItem(STORAGE_KEYS.LEGACY_BACKUP, legacyRaw)
    }

    const legacyDoc = JSON.parse(legacyRaw) as Partial<CommercialDocument>
    if (!legacyDoc) return null

    // Si no existe perfil de negocio v2 y el documento viejo tenía emisor, migrarlo
    if (!storage.getItem(STORAGE_KEYS.PROFILE_V2) && legacyDoc.emisor?.name) {
      const migratedProfile: BusinessProfile = {
        name: legacyDoc.emisor.name || '',
        taxId: legacyDoc.emisor.taxId || '',
        phone: legacyDoc.emisor.phone || '',
        email: legacyDoc.emisor.email || '',
        address: legacyDoc.emisor.address || '',
        city: legacyDoc.emisor.city || '',
        logo: legacyDoc.emisor.logo || '',
        defaultCurrency: legacyDoc.currency || 'ARS',
        defaultTemplate: legacyDoc.designTemplate || 'modern',
        defaultAccentColor: legacyDoc.accentColor || '#7C3AED',
        defaultNotes: legacyDoc.footerNotes || '',
        updatedAt: new Date().toISOString(),
      }
      safeSetItem(STORAGE_KEYS.PROFILE_V2, migratedProfile)
    }

    // Si no hay borrador activo v2, cargar el borrador legacy adaptado
    if (!storage.getItem(STORAGE_KEYS.DRAFT_V2)) {
      safeSetItem(STORAGE_KEYS.DRAFT_V2, legacyDoc)
    }

    return legacyDoc as CommercialDocument
  } catch (err) {
    console.error('[PlayComun Storage] Error en migración v1->v2:', err)
    return null
  }
}

export const migrateLegacyDraftIfNeeded = migrateLegacyStorageIfNeeded

// ==========================================
// PERFIL DEL NEGOCIO (EMISOR) - CACHÉ PRO
// ==========================================
export function getStoredBusinessProfile(): BusinessProfile {
  const fallback: BusinessProfile = {
    name: '',
    taxId: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    logo: '',
    defaultCurrency: 'ARS',
    defaultTemplate: 'modern',
    defaultAccentColor: '#7C3AED',
    defaultNotes: '',
  }
  const profile = safeGetItem<BusinessProfile>(STORAGE_KEYS.PROFILE_V2, fallback)
  
  const storage = getStorage()
  if (storage && !profile.logo) {
    const separateLogo = storage.getItem(STORAGE_KEYS.LOGO_V2)
    if (separateLogo) profile.logo = separateLogo
  }
  return profile
}

export function saveStoredBusinessProfile(profile: BusinessProfile): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    if (profile.logo) {
      try {
        storage.setItem(STORAGE_KEYS.LOGO_V2, profile.logo)
      } catch (err) {
        console.warn('No se pudo guardar el logo en clave separada por cuota:', err)
      }
    } else {
      storage.removeItem(STORAGE_KEYS.LOGO_V2)
    }
    return safeSetItem(STORAGE_KEYS.PROFILE_V2, { ...profile, updatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('Error guardando perfil del negocio:', err)
    return false
  }
}

// ==========================================
// BORRADOR ACTIVO
// ==========================================
export function getStoredActiveDraft(): CommercialDocument | null {
  return safeGetItem<CommercialDocument | null>(STORAGE_KEYS.DRAFT_V2, null)
}

export function saveStoredActiveDraft(doc: CommercialDocument): boolean {
  return safeSetItem(STORAGE_KEYS.DRAFT_V2, doc)
}

export function clearStoredActiveDraft(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEYS.DRAFT_V2)
    storage.removeItem(STORAGE_KEYS.LEGACY_V1)
  } catch {
    // noop
  }
}

// ==========================================
// HISTORIAL DE DOCUMENTOS LOCALES (CACHÉ PRO)
// ==========================================
export function getStoredLocalDocuments(): CommercialDocument[] {
  return safeGetItem<CommercialDocument[]>(STORAGE_KEYS.DOCUMENTS_V2, [])
}

export function saveStoredLocalDocument(doc: CommercialDocument): boolean {
  const docs = getStoredLocalDocuments()
  const now = new Date().toISOString()
  const existingIdx = docs.findIndex((d) => d.id === doc.id)

  const docToSave: CommercialDocument = {
    ...doc,
    status: doc.status || 'borrador',
    updatedAt: now,
    createdAt: existingIdx >= 0 ? docs[existingIdx].createdAt || now : now,
  }

  if (existingIdx >= 0) {
    docs[existingIdx] = docToSave
  } else {
    docs.unshift(docToSave)
  }

  return safeSetItem(STORAGE_KEYS.DOCUMENTS_V2, docs)
}

export function deleteStoredLocalDocument(id: string): boolean {
  const docs = getStoredLocalDocuments()
  const filtered = docs.filter((d) => d.id !== id)
  return safeSetItem(STORAGE_KEYS.DOCUMENTS_V2, filtered)
}

// ==========================================
// AGENDA DE CLIENTES LOCALES (CACHÉ PRO)
// ==========================================
export function getStoredLocalClients(): CommercialClient[] {
  return safeGetItem<CommercialClient[]>(STORAGE_KEYS.CLIENTS_V2, [])
}

export function saveStoredLocalClient(client: Omit<CommercialClient, 'id'> & { id?: string }): CommercialClient {
  const clients = getStoredLocalClients()
  const now = new Date().toISOString()
  const id = client.id || `client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  const clientToSave: CommercialClient = {
    ...client,
    id,
    updatedAt: now,
    createdAt: client.id ? (clients.find((c) => c.id === client.id)?.createdAt || now) : now,
  }

  const existingIdx = clients.findIndex((c) => c.id === id)
  if (existingIdx >= 0) {
    clients[existingIdx] = clientToSave
  } else {
    clients.unshift(clientToSave)
  }

  safeSetItem(STORAGE_KEYS.CLIENTS_V2, clients)
  return clientToSave
}

export function deleteStoredLocalClient(id: string): boolean {
  const clients = getStoredLocalClients()
  const filtered = clients.filter((c) => c.id !== id)
  return safeSetItem(STORAGE_KEYS.CLIENTS_V2, filtered)
}

// ==========================================
// CATÁLOGO DE PRODUCTOS / SERVICIOS LOCALES (CACHÉ PRO)
// ==========================================
export function getStoredLocalProducts(): CommercialProduct[] {
  return safeGetItem<CommercialProduct[]>(STORAGE_KEYS.PRODUCTS_V2, [])
}

export function saveStoredLocalProduct(product: Omit<CommercialProduct, 'id'> & { id?: string }): CommercialProduct {
  const products = getStoredLocalProducts()
  const now = new Date().toISOString()
  const id = product.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  const prodToSave: CommercialProduct = {
    ...product,
    id,
    isActive: product.isActive !== false,
    updatedAt: now,
    createdAt: product.id ? (products.find((p) => p.id === product.id)?.createdAt || now) : now,
  }

  const existingIdx = products.findIndex((p) => p.id === id)
  if (existingIdx >= 0) {
    products[existingIdx] = prodToSave
  } else {
    products.unshift(prodToSave)
  }

  safeSetItem(STORAGE_KEYS.PRODUCTS_V2, products)
  return prodToSave
}

export function deleteStoredLocalProduct(id: string): boolean {
  const products = getStoredLocalProducts()
  const filtered = products.filter((p) => p.id !== id)
  return safeSetItem(STORAGE_KEYS.PRODUCTS_V2, filtered)
}

// ==========================================
// NUMERACIÓN CORRELATIVA LOCAL
// ==========================================
export function getNextLocalDocumentNumber(
  type: DocumentType,
  customPrefix?: string,
  increment: boolean = true
): string {
  const prefix = (customPrefix && customPrefix.trim()) ? customPrefix.trim().toUpperCase() : DEFAULT_PREFIXES[type] || 'DOC'
  const sequences = safeGetItem<Record<string, number>>(STORAGE_KEYS.SEQUENCES_V2, {})
  
  let currentNum = sequences[type] || 0
  if (currentNum === 0) {
    const existingDocs = getStoredLocalDocuments().filter((d) => d.type === type)
    currentNum = existingDocs.length
  }

  const nextNum = currentNum + 1
  if (increment) {
    sequences[type] = nextNum
    safeSetItem(STORAGE_KEYS.SEQUENCES_V2, sequences)
  }

  return `${prefix}-${nextNum.toString().padStart(4, '0')}`
}
