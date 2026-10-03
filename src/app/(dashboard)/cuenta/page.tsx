import { createClient } from "@/utils/supabase/server"
import { logout } from "@/app/(auth)/actions"
import CuentaClient from "./cuenta-client"
import { redirect } from "next/navigation"
import { updateProfile } from "@/app/(auth)/actions"
import { isProUser } from "@/lib/pro"

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/ingresar")
  }

  const userInitial = user.email?.charAt(0).toUpperCase() || "U"
  
  // Get full_name from profiles table instead of user_metadata
  let fullName = user.user_metadata?.full_name || ""
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  if (profile?.full_name) {
    fullName = profile.full_name
  }

  const isPro = await isProUser(user.id)

  let userFavorites: any[] = []
  const { data: dbFavorites } = await supabase.from('favorites').select('tool_slug').eq('user_id', user.id)
  
  if (dbFavorites && dbFavorites.length > 0) {
    const { tools } = await import("@/data/tools")
    const slugs = dbFavorites.map((f: any) => f.tool_slug)
    userFavorites = tools.filter((t) => slugs.includes(t.slug))
  }

  return (
    <CuentaClient 
      email={user.email || ""} 
      name={fullName}
      initial={userInitial} 
      logoutAction={logout} 
      updateAction={updateProfile}
      favorites={userFavorites}
      isPro={isPro}
    />
  )
}
