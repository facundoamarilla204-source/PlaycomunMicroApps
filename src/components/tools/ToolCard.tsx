import Link from "next/link"
import { Tool } from "@/data/tools"
import { ArrowDownLeft, Calculator, FileText, Receipt, TrendingUp, QrCode, Wallet, Dumbbell, ArrowRightLeft, Banknote, CreditCard, Boxes, Flame, Sparkles, Wrench, LucideIcon } from "lucide-react"
import FavoriteButton from "./FavoriteButton"

// Map of icons
const iconMap: Record<string, LucideIcon> = {
  Calculator,
  FileText,
  Receipt,
  TrendingUp,
  QrCode,
  Wallet,
  Dumbbell,
  ArrowRightLeft,
  Banknote,
  CreditCard,
  Boxes,
  Flame,
  Sparkles,
  Wrench
}

interface ToolCardProps {
  tool: Tool
  isFavorite?: boolean
}

export default function ToolCard({ tool, isFavorite = false }: ToolCardProps) {
  const Icon = iconMap[tool.icon] || Calculator

  return (
    <Link 
      href={`/herramientas/${tool.slug}`}
      className="group relative flex flex-col rounded-2xl border border-border/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5 active:scale-[0.98]"
    >
      <FavoriteButton toolSlug={tool.slug} initialIsFavorite={isFavorite} />
      
      <div className="absolute right-3 top-3">
        {tool.tier === "free" ? (
          <span className="rounded bg-free-bg px-2 py-1 text-xs font-medium text-free-text">
            Gratis
          </span>
        ) : (
          <span className="rounded bg-pro-bg px-2 py-1 text-xs font-medium text-pro-text">
            Pro
          </span>
        )}
      </div>

      <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand mb-4 transition-transform group-hover:scale-105">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="mb-2 text-xl font-bold tracking-tight text-foreground group-hover:text-brand transition-colors">
        {tool.name}
      </h3>
      
      <p className="mb-4 text-sm text-foreground-subtle line-clamp-2 flex-1">
        {tool.description}
      </p>

      <div className="mt-auto flex justify-end">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light/50 text-brand transition-all duration-300 group-hover:-rotate-45 group-hover:bg-brand group-hover:text-white">
          <ArrowDownLeft className="h-4 w-4 rotate-180 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
