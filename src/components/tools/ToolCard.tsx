import Link from "next/link"
import { Tool } from "@/data/tools"
import { 
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
  Wrench, 
  FileImage, 
  Files, 
  ChefHat,
  Scale,
  Scissors,
  Palette,
  PenTool,
  Image as ImageIcon,
  Globe,
  Stamp,
  ArrowUpRight,
  LucideIcon
} from "lucide-react"
import FavoriteButton from "./FavoriteButton"

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
  Wrench,
  FileImage,
  Files,
  ChefHat,
  Scale,
  Scissors,
  Palette,
  PenTool,
  Image: ImageIcon,
  Globe,
  Stamp,
}

const CATEGORY_LABELS: Record<string, string> = {
  "precios-costos": "Costos",
  "plata-finanzas": "Finanzas",
  "gestion-negocio": "Negocio",
  "clientes-utilidades": "Utilidades",
  "salud-fitness": "Fitness"
}

interface ToolCardProps {
  tool: Tool
  isFavorite?: boolean
}

export default function ToolCard({ tool, isFavorite = false }: ToolCardProps) {
  const Icon = iconMap[tool.icon] || Calculator
  const categoryLabel = CATEGORY_LABELS[tool.category] || "Herramienta"
  const toolUrl = tool.customUrl || `/herramientas/${tool.slug}`

  return (
    <div 
      className="group relative flex flex-col h-full rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-[border-color,box-shadow,transform] duration-200 ease-out hover:border-brand/40 hover:shadow-sm hover:-translate-y-0.5"
    >
      {/* Header row: Icon & Status / Favorite (Outside the main link to avoid nested interactive elements) */}
      <div className="flex items-center justify-between gap-3 mb-3.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand transition-colors group-hover:bg-brand group-hover:text-white">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {categoryLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {tool.tier === "pro" && (
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
              Pro
            </span>
          )}
          <FavoriteButton toolSlug={tool.slug} initialIsFavorite={isFavorite} />
        </div>
      </div>

      {/* Main Content with Stretched Link covering the rest of the card */}
      <Link 
        href={toolUrl}
        prefetch={true}
        className="flex-1 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-xl after:absolute after:inset-0 after:rounded-2xl after:content-['']"
      >
        <div>
          {/* Título permitiendo hasta 2 líneas con altura uniforme para evitar saltos en la grilla */}
          <h3 className="text-base font-bold text-slate-900 group-hover:text-brand transition-colors line-clamp-2 min-h-[2.75rem] mb-1.5 leading-snug">
            {tool.name}
          </h3>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {tool.description}
          </p>
        </div>

        {/* Footer affordance */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-600 group-hover:text-brand transition-colors">
            Abrir herramienta
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </Link>
    </div>
  )
}
