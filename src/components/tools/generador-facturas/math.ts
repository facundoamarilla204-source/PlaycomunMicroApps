import { CurrencyCode, CurrencyConfig, DocumentLineItem, DocumentType } from './types'

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  ARS: { code: 'ARS', symbol: '$', name: 'Peso Argentino (ARS)', locale: 'es-AR' },
  USD: { code: 'USD', symbol: 'USD $', name: 'Dólar Estadounidense (USD)', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (EUR)', locale: 'de-DE' },
  CLP: { code: 'CLP', symbol: 'CLP $', name: 'Peso Chileno (CLP)', locale: 'es-CL' },
  UYU: { code: 'UYU', symbol: '$U', name: 'Peso Uruguayo (UYU)', locale: 'es-UY' },
}

/**
 * Redondeo decimal seguro a N decimales para evitar artefactos flotantes
 */
export function roundDecimal(num: number, decimals: number = 2): number {
  if (isNaN(num) || !isFinite(num)) return 0
  const factor = Math.pow(10, decimals)
  return Math.round((num + Number.EPSILON) * factor) / factor
}

/**
 * Calcula el subtotal de una línea considerando cantidad, precio unitario y descuento (%)
 */
export function calculateLineSubtotal(
  quantity: number,
  unitPrice: number,
  discountPercent: number = 0
): number {
  const safeQty = Math.max(0, Number(quantity) || 0)
  const safePrice = Math.max(0, Number(unitPrice) || 0)
  const safeDiscount = Math.min(100, Math.max(0, Number(discountPercent) || 0))

  const rawTotal = safeQty * safePrice
  const discountAmount = rawTotal * (safeDiscount / 100)
  return roundDecimal(rawTotal - discountAmount)
}

export interface DocumentTotals {
  rawSubtotal: number
  linesDiscountTotal: number
  subtotalAfterLineDiscounts: number
  globalDiscountAmount: number
  taxableBase: number
  taxAmount: number
  grandTotal: number
}

/**
 * Calcula los totales agregados de un documento
 */
export function calculateDocumentTotals(
  items: DocumentLineItem[],
  globalDiscountPercent: number = 0,
  applyTax: boolean = false,
  taxRate: number = 0
): DocumentTotals {
  let rawSubtotal = 0
  let subtotalAfterLineDiscounts = 0

  items.forEach((item) => {
    const qty = Math.max(0, Number(item.quantity) || 0)
    const price = Math.max(0, Number(item.unitPrice) || 0)
    const lineRaw = qty * price
    const lineDiscount = lineRaw * (Math.min(100, Math.max(0, Number(item.discountPercent) || 0)) / 100)
    
    rawSubtotal += lineRaw
    subtotalAfterLineDiscounts += (lineRaw - lineDiscount)
  })

  rawSubtotal = roundDecimal(rawSubtotal)
  subtotalAfterLineDiscounts = roundDecimal(subtotalAfterLineDiscounts)
  const linesDiscountTotal = roundDecimal(rawSubtotal - subtotalAfterLineDiscounts)

  const safeGlobalDisc = Math.min(100, Math.max(0, Number(globalDiscountPercent) || 0))
  const globalDiscountAmount = roundDecimal(subtotalAfterLineDiscounts * (safeGlobalDisc / 100))
  const taxableBase = roundDecimal(subtotalAfterLineDiscounts - globalDiscountAmount)

  let taxAmount = 0
  if (applyTax && taxRate > 0) {
    taxAmount = roundDecimal(taxableBase * (Number(taxRate) / 100))
  }

  const grandTotal = roundDecimal(taxableBase + taxAmount)

  return {
    rawSubtotal,
    linesDiscountTotal,
    subtotalAfterLineDiscounts,
    globalDiscountAmount,
    taxableBase,
    taxAmount,
    grandTotal,
  }
}

/**
 * Formatea importes monetarios con separador de miles y decimales según la moneda
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: CurrencyCode = 'ARS',
  includeSymbol: boolean = true
): string {
  const conf = CURRENCIES[currencyCode] || CURRENCIES.ARS
  const safeAmount = roundDecimal(Number(amount) || 0)

  // Para CLP usualmente no se usan centavos en comercio general
  const minDecimals = currencyCode === 'CLP' ? 0 : 2
  const maxDecimals = currencyCode === 'CLP' ? 0 : 2

  const formattedNum = new Intl.NumberFormat(conf.locale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(safeAmount)

  return includeSymbol ? `${conf.symbol} ${formattedNum}` : formattedNum
}

/**
 * Genera un número interno sugerido para el tipo de documento
 */
export function generateDefaultDocNumber(type: DocumentType): string {
  const prefixMap: Record<DocumentType, string> = {
    presupuesto: 'PRE',
    recibo: 'REC',
    'orden-trabajo': 'OT',
    'factura-proforma': 'PRO',
  }
  const prefix = prefixMap[type] || 'DOC'
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-000${randomSuffix}`
}
