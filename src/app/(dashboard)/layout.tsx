import SiteHeader from "@/components/layout/SiteHeader"
import SiteFooter from "@/components/layout/SiteFooter"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/ingresar")
  }

  return (
    <>
      <SiteHeader user={user} />
      <main className="flex-1 bg-gray-50/50 pt-28 pb-16">{children}</main>
      <SiteFooter />
    </>
  )
}
