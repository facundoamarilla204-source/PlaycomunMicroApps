export type RubroType = "gastronomia" | "indumentaria" | "mayorista" | "peluqueria" | "profesionales" | "general"

export interface Category {
  id: string
  name: string
  sort_order: number
}

export interface PriceListProduct {
  id: string
  list_id: string
  category_id?: string
  name: string
  price: number
  code?: string
  description?: string
  duration?: string // Servicios
  variant?: string // Talles / Colores
  unit?: string // Kilos / Bultos / Horas
  sort_order: number
}

export interface PriceList {
  id: string
  user_id?: string
  rubro: RubroType
  name: string
  business_name?: string
  contact_info?: string
  description?: string
  currency: string // ARS, USD, EUR, etc.
  logo_url?: string
  accent_color?: string
  updated_date?: string
  created_at?: string
  updated_at?: string
  categories: Category[]
  products: PriceListProduct[]
}

export type MassUpdateType = "increase" | "decrease"
export type RoundingRule = "none" | "decimals" | "integer" | "tens" | "fifties" | "hundreds"

export interface PriceListUserStatus {
  isAuthenticated: boolean
  isPro: boolean
  userId: string | null
  preservedCount: number
}
