export interface Concepto {
  id: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  descuento: number
}

export interface Presupuesto {
  emisor: {
    nombre: string
    cuit?: string
    telefono?: string
    email?: string
    direccion?: string
    logo?: string
  }
  cliente: {
    nombre: string
    cuit?: string
    email?: string
    telefono?: string
  }
  info: {
    numero: string
    fecha: string
    vencimiento: string
    moneda: string
    condiciones: string
  }
  conceptos: Concepto[]
}

export function calcularSubtotal(conceptos: Concepto[]): number {
  return conceptos.reduce((acc, c) => acc + (c.cantidad * c.precioUnitario), 0)
}

export function calcularTotalDescuentos(conceptos: Concepto[]): number {
  return conceptos.reduce((acc, c) => {
    const sub = c.cantidad * c.precioUnitario
    return acc + (sub * (c.descuento / 100))
  }, 0)
}

export function calcularTotal(conceptos: Concepto[]): number {
  return calcularSubtotal(conceptos) - calcularTotalDescuentos(conceptos)
}

export function formatoMoneda(valor: number, moneda: string = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(valor)
}

export function generarNumeroPresupuesto(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const random = Math.floor(Math.random() * 9000 + 1000)
  return `PRE-${year}${month}-${random}`
}
