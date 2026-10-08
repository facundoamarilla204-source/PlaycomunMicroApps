import { ImageResponse } from "next/og"
import { tools } from "@/data/tools"

export const runtime = "nodejs"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params
  const tool = tools.find((t) => t.slug === resolvedParams.slug)

  if (!tool) {
    return new ImageResponse(
      <div style={{ background: "white", width: "100%", height: "100%" }} />
    )
  }

  const categoryName = tool.type === "calculadora" 
    ? "Calculadora" 
    : tool.type === "generador" 
    ? "Generador" 
    : "Utilidad"

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
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#EDE9FE",
              color: "#6D28D9",
              padding: "12px 24px",
              borderRadius: "100px",
              fontSize: 24,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            {categoryName}
          </div>

          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#111827",
              marginTop: 40,
              marginBottom: 24,
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            {tool.name}
          </div>
          
          <div
            style={{
              fontSize: 36,
              color: "#4B5563",
              textAlign: "center",
              maxWidth: "800px",
              lineHeight: 1.4,
            }}
          >
            {tool.seo?.description || tool.description}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 80,
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 700, color: "#7C3AED" }}>
              PlayComun
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
