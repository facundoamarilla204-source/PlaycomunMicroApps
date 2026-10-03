import { MetadataRoute } from "next"
import { siteConfig } from "@/config/site"
import { tools } from "@/data/tools"

export default function sitemap(): MetadataRoute.Sitemap {
  const isDev = process.env.VERCEL_ENV !== "production"
  
  if (isDev) {
    // En desarrollo/preview no enviamos urls al sitemap
    return []
  }

  const routes = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/herramientas`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/planes`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ] as MetadataRoute.Sitemap

  const liveTools = tools.filter((tool) => tool.status === "live")

  const toolRoutes = liveTools.map((tool) => ({
    url: `${siteConfig.url}/${tool.slug}`,
    lastModified: new Date(tool.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  })) as MetadataRoute.Sitemap

  return [...routes, ...toolRoutes]
}
