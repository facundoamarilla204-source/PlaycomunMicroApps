export type ColorHarmony =
  | "complementario"
  | "analogo"
  | "triadico"
  | "monocromatico"
  | "complementario-dividido"
  | "tetradico"
  | "aleatorio"

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number // 0 - 360
  s: number // 0 - 100
  l: number // 0 - 100
}

export interface ColorSample {
  id: string
  hex: string
  rgb: RGB
  hsl: HSL
  locked: boolean
  label?: string
}

export interface ExtractedColor {
  hex: string
  rgb: RGB
  hsl: HSL
  count: number
  percentage: number
}

export interface ContrastResult {
  ratio: number
  ratioFormatted: string
  normalTextAA: boolean
  normalTextAAA: boolean
  largeTextAA: boolean
  largeTextAAA: boolean
  uiComponentsAA: boolean
}

export interface FavoritePalette {
  id: string
  name: string
  colors: string[] // HEX codes
  createdAt: string
  version: number
}
