import { Tables, TablesInsert, TablesUpdate } from "@/types/database"

export type MovementType = "income" | "expense"

export type Expense = Tables<"expenses">
export type ExpenseInsert = TablesInsert<"expenses">
export type ExpenseUpdate = TablesUpdate<"expenses">

export type ExpenseCategory = Tables<"expense_categories">
export type ExpenseCategoryInsert = TablesInsert<"expense_categories">

export interface CustomCategory {
  id: string
  name: string
  type: MovementType
  color?: string | null
  icon?: string | null
}

export interface ExpenseUserStatus {
  isAuthenticated: boolean
  isPro: boolean
  userId: string | null
  preservedCount: number
}

export type PeriodFilter = "hoy" | "esta-semana" | "este-mes" | "mes-anterior" | "todos"

export type SortFilter = "mas-recientes" | "mas-antiguos" | "mayor-monto" | "menor-monto"

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Alimentación",
  "Transporte",
  "Vivienda",
  "Servicios",
  "Salud",
  "Educación",
  "Compras",
  "Entretenimiento",
  "Trabajo",
  "Impuestos",
  "Otros"
] as const

// Backward compatibility alias
export const EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES

export const DEFAULT_INCOME_CATEGORIES = [
  "Sueldo / Salario",
  "Ventas",
  "Honorarios",
  "Inversiones",
  "Alquileres",
  "Regalo / Premio",
  "Otros Ingresos"
] as const

export const PAYMENT_METHODS = [
  "Efectivo",
  "Débito",
  "Crédito",
  "Transferencia",
  "Mercado Pago",
  "Otro"
] as const

export interface LocalExpensesStorage {
  version: 1
  movements: Expense[]
  categories: CustomCategory[]
  lastUpdated: string
}
