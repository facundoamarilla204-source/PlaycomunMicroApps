import { Metadata } from "next"
import GeneradorListasContent from "@/components/tools/content/GeneradorListasContent"

export const metadata: Metadata = {
  title: "Generador de Listas de Precios en PDF Gratis | PlayComun",
  description: "Creá listas de precios profesionales en PDF. Modificá precios masivamente, organizá por categorías y compartí tu lista. Ideal para emprendedores.",
  keywords: "generador de listas de precios, crear lista de precios, lista de precios en PDF, actualizar precios de productos, PlayComun",
}

export default function GeneradorListasPage() {
  return <GeneradorListasContent />
}
