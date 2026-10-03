import { createClient } from "@/utils/supabase/server"
import { Suspense } from "react"
import HerramientasContent from "./herramientas-content"

export default async function HerramientasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let userFavorites: string[] = []
  if (user) {
    const { data } = await supabase.from('favorites').select('tool_slug').eq('user_id', user.id)
    if (data) {
      userFavorites = data.map((f: any) => f.tool_slug)
    }
  }

  return (
    <Suspense fallback={<div className="py-16 text-center text-foreground-muted">Cargando herramientas...</div>}>
      <HerramientasContent userFavorites={userFavorites} />
    </Suspense>
  )
}
