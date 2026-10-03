import { createClient } from "@/utils/supabase/server"
import { logout } from "@/app/(auth)/actions"
import CuentaClient from "./cuenta-client"
import { redirect } from "next/navigation"
import { updateProfile } from "@/app/(auth)/actions"

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/ingresar")
  }

  const userInitial = user.email?.charAt(0).toUpperCase() || "U"

  const fullName = user.user_metadata?.full_name || ""

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
    />
  )
}
