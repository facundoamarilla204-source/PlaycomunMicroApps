import React from "react"
import { Tool, tools } from "@/data/tools"
import { Breadcrumbs, BreadcrumbItem } from "@/components/seo/Breadcrumbs"
import ToolCard from "@/components/tools/ToolCard"


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
    <div className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {tool.seo?.h1 || tool.name}
          </h1>
          <p className="text-lg text-gray-600">
            {tool.seo?.intro || tool.description}
          </p>
        </div>

        {/* Slot para la aplicación principal */}
        <div className="mb-16">
          {children}
        </div>

        {/* Contenido explicativo */}
        {content && (
          <div className="prose prose-violet max-w-none mb-16">
            {content}
          </div>
        )}

        {/* Preguntas frecuentes */}
        {tool.faqs && tool.faqs.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Preguntas frecuentes</h2>
            <dl className="space-y-6">
              {tool.faqs.map((faq, index) => (
                <div key={index}>
                  <dt className="font-semibold text-gray-900 mb-2">{faq.question}</dt>
                  <dd className="text-gray-600">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Herramientas relacionadas */}
        {relatedTools.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Herramientas relacionadas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedTools.map((relatedTool) => (
                <ToolCard key={relatedTool.slug} tool={relatedTool} />
              ))}
            </div>
          </div>
        )}

        {/* Fecha de actualización */}
        <div className="text-sm text-gray-500 border-t border-gray-200 pt-6">
          Última actualización: {formattedDate}
        </div>
      </div>
    </div>
  )
}
