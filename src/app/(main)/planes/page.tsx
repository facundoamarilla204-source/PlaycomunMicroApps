import { buildMetadata } from "@/lib/metadata"
import { createClient } from "@/utils/supabase/server"
import { isProUser } from "@/lib/pro"
import PlanesClient from "./PlanesClient"

export const metadata = buildMetadata({
  title: "Planes y precios",
  description: "Conocé nuestros planes y precios. Herramientas gratuitas para siempre y funciones avanzadas para profesionales con PlayComun Pro.",
  path: "/planes",
})

export default async function PlanesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const isAuthenticated = !!user
  const isPro = user ? await isProUser(user.id) : false

  // Fetch prices from plans table
  const { data: plans } = await supabase.from('plans').select('code, price')
  let priceMensual = 5900
  let priceAnual = 59000
  if (plans) {
    const monthlyPlan = plans.find(p => p.code === 'pro_monthly')
    const yearlyPlan = plans.find(p => p.code === 'pro_yearly')
    if (monthlyPlan) priceMensual = monthlyPlan.price
    if (yearlyPlan) priceAnual = yearlyPlan.price
  }

  return (
    <PlanesClient 
      isAuthenticated={isAuthenticated} 
      isPro={isPro} 
      priceMensual={priceMensual}
      priceAnual={priceAnual}
    />
  )
}
