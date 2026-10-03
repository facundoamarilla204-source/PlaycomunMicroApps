export type Tool = {
  slug: string
  name: string
  description: string
  category: "calculadoras" | "generadores" | "utilidades"
  icon: string
  tier: "free" | "pro"
  status: "live" | "soon"
  featured: boolean
  keywords: string[]
  updatedAt: string
  seo?: {
    title: string
    description: string
    h1: string
    intro: string
    keywords?: string[]
  }
  faqs?: { question: string; answer: string }[]
  related?: string[]
}

const NOW = new Date().toISOString()

export const tools: Tool[] = [
  {
    slug: "calculadora-precios",
    name: "Calculadora de precios",
    category: "calculadoras",
    tier: "free",
    description: "Calculá el precio de venta ideal de tus productos o servicios.",
    icon: "Calculator",
    status: "soon",
    featured: true,
    keywords: ["precio", "venta", "producto", "servicio", "ganancia", "margen", "costos"],
    updatedAt: NOW,
  },
  {
    slug: "generador-presupuestos",
    name: "Generador de presupuestos",
    category: "generadores",
    tier: "pro",
    description: "Creá presupuestos profesionales en segundos.",
    icon: "FileText",
    status: "soon",
    featured: true,
    keywords: ["presupuesto", "cotizacion", "pdf", "cliente"],
    updatedAt: NOW,
  },
  {
    slug: "calculadora-iva",
    name: "Calculadora de IVA",
    category: "calculadoras",
    tier: "free",
    description: "Calculá el IVA y el precio final con o sin impuestos.",
    icon: "Receipt",
    status: "soon",
    featured: true,
    keywords: ["iva", "impuesto", "precio", "afip", "factura"],
    updatedAt: NOW,
  },
  {
    slug: "calculadora-rentabilidad",
    name: "Calculadora de rentabilidad",
    category: "calculadoras",
    tier: "pro",
    description: "Conocé la rentabilidad de tu negocio o producto.",
    icon: "TrendingUp",
    status: "soon",
    featured: true,
    keywords: ["rentabilidad", "roi", "ganancia", "margen", "negocio"],
    updatedAt: NOW,
  },
  {
    slug: "generador-qr",
    name: "Generador de QR",
    category: "generadores",
    tier: "free",
    description: "Creá códigos QR para pagos, enlaces o texto.",
    icon: "QrCode",
    status: "soon",
    featured: true,
    keywords: ["qr", "codigo", "scan", "enlace", "pago"],
    updatedAt: NOW,
  },
  {
    slug: "control-gastos",
    name: "Control de gastos",
    category: "utilidades",
    tier: "free",
    description: "Llevá un control simple y efectivo de tus gastos.",
    icon: "Wallet",
    status: "soon",
    featured: true,
    keywords: ["gastos", "finanzas", "dinero", "control", "presupuesto"],
    updatedAt: NOW,
  },
  {
    slug: "calculadora-1rm",
    name: "Calculadora de 1RM",
    category: "calculadoras",
    tier: "free",
    description: "Conocé tu fuerza máxima en un ejercicio.",
    icon: "Dumbbell",
    status: "soon",
    featured: true,
    keywords: ["fuerza", "1rm", "gym", "gimnasio", "ejercicio", "pesas"],
    updatedAt: NOW,
  },
  {
    slug: "conversor-unidades",
    name: "Conversor de unidades",
    category: "utilidades",
    tier: "pro",
    description: "Convertí entre distintas unidades de forma rápida.",
    icon: "ArrowRightLeft",
    status: "soon",
    featured: true,
    keywords: ["conversor", "unidades", "medidas", "kilos", "libras", "metros", "centimetros"],
    updatedAt: NOW,
  },
  {
    slug: "calculadora-aguinaldo",
    name: "Calculadora de aguinaldo",
    category: "calculadoras",
    tier: "free",
    description: "Calculá cuánto te corresponde de aguinaldo.",
    icon: "Banknote",
    status: "soon",
    featured: true,
    keywords: ["aguinaldo", "sac", "sueldo", "salario", "diciembre", "junio"],
    updatedAt: NOW,
  },
  {
    slug: "calculadora-cuotas",
    name: "Calculadora de cuotas",
    category: "calculadoras",
    tier: "pro",
    description: "Simulá cuotas y compará opciones de financiamiento.",
    icon: "CreditCard",
    status: "soon",
    featured: true,
    keywords: ["cuotas", "interes", "prestamo", "financiamiento", "tarjeta", "credito"],
    updatedAt: NOW,
  },
  {
    slug: "control-stock",
    name: "Control de stock",
    category: "utilidades",
    tier: "pro",
    description: "Gestioná tu inventario de forma simple y rápida.",
    icon: "Boxes",
    status: "soon",
    featured: true,
    keywords: ["stock", "inventario", "productos", "gestion", "deposito"],
    updatedAt: NOW,
  },
  {
    slug: "calculadora-calorias",
    name: "Calculadora de calorías",
    category: "calculadoras",
    tier: "free",
    description: "Conocé cuántas calorías necesitás según tu objetivo.",
    icon: "Flame",
    status: "soon",
    featured: true,
    keywords: ["calorias", "dieta", "nutricion", "macros", "tdee"],
    updatedAt: NOW,
  },
]
