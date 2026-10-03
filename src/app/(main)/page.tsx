import Hero from "@/components/home/Hero"
import ToolGrid from "@/components/home/ToolGrid"
import TrustStrip from "@/components/home/TrustStrip"
import ServicesBanner from "@/components/home/ServicesBanner"
import { createClient } from "@/utils/supabase/server"

export default async function Home() {
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
    <>
      <Hero />
      <ToolGrid userFavorites={userFavorites} />
      <TrustStrip />
      <ServicesBanner />
    </>
  )
}
