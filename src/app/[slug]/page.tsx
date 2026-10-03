import { notFound } from "next/navigation"
import { tools } from "@/data/tools"
import { Construction } from "lucide-react"

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const tool = tools.find((t) => t.slug === resolvedParams.slug)

  if (!tool) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand mb-6">
        <Construction className="h-8 w-8" />
      </div>
      
      <div className="mb-4 flex justify-center">
        {tool.tier === "free" ? (
          <span className="rounded bg-free-bg px-3 py-1 text-sm font-medium text-free-text">
            Gratis
          </span>
        ) : (
          <span className="rounded bg-pro-bg px-3 py-1 text-sm font-medium text-pro-text">
            Pro
          </span>
        )}
      </div>

      <h1 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
        {tool.name}
      </h1>
      
      <p className="text-lg text-foreground-muted mb-12">
        {tool.description}
      </p>

      <div className="rounded-xl border border-dashed border-border bg-gray-50/50 p-12">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Esta herramienta está en construcción
        </h2>
        <p className="text-foreground-muted">
          Estamos trabajando para tenerla lista pronto. ¡Volvé a visitarnos!
        </p>
      </div>
    </div>
  )
}
