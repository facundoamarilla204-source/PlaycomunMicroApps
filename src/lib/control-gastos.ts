import { Expense, MovementType, PeriodFilter, SortFilter } from "@/components/tools/control-gastos/types"
import * as XLSX from "xlsx"

export const PRO_REQUIRED_EXPENSE_ERROR = "Esta función de persistencia y sincronización en la nube requiere una suscripción Pro activa."

/**
 * Convierte un objeto Date en string 'YYYY-MM-DD' en hora local
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Obtiene el rango de fechas [startDate, endDate] para un período determinado.
 * Diseñado específicamente con las reglas de calendario de Argentina:
 * - La semana comienza el lunes y finaliza el domingo.
 * - El mes anterior calcula exactamente desde el día 1 del mes previo hasta el último día
 *   del mes previo, sin desbordamiento por meses de 28, 30 o 31 días.
 */
export function getPeriodDateRange(
  period: PeriodFilter,
  referenceDate: Date = new Date()
): { startDate: string | null; endDate: string | null } {
  const refYear = referenceDate.getFullYear()
  const refMonth = referenceDate.getMonth()
  const refDay = referenceDate.getDate()

  const today = new Date(refYear, refMonth, refDay)
  const todayStr = formatLocalDate(today)

  switch (period) {
    case "hoy":
      return { startDate: todayStr, endDate: todayStr }

    case "esta-semana": {
      // getDay() -> 0: Domingo, 1: Lunes, ..., 6: Sábado
      const dayOfWeek = today.getDay()
      // Si es domingo (0), restamos 6 días para llegar al lunes previo.
      // Si es otro día (1 a 6), restamos (dayOfWeek - 1).
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(refYear, refMonth, refDay + diffToMonday)
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
      return {
        startDate: formatLocalDate(monday),
        endDate: formatLocalDate(sunday),
      }
    }

    case "este-mes": {
      const firstDay = new Date(refYear, refMonth, 1)
      const lastDay = new Date(refYear, refMonth + 1, 0)
      return {
        startDate: formatLocalDate(firstDay),
        endDate: formatLocalDate(lastDay),
      }
    }

    case "mes-anterior": {
      // Establecer día 1 antes de restar mes previene desbordes en fechas como el 31 de marzo
      const firstDayLastMonth = new Date(refYear, refMonth - 1, 1)
      const lastDayLastMonth = new Date(refYear, refMonth, 0)
      return {
        startDate: formatLocalDate(firstDayLastMonth),
        endDate: formatLocalDate(lastDayLastMonth),
      }
    }

    case "todos":
    default:
      return { startDate: null, endDate: null }
  }
}

export interface MovementSummary {
  totalIncome: number
  totalExpense: number
  netBalance: number
  incomeCount: number
  expenseCount: number
  totalCount: number
  maxExpense: number
  maxIncome: number
  topExpenseCategory: string
  topExpenseCategoryAmount: number
  categoryTotals: Record<string, { income: number; expense: number; count: number }>
}

/**
 * Calcula todas las métricas e indicadores a partir del conjunto de movimientos.
 */
export function calculateMovementsSummary(movements: Expense[]): MovementSummary {
  let totalIncome = 0
  let totalExpense = 0
  let incomeCount = 0
  let expenseCount = 0
  let maxExpense = 0
  let maxIncome = 0

  const categoryTotals: Record<string, { income: number; expense: number; count: number }> = {}

  for (const m of movements) {
    const isIncome = m.type === "income"
    const amount = Number(m.amount) || 0

    if (!categoryTotals[m.category]) {
      categoryTotals[m.category] = { income: 0, expense: 0, count: 0 }
    }
    categoryTotals[m.category].count += 1

    if (isIncome) {
      totalIncome += amount
      incomeCount += 1
      if (amount > maxIncome) maxIncome = amount
      categoryTotals[m.category].income += amount
    } else {
      totalExpense += amount
      expenseCount += 1
      if (amount > maxExpense) maxExpense = amount
      categoryTotals[m.category].expense += amount
    }
  }

  // Top categoría de gasto
  let topExpenseCategory = "Ninguna"
  let topExpenseCategoryAmount = 0
  for (const [cat, data] of Object.entries(categoryTotals)) {
    if (data.expense > topExpenseCategoryAmount) {
      topExpenseCategory = cat
      topExpenseCategoryAmount = data.expense
    }
  }

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    incomeCount,
    expenseCount,
    totalCount: movements.length,
    maxExpense,
    maxIncome,
    topExpenseCategory,
    topExpenseCategoryAmount,
    categoryTotals,
  }
}

export interface MovementFilterOptions {
  searchQuery?: string
  period?: PeriodFilter
  typeFilter?: "all" | MovementType
  categoryFilter?: string
  paymentFilter?: string
  sortBy?: SortFilter
  referenceDate?: Date
}

/**
 * Filtra y ordena los movimientos aplicando los criterios especificados.
 */
