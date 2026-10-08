import { tools } from "./tools"

export type Category = {
  id: "todas" | "precios-costos" | "plata-finanzas" | "gestion-negocio" | "clientes-utilidades" | "salud-fitness"
  name: string
  count: number
  icon: string
}

export const getCategories = (): Category[] => {
  const counts = tools.reduce(
    (acc, tool) => {
      acc[tool.category] = (acc[tool.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return [
    {
      id: "todas",
      name: "Todas",
      count: tools.length,
      icon: "LayoutGrid",
    },
    {
      id: "precios-costos",
      name: "Precios y costos",
      count: counts["precios-costos"] || 0,
      icon: "Tag",
    },
    {
      id: "plata-finanzas",
      name: "Plata y finanzas",
      count: counts["plata-finanzas"] || 0,
      icon: "Wallet",
    },
    {
      id: "gestion-negocio",
      name: "Gestión de negocio",
      count: counts["gestion-negocio"] || 0,
      icon: "Briefcase",
    },
    {
      id: "clientes-utilidades",
      name: "Clientes y utilidades",
      count: counts["clientes-utilidades"] || 0,
      icon: "Users",
    },
    {
      id: "salud-fitness",
      name: "Salud y fitness",
      count: counts["salud-fitness"] || 0,
      icon: "Heart",
    },
  ]
}
