export const siteConfig = {
  name: "PlayComun Herramientas",
  description: "Calculá, generá y resolvé en segundos. Las básicas son gratis y sin registro.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://playcomun.online",
  locale: "es_AR",
  organization: {
    name: "PlayComun",
    url: "https://playcomun.com",
    logo: "/images/logo.png",
  },
  links: {
    linkedin: "https://linkedin.com/company/playcomun",
    instagram: "https://instagram.com/playcomun",
    youtube: "https://youtube.com/@playcomun",
  },
}

export type SiteConfig = typeof siteConfig
