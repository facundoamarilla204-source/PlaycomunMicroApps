import { MetadataRoute } from "next"
import { siteConfig } from "@/config/site"
import { tools } from "@/data/tools"
import fs from "fs"
import path from "path"

export default function sitemap(): MetadataRoute.Sitemap {
  const isDev = process.env.VERCEL_ENV !== "production"
  
  if (isDev) {
    // En desarrollo/preview no enviamos urls al sitemap
    return []
  }

  // Fecha base de última actualización global del hub
  const hubLastMod = new Date("2026-10-15T00:00:00.000Z")

  const routes = [
    {
      url: siteConfig.url,
      lastModified: hubLastMod,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/herramientas`,
      lastModified: hubLastMod,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/planes`,
      lastModified: hubLastMod,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ] as MetadataRoute.Sitemap

  const liveTools = tools.filter((tool) => tool.status === "live")

  const toolRoutes = liveTools.map((tool) => ({
    url: `${siteConfig.url}${tool.customUrl || `/herramientas/${tool.slug}`}`,
    lastModified: new Date(tool.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  })) as MetadataRoute.Sitemap

  let guideRoutes: MetadataRoute.Sitemap = []
  try {
    const guiasDir = path.join(process.cwd(), "content", "guias")
    const files = fs.readdirSync(guiasDir)
    guideRoutes = files.map((file) => {
      const filePath = path.join(guiasDir, file)
      const stat = fs.statSync(filePath)
      return {
        url: `${siteConfig.url}/guias/${file.replace(".mdx", "")}`,
        lastModified: stat.mtime || hubLastMod,
        changeFrequency: "monthly",
        priority: 0.7,
      }
    })
  } catch (e) {
    // directory might not exist in some builds if not committed yet, ignore
  }

  return [...routes, ...toolRoutes, ...guideRoutes]
}
