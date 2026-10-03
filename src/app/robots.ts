import { MetadataRoute } from "next"
import { siteConfig } from "@/config/site"

export default function robots(): MetadataRoute.Robots {
  const isDev = process.env.VERCEL_ENV !== "production"

  if (isDev) {
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
        "/ingresar",
        "/registro",
        "/recuperar",
        "/verificar-email",
        "/api/",
        "/favoritas"
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
