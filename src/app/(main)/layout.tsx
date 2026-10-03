import SiteHeader from "@/components/layout/SiteHeader"
import SiteFooter from "@/components/layout/SiteFooter"
import { createClient } from "@/utils/supabase/server"
import { isProUser } from "@/lib/pro"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isPro = user ? await isProUser(user.id) : false

  return (
    <>
      <SiteHeader user={user} isPro={isPro} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  )
}
