"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { TablesInsert, TablesUpdate } from "@/types/database"
import { isProUser } from "@/lib/pro"
import { Expense, ExpenseUserStatus } from "@/components/tools/control-gastos/types"
import {
  PRO_REQUIRED_EXPENSE_ERROR,
  generateExpensesExcelWorkbook,
  filterAndSortMovements,
  MovementFilterOptions,
} from "@/lib/control-gastos"

/**
 * Consulta el estado de autenticación, suscripción Pro y recuento de movimientos
 * preservados del usuario en el servidor.
 */
export async function getExpenseUserStatusServer(): Promise<ExpenseUserStatus> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        isAuthenticated: false,
        isPro: false,
        userId: null,
        preservedCount: 0,
      }
    }

    const isPro = await isProUser(user.id)
    let preservedCount = 0

    // Si no es Pro, consultamos la función segura SECURITY DEFINER que devuelve el recuento
    // de movimientos del usuario sin exponer detalles, garantizando que el usuario sepa
    // que sus datos siguen intactos y seguros.
    const { data: countData, error: countError } = await supabase.rpc("get_user_expense_count")
    if (!countError && typeof countData === "number") {
      preservedCount = countData
    }

    return {
      isAuthenticated: true,
      isPro,
      userId: user.id,
      preservedCount,
    }
  } catch (error) {
    console.error("Error al verificar estado de usuario en control de gastos:", error)
    return {
      isAuthenticated: false,
      isPro: false,
      userId: null,
      preservedCount: 0,
    }
  }
}

/**
 * Obtiene los movimientos guardados del usuario en la nube.
 * Requiere suscripción Pro activa. Si el usuario perdió Pro, informa la cantidad preservada
 * sin exponer los registros por RLS y Server Action.
 */
export async function getUserExpensesServer(): Promise<{
  data: Expense[] | null
  error: string | null
  isProRequired?: boolean
  preservedCount?: number
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      data: null,
      error: "Debes iniciar sesión para consultar tus movimientos en la nube.",
    }
  }

  const isPro = await isProUser(user.id)
  if (!isPro) {
    const { data: count } = await supabase.rpc("get_user_expense_count")
    return {
      data: null,
      error: PRO_REQUIRED_EXPENSE_ERROR,
      isProRequired: true,
      preservedCount: Number(count) || 0,
    }
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error al obtener movimientos:", error)
    return { data: null, error: error.message }
  }

  return { data: data || [], error: null }
}

/**
 * Crea un movimiento (ingreso o gasto) en la nube para usuarios Pro.
 */
export async function createExpenseServer(
  expense: Omit<TablesInsert<"expenses">, "user_id">
): Promise<{
  data: Expense | null
  error: string | null
  isProRequired?: boolean
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Debes iniciar sesión para guardar en la nube." }
  }

  const isPro = await isProUser(user.id)
  if (!isPro) {
    return { data: null, error: PRO_REQUIRED_EXPENSE_ERROR, isProRequired: true }
  }

  // Validación de entrada
  const amount = Number(expense.amount)
  if (isNaN(amount) || amount <= 0) {
    return { data: null, error: "El importe debe ser un número mayor a 0." }
  }

  const description = (expense.description || "").trim()
  if (!description) {
    return { data: null, error: "La descripción es obligatoria." }
  }

  const type = expense.type === "income" ? "income" : "expense"

  const payload: TablesInsert<"expenses"> = {
    ...expense,
    user_id: user.id,
    type,
    amount,
    description,
    category: (expense.category || "Otros").trim(),
    expense_date: expense.expense_date || new Date().toISOString().split("T")[0],
    notes: expense.notes ? expense.notes.trim() : null,
    payment_method: expense.payment_method || null,
  }

  const { data, error } = await supabase.from("expenses").insert(payload).select().single()

  if (error) {
    console.error("Error al insertar movimiento en Supabase:", error)
    return { data: null, error: error.message }
  }

  revalidatePath("/herramientas/control-gastos")
  return { data, error: null }
}

/**
 * Actualiza un movimiento en la nube para usuarios Pro.
 */
