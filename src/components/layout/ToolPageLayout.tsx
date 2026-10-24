import React from "react"
import { Tool, tools } from "@/data/tools"
import { Breadcrumbs, BreadcrumbItem } from "@/components/seo/Breadcrumbs"
import ToolCard from "@/components/tools/ToolCard"
import { ShieldCheck, HelpCircle, ArrowRight } from "lucide-react"

type ToolPageLayoutProps = {
  tool: Tool
  children: React.ReactNode
  content?: React.ReactNode
}

export function ToolPageLayout({ tool, children, content }: ToolPageLayoutProps) {
  const CATEGORY_NAMES: Record<string, string> = {
    "precios-costos": "Precios y costos",
    "plata-finanzas": "Plata y finanzas",
    "gestion-negocio": "Gestión de negocio",
    "clientes-utilidades": "Clientes y utilidades",
    "salud-fitness": "Salud y fitness"
  };

  const categoryName = CATEGORY_NAMES[tool.category] || "Herramientas";

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Herramientas", href: "/herramientas" },
    { label: categoryName, href: `/herramientas?categoria=${tool.category}` },
    { label: tool.name },
  ]

  const relatedTools = tool.related
    ? tools.filter((t) => tool.related!.includes(t.slug))
    : []

  const formattedDate = new Date(tool.updatedAt).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Tool Header */}
        <div className="mt-4 mb-8 sm:mb-10 max-w-3xl">
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 font-medium">
            <span>{categoryName}</span>
            <span className="text-slate-300">•</span>
            <span>Uso libre en navegador</span>
            {tool.tier === "pro" && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-brand">Plan Pro</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
            {tool.seo?.h1 || tool.name}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {tool.seo?.intro || tool.description}
          </p>
        </div>

        {/* Slot para la aplicación principal */}
        <main className="mb-14 sm:mb-20">
          {children}
        </main>

        {/* Contenido explicativo SEO */}
        {content && (
          <section className="mb-14 sm:mb-20 border-t border-slate-200/80 pt-10">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-slate prose-violet max-w-none">
                {content}
              </div>
            </div>
          </section>
        )}

        {/* Preguntas frecuentes */}
        {tool.faqs && tool.faqs.length > 0 && (
          <section className="mb-14 sm:mb-20 border-t border-slate-200/80 pt-10">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="h-5 w-5 text-brand" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Preguntas frecuentes
                </h2>
              </div>
              <div className="grid gap-4">
                {tool.faqs.map((faq, index) => (
                  <div 
                    key={index} 
                    className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs"
                  >
                    <h3 className="text-base font-bold text-slate-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Herramientas relacionadas */}
        {relatedTools.length > 0 && (
          <section className="mb-14 sm:mb-20 border-t border-slate-200/80 pt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Herramientas recomendadas
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {relatedTools.map((relatedTool) => (
                <ToolCard key={relatedTool.slug} tool={relatedTool} />
              ))}
            </div>
          </section>
        )}

        {/* Footer info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-200 pt-6">
          <span>Última actualización: {formattedDate}</span>
          <span className="text-slate-400">PlayComun Online · Herramientas para tu negocio</span>
        </div>
      </div>
    </div>
  )
}
