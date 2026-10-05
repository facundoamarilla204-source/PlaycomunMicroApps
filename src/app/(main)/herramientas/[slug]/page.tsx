import { notFound } from "next/navigation"
import { tools } from "@/data/tools"
import { Construction } from "lucide-react"
import { ToolPageLayout } from "@/components/layout/ToolPageLayout"
import { buildMetadata } from "@/lib/metadata"
import { JsonLd } from "@/components/seo/JsonLd"
import { siteConfig } from "@/config/site"
import { createClient } from "@/utils/supabase/server"
import { User } from "@supabase/supabase-js"

import { CalculadoraAguinaldo } from "@/components/tools/CalculadoraAguinaldo"
import { AguinaldoContent } from "@/components/tools/content/AguinaldoContent"
import { CalculadoraPrecios } from "@/components/tools/CalculadoraPrecios"
import { PrecioVentaContent } from "@/components/tools/content/PrecioVentaContent"
import { GeneradorPresupuestos } from "@/components/tools/GeneradorPresupuestos"
import { GeneradorPresupuestosContent } from "@/components/tools/content/GeneradorPresupuestosContent"
import { GeneradorQR } from "@/components/tools/GeneradorQR"
import { GeneradorQRContent } from "@/components/tools/content/GeneradorQRContent"
import { CalculadoraIVA } from "@/components/tools/CalculadoraIVA"
import { CalculadoraIVAContent } from "@/components/tools/content/CalculadoraIVAContent"
import { CalculadoraRentabilidad } from "@/components/tools/CalculadoraRentabilidad"
import { CalculadoraRentabilidadContent } from "@/components/tools/content/CalculadoraRentabilidadContent"
import { Calculadora1RM } from "@/components/tools/Calculadora1RM"
import { Calculadora1RMContent } from "@/components/tools/content/Calculadora1RMContent"
import { CalculadoraCuotas } from "@/components/tools/CalculadoraCuotas"
import { CalculadoraCuotasContent } from "@/components/tools/content/CalculadoraCuotasContent"
import { CalculadoraCalorias } from "@/components/tools/CalculadoraCalorias"
import { CalculadoraCaloriasContent } from "@/components/tools/content/CalculadoraCaloriasContent"
import { LinkResenasGoogle } from "@/components/tools/LinkResenasGoogle"
import { LinkResenasGoogleContent } from "@/components/tools/content/LinkResenasGoogleContent"
import { ControlGastos } from "@/components/tools/ControlGastos"
import { ControlGastosContent } from "@/components/tools/content/ControlGastosContent"

function getToolComponent(slug: string, user: User | null): React.ReactNode {
  switch (slug) {
    case "calculadora-aguinaldo":
      return (
        <>
          <CalculadoraAguinaldo />
          <div className="mt-16">
            <AguinaldoContent />
          </div>
        </>
      )
    case "calculadora-precios":
      return (
        <>
          <CalculadoraPrecios />
          <div className="mt-16">
            <PrecioVentaContent />
          </div>
        </>
      )
    case "generador-presupuestos":
      return (
        <>
          <GeneradorPresupuestos />
          <div className="mt-16 flex justify-center">
            <GeneradorPresupuestosContent />
          </div>
        </>
      )
    case "generador-qr":
      return (
        <>
          <GeneradorQR />
          <div className="mt-16 flex justify-center">
            <GeneradorQRContent />
          </div>
        </>
      )
    case "calculadora-iva":
      return (
        <>
          <CalculadoraIVA />
          <div className="mt-16 flex justify-center">
            <CalculadoraIVAContent />
          </div>
        </>
      )
    case "calculadora-rentabilidad":
      return (
        <>
          <CalculadoraRentabilidad />
          <div className="mt-16 flex justify-center">
            <CalculadoraRentabilidadContent />
          </div>
        </>
      )
    case "calculadora-1rm":
      return (
        <>
          <Calculadora1RM />
          <div className="mt-16 flex justify-center">
            <Calculadora1RMContent />
          </div>
        </>
      )
    case "calculadora-cuotas":
      return (
        <>
          <CalculadoraCuotas />
          <div className="mt-16 flex justify-center">
            <CalculadoraCuotasContent />
          </div>
        </>
      )
    case "calculadora-calorias":
      return (
        <>
          <CalculadoraCalorias />
          <div className="mt-16 flex justify-center">
            <CalculadoraCaloriasContent />
          </div>
        </>
      )
    case "link-resenas-google":
      return (
        <>
          <LinkResenasGoogle />
          <div className="mt-16 flex justify-center">
            <LinkResenasGoogleContent />
          </div>
        </>
      )
    case "control-gastos":
      return (
        <>
          <ControlGastos user={user} />
          <div className="mt-16 flex justify-center">
            <ControlGastosContent />
          </div>
        </>
      )
    default:
      return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const tool = tools.find((t) => t.slug === resolvedParams.slug)

  if (!tool) {
    return buildMetadata({ title: "No encontrado", noindex: true })
  }

  const isSoon = tool.status === "soon"

  return buildMetadata({
    title: tool.seo?.title || tool.name,
    description: tool.seo?.description || tool.description,
    path: `/herramientas/${tool.slug}`,
    noindex: isSoon,
  })
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const tool = tools.find((t) => t.slug === resolvedParams.slug)

  if (!tool) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isSoon = tool.status === "soon"
  const toolContent = getToolComponent(tool.slug, user)

  const applicationCategory =
    tool.category === "salud"
      ? "HealthAndFitnessApplication"
      : tool.category === "marketing"
      ? "BusinessApplication"
      : "FinanceApplication"

  const jsonLdData = isSoon ? null : {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.seo?.description || tool.description,
    url: `${siteConfig.url}/herramientas/${tool.slug}`,
    applicationCategory,
    operatingSystem: "Web",
    inLanguage: "es-AR",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "ARS",
    },
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Herramientas",
        item: `${siteConfig.url}/herramientas`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: `${siteConfig.url}/herramientas/${tool.slug}`,
      },
    ],
  }

  return (
    <>
      {jsonLdData && <JsonLd data={jsonLdData} />}
      <JsonLd data={breadcrumbJsonLd} />

      <ToolPageLayout tool={tool}>
        {isSoon ? (
          <div className="text-center rounded-xl border border-dashed border-border bg-gray-50/50 p-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand mb-6">
              <Construction className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Esta herramienta está en construcción
            </h2>
            <p className="text-foreground-muted">
              Estamos trabajando para tenerla lista pronto. ¡Volvé a visitarnos!
            </p>
          </div>
        ) : (
          <div>
            {toolContent || (
              <div className="text-center py-8 text-neutral-500">
                El componente para esta herramienta aún no fue asignado.
              </div>
            )}
          </div>
        )}
      </ToolPageLayout>
    </>
  )
}
