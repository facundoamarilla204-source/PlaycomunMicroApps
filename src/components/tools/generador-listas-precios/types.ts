export interface PriceListProduct {
  id: string
  list_id: string
  name: string
  price: number
  category?: string
  code?: string
  description?: string
  sort_order: number
}

export interface PriceList {
  id: string
  user_id?: string
  name: string
  business_name?: string
  contact_info?: string
  description?: string
  updated_date?: string
  created_at?: string
  updated_at?: string
  products: PriceListProduct[]
}

export type MassUpdateType = "increase" | "decrease"
export type RoundingRule = "none" | "decimals" | "integer" | "tens" | "fifties" | "hundreds"