export function filterAndSortMovements(
  movements: Expense[],
  options: MovementFilterOptions
): Expense[] {
  const {
    searchQuery = "",
    period = "este-mes",
    typeFilter = "all",
    categoryFilter = "Todas",
    paymentFilter = "Todos",
    sortBy = "mas-recientes",
    referenceDate = new Date(),
  } = options

  const { startDate, endDate } = getPeriodDateRange(period, referenceDate)
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filtered = movements.filter((m) => {
    // 1. Tipo
    if (typeFilter !== "all" && m.type !== typeFilter) {
      return false
    }

    // 2. Búsqueda por texto (descripción y notas)
    if (normalizedQuery) {
      const matchDesc = m.description.toLowerCase().includes(normalizedQuery)
      const matchNotes = m.notes ? m.notes.toLowerCase().includes(normalizedQuery) : false
      const matchCat = m.category.toLowerCase().includes(normalizedQuery)
      if (!matchDesc && !matchNotes && !matchCat) return false
    }

    // 3. Categoría
    if (categoryFilter !== "Todas" && m.category !== categoryFilter) {
      return false
    }

    // 4. Medio de pago
    if (paymentFilter !== "Todos" && m.payment_method !== paymentFilter) {
      return false
    }

    // 5. Período de fechas (comparación directa ISO string YYYY-MM-DD sin desfase horario)
    const dateStr = m.expense_date
    if (startDate && dateStr < startDate) {
      return false
    }
    if (endDate && dateStr > endDate) {
      return false
    }

    return true
  })

  // Ordenamiento
  filtered.sort((a, b) => {
    if (sortBy === "mas-recientes") {
      if (a.expense_date !== b.expense_date) {
        return b.expense_date.localeCompare(a.expense_date)
      }
      return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
    }
    if (sortBy === "mas-antiguos") {
      if (a.expense_date !== b.expense_date) {
        return a.expense_date.localeCompare(b.expense_date)
      }
      return new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime()
    }
    if (sortBy === "mayor-monto") {
      return (b.amount || 0) - (a.amount || 0)
    }
    if (sortBy === "menor-monto") {
      return (a.amount || 0) - (b.amount || 0)
    }
    return 0
  })

  return filtered
}

/**
 * Sanitiza valores de texto para evitar inyecciones de fórmulas maliciosas en hojas de cálculo.
 */
export function sanitizeForExcel(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value).trim()
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`
  }
  return str
}

/**
 * Genera un archivo Excel (.xlsx) con tres hojas: Resumen, Ingresos y Gastos.
 */
export function generateExpensesExcelWorkbook(
  movements: Expense[],
  periodLabel: string = "Todos"
): Uint8Array {
  const wb = XLSX.utils.book_new()
  const summary = calculateMovementsSummary(movements)

  // 1. Hoja Resumen
  const resumenData: (string | number)[][] = [
    ["PlayComun Online - Control de Gastos"],
    ["Reporte Financiero"],
    [""],
    ["Período:", sanitizeForExcel(periodLabel)],
    ["Fecha de exportación:", formatLocalDate(new Date())],
    [""],
    ["Indicador", "Monto"],
    ["Total Ingresos", summary.totalIncome],
    ["Total Gastos", summary.totalExpense],
    ["Saldo Neto", summary.netBalance],
    ["Cantidad de Ingresos", summary.incomeCount],
    ["Cantidad de Gastos", summary.expenseCount],
    ["Mayor Gasto Registrado", summary.maxExpense],
    ["Mayor Ingreso Registrado", summary.maxIncome],
    ["Categoría con Mayor Gasto", sanitizeForExcel(summary.topExpenseCategory)],
    [""],
    ["Resumen por Categoría", "Ingresos ($)", "Gastos ($)", "Movimientos"],
  ]

  for (const [cat, data] of Object.entries(summary.categoryTotals)) {
    resumenData.push([
      sanitizeForExcel(cat),
      data.income,
      data.expense,
      data.count,
    ])
  }

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen")

  // 2. Hoja Ingresos
  const ingresosData: (string | number)[][] = [
    ["Fecha", "Descripción", "Categoría", "Medio de Pago", "Importe ($)", "Notas"],
  ]
  const incomes = movements.filter((m) => m.type === "income")
  for (const inc of incomes) {
    ingresosData.push([
      inc.expense_date,
      sanitizeForExcel(inc.description),
      sanitizeForExcel(inc.category),
      sanitizeForExcel(inc.payment_method || "-"),
      Number(inc.amount),
      sanitizeForExcel(inc.notes || ""),
    ])
  }
  const wsIngresos = XLSX.utils.aoa_to_sheet(ingresosData)
  XLSX.utils.book_append_sheet(wb, wsIngresos, "Ingresos")

  // 3. Hoja Gastos
  const gastosData: (string | number)[][] = [
    ["Fecha", "Descripción", "Categoría", "Medio de Pago", "Importe ($)", "Notas"],
  ]
  const expenses = movements.filter((m) => m.type !== "income")
  for (const exp of expenses) {
    gastosData.push([
      exp.expense_date,
      sanitizeForExcel(exp.description),
      sanitizeForExcel(exp.category),
      sanitizeForExcel(exp.payment_method || "-"),
      Number(exp.amount),
      sanitizeForExcel(exp.notes || ""),
    ])
  }
  const wsGastos = XLSX.utils.aoa_to_sheet(gastosData)
  XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos")

  // Generar buffer en formato Uint8Array
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  return new Uint8Array(buffer)
}
