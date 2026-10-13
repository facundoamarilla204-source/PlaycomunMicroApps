export type DocumentType = 
  | 'presupuesto' 
  | 'recibo' 
  | 'orden-trabajo' 
  | 'factura-proforma'

export type CurrencyCode = 'ARS' | 'USD' | 'EUR' | 'CLP' | 'UYU'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  name: string
  locale: string
}

export interface PartyInfo {
  name: string
  taxId?: string // CUIT, CUIL, DNI, RFC, RUT
  phone?: string
  email?: string
  address?: string
  city?: string
  logo?: string // Data URL base64
}

export interface DocumentLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discountPercent: number // 0 to 100
  subtotal: number
}

// Datos específicos para Presupuesto
export interface PresupuestoMeta {
  validityDays: number // ej: 15 días
  deliveryTime?: string // ej: 5 a 7 días hábiles
  commercialTerms?: string // ej: 50% anticipo, 50% contra entrega
}

// Datos específicos para Recibo de Pago
export interface ReciboMeta {
  paymentConcept: string // ej: Anticipo 50% para desarrollo web
  paymentMethod: 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'mercadopago' | 'otro'
  amountPaid: number // Importe que se cobra ahora
  totalOperationAmount: number // Total acordado de la operación
  pendingBalance: number // Calculado automáticamente: total - amountPaid
  receiverSignatureTitle?: string // ej: Firma y Aclaración
}

// Datos específicos para Orden de Trabajo
export interface OrdenTrabajoMeta {
  equipmentOrTarget: string // ej: Notebook Dell Inspiron / Gol Trend 2018 / Aire Acondicionado
  brandModel?: string // ej: Dell Inspiron 15 3000
  identifierNumber?: string // N° de serie, patente, IMEI, etc.
  reportedIssue: string // Lo que manifiesta el cliente
  technicalDiagnosis?: string // Diagnóstico técnico previo / trabajos a realizar
  targetDeliveryDate?: string // Fecha prometida de retiro/entrega
  warrantyTerms?: string // ej: 3 meses de garantía en mano de obra
}

// Datos específicos para Factura Proforma
export interface FacturaProformaMeta {
  paymentConditions?: string // ej: Transferencia bancaria previa a despacho
  validityUntil?: string // Fecha límite de la proforma
  originCountry?: string // Opcional para operaciones de export/import
}

export type DesignTemplate = 'modern' | 'classic' | 'minimal'

export interface CommercialDocument {
  id: string
  type: DocumentType
  number: string // ej: PRE-0001, REC-0001, OT-0001, PRO-0001
  issueDate: string // YYYY-MM-DD
  currency: CurrencyCode
  
  emisor: PartyInfo
  cliente: PartyInfo
  
  items: DocumentLineItem[]
  
  // Impuestos y descuentos generales
  globalDiscountPercent: number // 0 to 100
  applyTax: boolean
  taxRate: number // 0, 10.5, 21, 27
  
  // Metadatos específicos de cada tipo
  presupuestoMeta: PresupuestoMeta
  reciboMeta: ReciboMeta
  ordenTrabajoMeta: OrdenTrabajoMeta
  facturaProformaMeta: FacturaProformaMeta
  
  // Personalización visual
  designTemplate: DesignTemplate
  accentColor: string
  footerNotes: string
}
