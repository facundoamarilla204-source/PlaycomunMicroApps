import { MetadataRoute } from "next"
import { siteConfig } from "@/config/site"
import { tools } from "@/data/tools"
import fs from "fs"
import path from "path"

export default function sitemap(): MetadataRoute.Sitemap {
  const isPreview = process.env.VERCEL_ENV === "preview"
  
  if (isPreview) {
    return []
  }

  // Fecha base de última actualización global del hub
  const hubLastMod = new Date("2026-10-15T00:00:00.000Z")

  const routes = [
    {
      url: siteConfig.url,
      lastModified: hubLastMod,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${siteConfig.url}/herramientas`,
      lastModified: hubLastMod,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/planes`,
      lastModified: hubLastMod,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/contacto`,
      lastModified: hubLastMod,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteConfig.url}/terminos`,
      lastModified: hubLastMod,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteConfig.url}/privacidad`,
      lastModified: hubLastMod,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteConfig.url}/arrepentimiento`,
      lastModified: hubLastMod,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteConfig.url}/baja-servicio`,
      lastModified: hubLastMod,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ] as MetadataRoute.Sitemap

  const liveTools = tools.filter((tool) => tool.status === "live")

  const toolRoutes = liveTools.map((tool) => ({
    url: `${siteConfig.url}${tool.customUrl || `/herramientas/${tool.slug}`}`,
    lastModified: new Date(tool.updatedAt),
    changeFrequency: "weekly",
    priority: tool.featured ? 0.9 : 0.8,
  })) as MetadataRoute.Sitemap

  // Solo incluir guías que estén completas y no sean marcadas como provisionales
  let guideRoutes: MetadataRoute.Sitemap = []
  try {
    const guiasDir = path.join(process.cwd(), "content", "guias")
    if (fs.existsSync(guiasDir)) {
      const files = fs.readdirSync(guiasDir).filter((f) => f.endsWith(".mdx"))
      for (const file of files) {
        const filePath = path.join(guiasDir, file)
        const fileContent = fs.readFileSync(filePath, "utf-8")
        // Excluir guías provisionales para proteger el índice contra thin content
        if (fileContent.includes("contenido provisional") || fileContent.length < 500) {
          continue
        }
        const stat = fs.statSync(filePath)
        guideRoutes.push({
          url: `${siteConfig.url}/guias/${file.replace(".mdx", "")}`,
          lastModified: stat.mtime || hubLastMod,
          changeFrequency: "monthly",
          priority: 0.7,
        })
      }
    }
  } catch (e) {
    // Si la carpeta no existe o falla la lectura, se ignora limpiamente
  }

  return [...routes, ...toolRoutes, ...guideRoutes]
}
