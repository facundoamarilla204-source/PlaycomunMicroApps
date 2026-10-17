import { MetadataRoute } from "next"
import { siteConfig } from "@/config/site"

export default function robots(): MetadataRoute.Robots {
  const isPreview = process.env.VERCEL_ENV === "preview"

  if (isPreview) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    }
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/cuenta",
        "/cuenta/",
        "/ingresar",
        "/registro",
        "/recuperar",
        "/verificar-email",
        "/checkout",
        "/favoritas",
        "/api/",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
