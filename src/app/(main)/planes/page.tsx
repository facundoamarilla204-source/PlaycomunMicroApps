import { buildMetadata } from "@/lib/metadata"
import { createClient } from "@/utils/supabase/server"
import { isProUser } from "@/lib/pro"
import PlanesClient from "./PlanesClient"

export const metadata = buildMetadata({
  title: "Planes y Precios | PlayComun Pro",
  description: "Conocé nuestros planes y precios. Herramientas gratuitas para siempre y funciones avanzadas para profesionales con PlayComun Pro.",
  path: "/planes",
})

export default async function PlanesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const isAuthenticated = !!user
  const isPro = user ? await isProUser(user.id) : false

  return (
    <PlanesClient 
      isAuthenticated={isAuthenticated} 
      isPro={isPro} 
    />
  )
}
