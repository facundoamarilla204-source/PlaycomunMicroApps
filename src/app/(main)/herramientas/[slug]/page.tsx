import { notFound } from "next/navigation"
import { tools } from "@/data/tools"
import { Construction } from "lucide-react"
import { ToolPageLayout } from "@/components/layout/ToolPageLayout"
import { buildMetadata } from "@/lib/metadata"
import { JsonLd } from "@/components/seo/JsonLd"
import { siteConfig } from "@/config/site"
import { createClient } from "@/utils/supabase/server"
import { User } from "@supabase/supabase-js"

import dynamic from "next/dynamic"

function ToolSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-8 bg-white rounded-2xl border border-slate-200/80 animate-pulse space-y-6">
      <div className="h-8 bg-slate-100 rounded-lg w-1/3" />
      <div className="h-4 bg-slate-100 rounded w-2/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div className="h-24 bg-slate-50 rounded-xl" />
        <div className="h-24 bg-slate-50 rounded-xl" />
      </div>
      <div className="h-40 bg-slate-50 rounded-xl" />
    </div>
  )
}

// Herramientas interactivas cargadas bajo demanda por ruta (code-splitting dinámico)
const CalculadoraAguinaldo = dynamic(
  () => import("@/components/tools/CalculadoraAguinaldo").then((m) => m.CalculadoraAguinaldo),
  { loading: () => <ToolSkeleton /> }
)
const CalculadoraPrecios = dynamic(
  () => import("@/components/tools/CalculadoraPrecios").then((m) => m.CalculadoraPrecios),
  { loading: () => <ToolSkeleton /> }
)
const GeneradorFacturasTool = dynamic(
  () => import("@/components/tools/generador-facturas/GeneradorFacturasTool").then((m) => m.GeneradorFacturasTool),
  { loading: () => <ToolSkeleton /> }
)
const GeneradorQR = dynamic(
  () => import("@/components/tools/GeneradorQR").then((m) => m.GeneradorQR),
  { loading: () => <ToolSkeleton /> }
)
const CalculadoraIVA = dynamic(
  () => import("@/components/tools/CalculadoraIVA").then((m) => m.CalculadoraIVA),
  { loading: () => <ToolSkeleton /> }
)
const CalculadoraRentabilidad = dynamic(
  () => import("@/components/tools/CalculadoraRentabilidad").then((m) => m.CalculadoraRentabilidad),
  { loading: () => <ToolSkeleton /> }
)
const Calculadora1RM = dynamic(
  () => import("@/components/tools/Calculadora1RM").then((m) => m.Calculadora1RM),
  { loading: () => <ToolSkeleton /> }
)
const CalculadoraCuotas = dynamic(
  () => import("@/components/tools/CalculadoraCuotas").then((m) => m.CalculadoraCuotas),
  { loading: () => <ToolSkeleton /> }
)
const CalculadoraCalorias = dynamic(
  () => import("@/components/tools/CalculadoraCalorias").then((m) => m.CalculadoraCalorias),
  { loading: () => <ToolSkeleton /> }
)
const LinkResenasGoogle = dynamic(
  () => import("@/components/tools/LinkResenasGoogle").then((m) => m.LinkResenasGoogle),
  { loading: () => <ToolSkeleton /> }
)
const ControlGastos = dynamic(
  () => import("@/components/tools/ControlGastos").then((m) => m.ControlGastos),
  { loading: () => <ToolSkeleton /> }
)
const CostoReceta = dynamic(
  () => import("@/components/tools/CostoReceta").then((m) => m.CostoReceta),
  { loading: () => <ToolSkeleton /> }
)
const ConversorUnidades = dynamic(
  () => import("@/components/tools/ConversorUnidades").then((m) => m.ConversorUnidades),
  { loading: () => <ToolSkeleton /> }
)
const CompresorImagenes = dynamic(
  () => import("@/components/tools/compresor-imagenes/CompresorImagenes").then((m) => m.CompresorImagenes),
  { loading: () => <ToolSkeleton /> }
)
const ConvertidorArchivos = dynamic(
  () => import("@/components/tools/convertidor-archivos/ConvertidorArchivos").then((m) => m.ConvertidorArchivos),
  { loading: () => <ToolSkeleton /> }
)
const OrdenarPdf = dynamic(
  () => import("@/components/tools/ordenar-pdf/OrdenarPdf").then((m) => m.OrdenarPdf),
  { loading: () => <ToolSkeleton /> }
)
const CortadorAudio = dynamic(
  () => import("@/components/tools/cortador-audio/CortadorAudio").then((m) => m.CortadorAudio),
  { loading: () => <ToolSkeleton /> }
)
const GeneradorPaletasTool = dynamic(
  () => import("@/components/tools/generador-paletas/GeneradorPaletasTool").then((m) => m.GeneradorPaletasTool),
  { loading: () => <ToolSkeleton /> }
)
const FirmarPdfTool = dynamic(
  () => import("@/components/tools/firmar-pdf/FirmarPdfTool").then((m) => m.FirmarPdfTool),
  { loading: () => <ToolSkeleton /> }
)

