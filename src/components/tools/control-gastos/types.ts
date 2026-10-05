import { Tables, TablesInsert, TablesUpdate } from "@/types/database"

export type Expense = Tables<"expenses">
export type ExpenseInsert = TablesInsert<"expenses">
export type ExpenseUpdate = TablesUpdate<"expenses">

export const EXPENSE_CATEGORIES = [
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

export const PAYMENT_METHODS = [
  "Efectivo",
  "Débito",
  "Crédito",
  "Transferencia",
  "Mercado Pago",
  "Otro"
] as const
