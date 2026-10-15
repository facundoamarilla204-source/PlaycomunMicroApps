import { buildMetadata } from "@/lib/metadata"
import GeneradorListasContent from "@/components/tools/content/GeneradorListasContent"

export const metadata = buildMetadata({
  title: "Generador de listas de precios en PDF online",
  description: "Creá listas de precios profesionales en PDF. Modificá precios masivamente, organizá por categorías y compartí tu lista.",
  path: "/herramientas/generador-listas-precios",
})

export default function GeneradorListasPage() {
  return <GeneradorListasContent />
}
