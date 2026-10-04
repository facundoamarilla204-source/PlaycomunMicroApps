import { ImageResponse } from "next/og"
import { siteConfig } from "@/config/site"

export const runtime = "nodejs"
export const alt = siteConfig.name
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F5F3FF",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "white",
            borderRadius: "32px",
            padding: "80px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            border: "2px solid #E5E7EB",
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "#7C3AED",
              marginBottom: 24,
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            {siteConfig.name}
          </div>
          <div
            style={{
              fontSize: 40,
              color: "#4B5563",
              textAlign: "center",
              maxWidth: "800px",
              lineHeight: 1.4,
            }}
          >
            {siteConfig.description}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
