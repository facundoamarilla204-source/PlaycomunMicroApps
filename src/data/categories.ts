import { tools } from "./tools"

export type Category = {
  id: "todas" | "calculadoras" | "generadores" | "utilidades"
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
      id: "calculadoras",
      name: "Calculadoras",
      count: counts["calculadoras"] || 0,
      icon: "Calculator",
    },
    {
      id: "generadores",
      name: "Generadores",
      count: counts["generadores"] || 0,
      icon: "Sparkles",
    },
    {
      id: "utilidades",
      name: "Utilidades",
      count: counts["utilidades"] || 0,
      icon: "Wrench",
    },
  ]
}
