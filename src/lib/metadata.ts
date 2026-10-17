import { Metadata } from "next"
import { siteConfig } from "@/config/site"

type MetadataProps = {
  title?: string
  description?: string
  path?: string
  image?: string
  noindex?: boolean
}

export function buildMetadata({
  title,
  description,
  path = "",
  image,
  noindex = false,
}: MetadataProps = {}): Metadata {
  const isPreview = process.env.VERCEL_ENV === "preview"
  const forceNoIndex = isPreview || noindex

  // Limpiar path para asegurarse de que empieza con /
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : ""
  // Evitar barra final en todas las rutas para coincidencia exacta con sitemap.xml
  const normalizedPath = cleanPath === "/" ? "" : cleanPath.replace(/\/+$/, "")
  const canonicalUrl = `${siteConfig.url}${normalizedPath}`

  // Límites recomendados (advertencias en desarrollo)
  if (process.env.NODE_ENV === "development") {
    if (title && title.length > 60) {
      console.warn(`[SEO Warn] Title is too long (${title.length} > 60 chars): "${title}"`)
    }
    if (description && description.length > 155) {
      console.warn(`[SEO Warn] Description is too long (${description.length} > 155 chars): "${description}"`)
    }
  }

  const siteName = siteConfig.name
  const finalTitle = title
    ? title.includes(siteName)
      ? title
      : `${title} | ${siteName}`
    : siteName
  const finalDescription = description || siteConfig.description

  return {
    title: {
      absolute: finalTitle,
    },
    description: finalDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: canonicalUrl,
      siteName: siteConfig.name,
      images: [
        {
          url: image || `${siteConfig.url}/opengraph-image`,
          width: 1200,
          height: 630,
        },
      ],
      locale: siteConfig.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: [image || `${siteConfig.url}/opengraph-image`],
    },
    robots: {
      index: !forceNoIndex,
      follow: !forceNoIndex,
      googleBot: {
        index: !forceNoIndex,
        follow: !forceNoIndex,
      },
    },
  }
}
