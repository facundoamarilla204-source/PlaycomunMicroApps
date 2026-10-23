import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Wheat,
  CalendarCheck,
  Boxes,
  ShoppingCart,
  Truck,
  Calculator,
  ShoppingBag,
  Calendar,
  Users,
  LucideIcon,
} from 'lucide-react'

export interface AmasiaNavItem {
  id: string
  name: string
  shortName: string
  href: string
  icon: LucideIcon
  badge?: string
  proOnly?: boolean
  description: string
  matchPrefixes?: string[]
}

export interface AmasiaNavGroup {
  id: string
  title: string
  items: AmasiaNavItem[]
}

export const AMASIA_NAV_GROUPS: AmasiaNavGroup[] = [
  {
    id: 'resumen',
    title: 'General',
    items: [
      {
        id: 'inicio',
        name: 'Inicio',
        shortName: 'Inicio',
        href: '/cocina-pro',
        icon: LayoutDashboard,
        description: 'Panel general y pulso operativo',
      },
    ],
  },
  {
    id: 'comercial',
    title: 'Ventas y Pedidos',
    items: [
      {
        id: 'pedidos',
        name: 'Pedidos y entregas',
        shortName: 'Pedidos',
        href: '/cocina-pro/pedidos',
        icon: ShoppingBag,
        matchPrefixes: ['/cocina-pro/pedidos'],
        description: 'Registro comercial, productos acordados y cobros',
      },
      {
        id: 'calendario',
        name: 'Calendario de entregas',
        shortName: 'Calendario',
        href: '/cocina-pro/calendario',
        icon: Calendar,
        matchPrefixes: ['/cocina-pro/calendario'],
        description: 'Cronograma mensual, semanal y agenda de entregas',
      },
      {
        id: 'clientes',
        name: 'Clientes',
        shortName: 'Clientes',
        href: '/cocina-pro/clientes',
        icon: Users,
        matchPrefixes: ['/cocina-pro/clientes'],
        description: 'Directorio de contactos, teléfonos y direcciones',
      },
    ],
  },
  {
    id: 'elaboracion',
    title: 'Elaboración y Fórmulas',
    items: [
      {
        id: 'recetas',
        name: 'Recetario profesional',
        shortName: 'Recetas',
        href: '/cocina-pro/recetas',
        icon: BookOpen,
        matchPrefixes: ['/cocina-pro/recetas', '/cocina-pro/elaboracion'],
        description: 'Fichas técnicas, subrecetas y modo elaboración',
      },
      {
        id: 'ingredientes',
        name: 'Biblioteca de ingredientes',
        shortName: 'Ingredientes',
        href: '/cocina-pro/ingredientes',
        icon: Layers,
        description: 'Insumos, densidades y precios de referencia',
      },
      {
        id: 'panaderia',
        name: 'Calculadora panadera',
        shortName: 'Panadería',
        href: '/cocina-pro/panaderia',
        icon: Wheat,
        description: 'Porcentaje panadero, masas e hidratación',
      },
    ],
  },
  {
    id: 'planificacion',
    title: 'Planificación de Obrador',
    items: [
      {
        id: 'produccion',
        name: 'Planificador de producción',
        shortName: 'Producción',
        href: '/cocina-pro/produccion',
        icon: CalendarCheck,
        description: 'Planes de tanda, insumos consolidados y hoja de obrador',
      },
    ],
  },
  {
    id: 'abastecimiento',
    title: 'Abastecimiento y Almacén',
    items: [
      {
        id: 'inventario',
        name: 'Inventario y existencias',
        shortName: 'Inventario',
        href: '/cocina-pro/inventario',
        icon: Boxes,
        description: 'Control de stock físico, lotes y ajustes',
      },
      {
        id: 'compras',
        name: 'Órdenes de compra',
        shortName: 'Compras',
        href: '/cocina-pro/compras',
        icon: ShoppingCart,
        description: 'Pedidos a proveedores y recepción transaccional',
      },
      {
        id: 'proveedores',
        name: 'Proveedores',
        shortName: 'Proveedores',
        href: '/cocina-pro/proveedores',
        icon: Truck,
        description: 'Directorio comercial y empaques habituales',
      },
    ],
  },
  {
    id: 'herramientas',
    title: 'Herramientas',
    items: [
      {
        id: 'costos',
        name: 'Calculadora de costos',
        shortName: 'Costos',
        href: '/herramientas/costo-receta',
        icon: Calculator,
        description: 'Escandallo libre de recetas y mermas',
      },
    ],
  },
]

/**
 * Retorna todos los ítems de navegación aplanados
 */
export function getAllAmasiaNavItems(): AmasiaNavItem[] {
  return AMASIA_NAV_GROUPS.flatMap((group) => group.items)
}

/**
 * Determina si una ruta coincide con un ítem de navegación
 */
export function isAmasiaItemActive(item: AmasiaNavItem, pathname: string): boolean {
  if (item.href === '/cocina-pro') {
    return pathname === '/cocina-pro'
  }
  if (item.matchPrefixes && item.matchPrefixes.length > 0) {
    return item.matchPrefixes.some((prefix) => pathname.startsWith(prefix))
  }
  return pathname.startsWith(item.href)
}

/**
 * Obtiene el ítem de navegación activo dado el pathname actual
 */
export function getActiveAmasiaNavItem(pathname: string): AmasiaNavItem | undefined {
  const allItems = getAllAmasiaNavItems()
  // Primero buscamos coincidencias específicas (no '/cocina-pro')
  const specificMatch = allItems.find(
    (item) => item.href !== '/cocina-pro' && isAmasiaItemActive(item, pathname)
  )
  if (specificMatch) return specificMatch

  // Si no hay coincidencia específica, verificamos si es el inicio
  if (pathname === '/cocina-pro') {
    return allItems.find((item) => item.href === '/cocina-pro')
  }

  return undefined
}