// Contenido SEO estático renderizado en servidor (SSR nativo)
import { AguinaldoContent } from "@/components/tools/content/AguinaldoContent"
import { PrecioVentaContent } from "@/components/tools/content/PrecioVentaContent"
import { GeneradorPresupuestosContent } from "@/components/tools/content/GeneradorPresupuestosContent"
import { GeneradorFacturasContent } from "@/components/tools/content/GeneradorFacturasContent"
import { GeneradorQRContent } from "@/components/tools/content/GeneradorQRContent"
import { CalculadoraIVAContent } from "@/components/tools/content/CalculadoraIVAContent"
import { CalculadoraRentabilidadContent } from "@/components/tools/content/CalculadoraRentabilidadContent"
import { Calculadora1RMContent } from "@/components/tools/content/Calculadora1RMContent"
import { CalculadoraCuotasContent } from "@/components/tools/content/CalculadoraCuotasContent"
import { CalculadoraCaloriasContent } from "@/components/tools/content/CalculadoraCaloriasContent"
import { LinkResenasGoogleContent } from "@/components/tools/content/LinkResenasGoogleContent"
import { ControlGastosContent } from "@/components/tools/content/ControlGastosContent"
import { CostoRecetaContent } from "@/components/tools/content/CostoRecetaContent"
import { ConversorUnidadesContent } from "@/components/tools/content/ConversorUnidadesContent"
import { CompresorImagenesContent } from "@/components/tools/content/CompresorImagenesContent"
import { ConvertidorArchivosContent } from "@/components/tools/content/ConvertidorArchivosContent"
import { OrdenarPdfContent } from "@/components/tools/content/OrdenarPdfContent"
import { CortadorAudioContent } from "@/components/tools/content/CortadorAudioContent"
import GeneradorListasContent from "@/components/tools/content/GeneradorListasContent"
import { GeneradorPaletasContent } from "@/components/tools/content/GeneradorPaletasContent"
import { FirmarPdfContent } from "@/components/tools/content/FirmarPdfContent"

import { isProUser } from "@/lib/pro"

function getToolComponent(slug: string, user: User | null, isPro: boolean = false): React.ReactNode {
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
          <GeneradorFacturasTool initialType="presupuesto" lockType={true} />
          <div className="mt-16 flex justify-center">
            <GeneradorPresupuestosContent />
          </div>
        </>
      )
    case "generador-documentos-comerciales":
    case "generador-facturas":
      return (
        <>
          <GeneradorFacturasTool />
          <div className="mt-16 flex justify-center">
            <GeneradorFacturasContent />
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
          <ControlGastos user={user} initialIsPro={isPro} />
          <div className="mt-16 flex justify-center">
            <ControlGastosContent />
          </div>
        </>
      )
    case "costo-receta":
      return (
        <>
          <CostoReceta user={user} />
          <div className="mt-16 flex justify-center">
            <CostoRecetaContent />
          </div>
        </>
      )
    case "conversor-unidades":
      return (
        <>
          <ConversorUnidades />
          <div className="mt-16 flex justify-center">
            <ConversorUnidadesContent />
          </div>
        </>
      )
    case "compresor-imagenes":
      return (
        <>
          <CompresorImagenes />
          <div className="mt-16 flex justify-center">
            <CompresorImagenesContent />
          </div>
        </>
      )
    case "convertidor-archivos":
      return (
        <>
          <ConvertidorArchivos />
          <div className="mt-16 flex justify-center">
            <ConvertidorArchivosContent />
          </div>
        </>
      )
    case "ordenar-pdf":
      return (
        <>
          <OrdenarPdf />
          <div className="mt-16 flex justify-center">
            <OrdenarPdfContent />
          </div>
        </>
      )
    case "cortar-audio":
      return (
        <>
          <CortadorAudio />
          <div className="mt-16 flex justify-center">
            <CortadorAudioContent />
          </div>
        </>
      )
    case "generador-paletas-colores":
      return (
        <>
          <GeneradorPaletasTool />
          <div className="mt-16 flex justify-center">
            <GeneradorPaletasContent />
          </div>
        </>
      )
    case "firmar-pdf":
      return (
        <>
          <FirmarPdfTool />
          <div className="mt-16 flex justify-center">
            <FirmarPdfContent />
          </div>
        </>
      )
    case "generador-listas-precios":
      return <GeneradorListasContent />
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
  const isPro = user ? await isProUser(user.id) : false

  const isSoon = tool.status === "soon"
  const toolContent = getToolComponent(tool.slug, user, isPro)

  const applicationCategory =
    tool.category === "salud-fitness"
      ? "HealthAndFitnessApplication"
      : tool.category === "gestion-negocio" || tool.category === "clientes-utilidades"
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

  const faqJsonLd =
    !isSoon && tool.faqs && tool.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: tool.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null

  return (
    <>
      {jsonLdData && <JsonLd data={jsonLdData} />}
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

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
