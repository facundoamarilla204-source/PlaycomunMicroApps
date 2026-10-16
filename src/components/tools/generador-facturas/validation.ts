import { CommercialDocument } from './types'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  details: ValidationError[]
}

export const FORBIDDEN_PLACEHOLDERS = [
  'nombre del emisor',
  'mi empresa',
  'tu empresa',
  'empresa de ejemplo',
  'nombre del cliente',
  'cliente de ejemplo',
  'cliente demo',
  'concepto sin detalle',
]

export function containsForbiddenPlaceholder(val?: string | null): boolean {
  if (!val) return false
  const lower = val.trim().toLowerCase()
  return FORBIDDEN_PLACEHOLDERS.some((p) => lower === p)
}

export function validateCommercialDocument(doc: CommercialDocument): ValidationResult {
  const details: ValidationError[] = []

  // 1. Emisor
  if (!doc.emisor.name || !doc.emisor.name.trim()) {
    details.push({
      field: 'emisor.name',
      message: 'Completá el Nombre o Razón Social de tu negocio (Emisor).',
    })
  } else if (containsForbiddenPlaceholder(doc.emisor.name)) {
    details.push({
      field: 'emisor.name',
      message: 'El nombre del emisor contiene un placeholder de ejemplo. Ingresá un nombre comercial real.',
    })
  }

  // 2. Cliente
  if (!doc.cliente.name || !doc.cliente.name.trim()) {
    details.push({
      field: 'cliente.name',
      message: 'Completá el Nombre o Razón Social del Cliente / Destinatario.',
    })
  } else if (containsForbiddenPlaceholder(doc.cliente.name)) {
    details.push({
      field: 'cliente.name',
      message: 'El nombre del cliente contiene un placeholder de ejemplo. Ingresá un destinatario real.',
    })
  }

  // 3. Número de comprobante
  if (!doc.number || !doc.number.trim()) {
    details.push({
      field: 'number',
      message: 'El documento debe tener un identificador o número asignado.',
    })
  }

  // 4. Ítems
  if (!doc.items || doc.items.length === 0) {
    details.push({
      field: 'items',
      message: 'El comprobante debe tener al menos una línea de concepto o servicio.',
    })
  } else {
    doc.items.forEach((item, index) => {
      const lineNum = index + 1
      if (!item.description || !item.description.trim()) {
        details.push({
          field: `items[${index}].description`,
          message: `La línea #${lineNum} debe tener una descripción válida.`,
        })
      } else if (containsForbiddenPlaceholder(item.description)) {
        details.push({
          field: `items[${index}].description`,
          message: `La línea #${lineNum} contiene un concepto de ejemplo genérico.`,
        })
      }

      if (item.quantity <= 0 || isNaN(item.quantity)) {
        details.push({
          field: `items[${index}].quantity`,
          message: `La cantidad en la línea #${lineNum} debe ser mayor a 0.`,
        })
      }

      if (item.unitPrice < 0 || isNaN(item.unitPrice)) {
        details.push({
          field: `items[${index}].unitPrice`,
          message: `El precio unitario en la línea #${lineNum} no puede ser negativo.`,
        })
      }

      if (item.discountPercent < 0 || item.discountPercent > 100 || isNaN(item.discountPercent)) {
        details.push({
          field: `items[${index}].discountPercent`,
          message: `El descuento en la línea #${lineNum} debe estar entre 0% y 100%.`,
        })
      }
    })
  }

  // 5. Validaciones contextuales por tipo de documento
  if (doc.type === 'recibo') {
    if (!doc.reciboMeta?.paymentConcept || !doc.reciboMeta.paymentConcept.trim()) {
      details.push({
        field: 'reciboMeta.paymentConcept',
        message: 'Indicá el concepto por el cual se percibe el pago o seña.',
      })
    }
    if (!doc.reciboMeta || doc.reciboMeta.amountPaid <= 0 || isNaN(doc.reciboMeta.amountPaid)) {
      details.push({
        field: 'reciboMeta.amountPaid',
        message: 'El monto pagado en el recibo debe ser un importe mayor a cero.',
      })
    }
  } else if (doc.type === 'orden-trabajo') {
    if (!doc.ordenTrabajoMeta?.equipmentOrTarget || !doc.ordenTrabajoMeta.equipmentOrTarget.trim()) {
      details.push({
        field: 'ordenTrabajoMeta.equipmentOrTarget',
        message: 'Indicá el equipo, vehículo o bien sobre el cual se realiza la orden de trabajo.',
      })
    }
    if (!doc.ordenTrabajoMeta?.reportedIssue || !doc.ordenTrabajoMeta.reportedIssue.trim()) {
      details.push({
        field: 'ordenTrabajoMeta.reportedIssue',
        message: 'Detallá la falla reportada o tarea requerida en la orden de trabajo.',
      })
    }
  } else if (doc.type === 'presupuesto') {
    if (doc.presupuestoMeta?.validityDays !== undefined && (doc.presupuestoMeta.validityDays <= 0 || isNaN(doc.presupuestoMeta.validityDays))) {
      details.push({
        field: 'presupuestoMeta.validityDays',
        message: 'Los días de validez del presupuesto deben ser mayores a 0.',
      })
    }
  }

  return {
    isValid: details.length === 0,
    errors: details.map((d) => d.message),
    details,
  }
}
