"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { TablesInsert, TablesUpdate, Tables } from "@/types/database"

export async function createExpense(expense: TablesInsert<"expenses">) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("expenses")
    .insert(expense)
    .select()
    .single()

  if (error) {
    console.error("Error creating expense:", error)
    return { error: error.message }
  }

  revalidatePath("/herramientas/control-gastos")
  return { data }
}

export async function updateExpense(id: string, expense: TablesUpdate<"expenses">) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("expenses")
    .update(expense)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating expense:", error)
    return { error: error.message }
  }

  revalidatePath("/herramientas/control-gastos")
  return { data }
}

export async function deleteExpense(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting expense:", error)
    return { error: error.message }
  }

  revalidatePath("/herramientas/control-gastos")
  return { success: true }
}

export async function getExpenses(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching expenses:", error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}