export async function updateExpenseServer(
  id: string,
  updates: TablesUpdate<"expenses">
): Promise<{
  data: Expense | null
  error: string | null
  isProRequired?: boolean
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Debes iniciar sesión para actualizar movimientos." }
  }

  const isPro = await isProUser(user.id)
  if (!isPro) {
    return { data: null, error: PRO_REQUIRED_EXPENSE_ERROR, isProRequired: true }
  }

  const payload: TablesUpdate<"expenses"> = { ...updates }
  if (payload.amount !== undefined) {
    const amount = Number(payload.amount)
    if (isNaN(amount) || amount <= 0) {
      return { data: null, error: "El importe debe ser mayor a 0." }
    }
    payload.amount = amount
  }
  if (payload.description !== undefined) {
    const desc = payload.description.trim()
    if (!desc) return { data: null, error: "La descripción no puede estar vacía." }
    payload.description = desc
  }

  const { data, error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error al actualizar movimiento:", error)
    return { data: null, error: error.message }
  }

  revalidatePath("/herramientas/control-gastos")
  return { data, error: null }
}

/**
 * Elimina un movimiento en la nube para usuarios Pro.
 */
export async function deleteExpenseServer(id: string): Promise<{
  success: boolean
  error?: string
  isProRequired?: boolean
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Debes iniciar sesión para eliminar movimientos." }
  }

  const isPro = await isProUser(user.id)
  if (!isPro) {
    return { success: false, error: PRO_REQUIRED_EXPENSE_ERROR, isProRequired: true }
  }

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error al eliminar movimiento:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/herramientas/control-gastos")
  return { success: true }
}

/**
 * Sincronización por lotes: importa movimientos locales hacia la cuenta Pro del usuario.
 * Utiliza idempotencia con el ID generado en cliente para no duplicar si se reintenta.
 */
export async function syncExpensesBatchServer(
  localMovements: Array<Omit<TablesInsert<"expenses">, "user_id">>
): Promise<{
  success: boolean
  importedCount: number
  error?: string
  isProRequired?: boolean
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, importedCount: 0, error: "Debes iniciar sesión para sincronizar." }
  }

  const isPro = await isProUser(user.id)
  if (!isPro) {
    return { success: false, importedCount: 0, error: PRO_REQUIRED_EXPENSE_ERROR, isProRequired: true }
  }

  if (!Array.isArray(localMovements) || localMovements.length === 0) {
    return { success: true, importedCount: 0 }
  }

  const payloads: TablesInsert<"expenses">[] = localMovements.map((m) => ({
    id: m.id || undefined,
    user_id: user.id,
    type: m.type === "income" ? "income" : "expense",
    amount: Number(m.amount) || 0,
    description: (m.description || "").trim(),
    category: (m.category || "Otros").trim(),
    expense_date: m.expense_date || new Date().toISOString().split("T")[0],
    payment_method: m.payment_method || null,
    notes: m.notes ? m.notes.trim() : null,
  }))

  // Usamos upsert basado en la clave primaria id para garantizar idempotencia
  const { error } = await supabase.from("expenses").upsert(payloads, { onConflict: "id" })

  if (error) {
    console.error("Error en sincronización por lotes:", error)
    return { success: false, importedCount: 0, error: error.message }
  }

  revalidatePath("/herramientas/control-gastos")
  return { success: true, importedCount: payloads.length }
}

/**
 * Genera y descarga el archivo Excel para usuarios Pro.
 * Valida la suscripción en el servidor antes de entregar el archivo.
 */
export async function exportExpensesExcelServer(
  filterOptions: MovementFilterOptions
): Promise<{
  base64?: string
  fileName?: string
  error?: string
  isProRequired?: boolean
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Debes iniciar sesión para exportar a Excel." }
  }

  const isPro = await isProUser(user.id)
  if (!isPro) {
    return { error: PRO_REQUIRED_EXPENSE_ERROR, isProRequired: true }
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("expense_date", { ascending: false })

  if (error || !data) {
    return { error: "Error al recuperar movimientos para exportación." }
  }

  const filtered = filterAndSortMovements(data, filterOptions)
  const periodLabel = filterOptions.period || "todos"
  const buffer = generateExpensesExcelWorkbook(filtered, periodLabel)
  const base64 = Buffer.from(buffer).toString("base64")
  const todayStr = new Date().toISOString().split("T")[0]
  const fileName = `control-gastos-${periodLabel}-${todayStr}.xlsx`

  return { base64, fileName }
}

// Compatibilidad con Server Actions anteriores
export const createExpense = createExpenseServer
export const updateExpense = updateExpenseServer
export const deleteExpense = deleteExpenseServer
export const getExpenses = async (userId: string) => {
  const supabase = await createClient()
  return supabase.from("expenses").select("*").eq("user_id", userId)
}
