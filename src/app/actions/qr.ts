"use server"

import { createClient } from "@/utils/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

export type QrCodeStatus = "unconfigured" | "active" | "paused" | "archived"

export interface QrGroup {
  id: string
  user_id: string
  group_code: string
  name: string | null
  created_at: string
}

export interface QrCode {
  id: string
  user_id: string
  group_id: string | null
  code: string
  public_token: string
  status: QrCodeStatus
  destination_url: string | null
  destination_type: string
  created_at: string
  updated_at: string
  activated_at: string | null
}

export async function getUserQrGroups() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No autenticado")
  }

  const { data, error } = await supabase
    .from("qr_groups")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as QrGroup[]
}

export async function getGroupQrs(groupId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No autenticado")
  }

  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data as QrCode[]
}

export async function getUserQrCodes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No autenticado")
  }

  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as QrCode[]
}

function generateGroupCode(): string {
  // Genera un código numérico de 7 dígitos
  return Math.floor(1000000 + Math.random() * 9000000).toString()
}

export async function generateQrCodes(count: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No autenticado")
  }

  // 1. Generate unique group code
  let groupCode = generateGroupCode()
  let groupUnique = false
  while (!groupUnique) {
    const { data: existingGroup } = await supabase
      .from("qr_groups")
      .select("id")
      .eq("user_id", user.id)
      .eq("group_code", groupCode)
      .single()
    
    if (!existingGroup) {
      groupUnique = true
    } else {
      groupCode = generateGroupCode()
    }
  }

  // 2. Create the group
  const { data: group, error: groupError } = await supabase
    .from("qr_groups")
    .insert({
      user_id: user.id,
      group_code: groupCode
    })
    .select()
    .single()

  if (groupError) {
    throw new Error(groupError.message)
  }

  // 3. Get current max QR code index for the user to continue numbering correctly
  // Assuming code format is QR-XXXX. We find the max and parse it.
  const { data: allUserQrs } = await supabase
    .from("qr_codes")
    .select("code")
    .eq("user_id", user.id)
  
  let startingIndex = 1
  if (allUserQrs && allUserQrs.length > 0) {
    const indices = allUserQrs
      .map(qr => parseInt(qr.code.replace("QR-", ""), 10))
      .filter(n => !isNaN(n))
    if (indices.length > 0) {
      startingIndex = Math.max(...indices) + 1
    }
  }

  const newQrs = []

  for (let i = 0; i < count; i++) {
    const code = `QR-${String(startingIndex + i).padStart(4, "0")}`
    const token = crypto.randomBytes(8).toString("hex") // 16 characters
    
    newQrs.push({
      user_id: user.id,
      group_id: group.id,
      code,
      public_token: token,
      status: "unconfigured",
      destination_type: "url"
    })
  }

  const { data, error } = await supabase
    .from("qr_codes")
    .insert(newQrs)
    .select()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/herramientas/generador-qr")
  return { group, qrs: data as QrCode[] }
}

export async function updateQrDestination(id: string, destinationUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No autenticado")
  }

  // Ensure it's a valid url
  try {
    new URL(destinationUrl)
  } catch (e) {
    throw new Error("URL inválida")
  }
  
  if (destinationUrl.startsWith("javascript:") || destinationUrl.startsWith("data:") || destinationUrl.startsWith("vbscript:")) {
    throw new Error("Esquema de URL no permitido")
  }

  const { data, error } = await supabase
    .from("qr_codes")
    .update({
      destination_url: destinationUrl,
      status: "active",
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/herramientas/generador-qr")
  return data as QrCode
}

export async function updateQrStatus(id: string, status: QrCodeStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No autenticado")
  }

  const { data, error } = await supabase
    .from("qr_codes")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/herramientas/generador-qr")
  return data as QrCode
}

export async function getQrByTokenPublic(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Missing service role key or url");
    return null;
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey)
  
  const { data, error } = await supabase
    .from("qr_codes")
    .select("id, public_token, status, destination_url")
    .eq("public_token", token)
    .single()

  if (error) {
    return null
  }

  return data as Pick<QrCode, "id" | "public_token" | "status" | "destination_url">
}
