import { ReactNode } from "react"
import { Breadcrumbs, BreadcrumbItem } from "@/components/seo/Breadcrumbs"

interface LegalHeaderProps {
  badgeLabel: string
  badgeIcon: ReactNode
  title: string
  description: string
  lastUpdated: string
  breadcrumbs: BreadcrumbItem[]
}

export function LegalHeader({
  badgeLabel,
  badgeIcon,
  title,
  description,
  lastUpdated,
  breadcrumbs,
}: LegalHeaderProps) {
  return (
    <header className="mb-10 sm:mb-12">
      <Breadcrumbs items={breadcrumbs} />
      
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
          {badgeIcon}
          {badgeLabel}
        </span>
        <span className="text-xs text-slate-600 font-medium">
          Actualizado el {lastUpdated}
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
        {title}
      </h1>
      
      <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
        {description}
      </p>
    </header>
  )
}
