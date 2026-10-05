import { NextResponse } from "next/server"

// Simple in-memory rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 10 * 60 * 1000 // 10 minutes
const MAX_REQUESTS = 30

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userRecord = rateLimit.get(ip)

  if (!userRecord || now > userRecord.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userRecord.count >= MAX_REQUESTS) {
    return false
  }

  userRecord.count += 1
  return true
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Demasiadas peticiones. Por favor, intentá de nuevo más tarde." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { mapsUrl } = body

    if (!mapsUrl) {
      return NextResponse.json({ error: "El enlace de Google Maps es requerido" }, { status: 400 })
    }

    // Basic validation of Google Maps URL
    const isValidMapsUrl = mapsUrl.includes("google.com/maps") || 
                           mapsUrl.includes("maps.app.goo.gl") || 
                           mapsUrl.includes("goo.gl/maps")

    if (!isValidMapsUrl) {
      return NextResponse.json({ error: "El enlace ingresado no parece ser de Google Maps" }, { status: 422 })
    }

    const productmateResponse = await fetch("https://productmate.com/api/v1/google-review-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maps_url: mapsUrl
      }),
    })

    if (!productmateResponse.ok) {
      if (productmateResponse.status === 429) {
        return NextResponse.json({ error: "Servicio temporalmente sobrecargado. Intentá de nuevo en unos minutos." }, { status: 429 })
      }
      return NextResponse.json({ error: "No pudimos extraer el enlace de esta URL. Verificá que sea correcta o probá el método de búsqueda." }, { status: 502 })
    }

    const data = await productmateResponse.json()
    
    if (!data.review_url) {
      return NextResponse.json({ error: "No se encontró el enlace de reseñas para este negocio." }, { status: 404 })
    }

    // Normalizing response to match Google output
    return NextResponse.json({
      reviewUrl: data.review_url,
      placeId: data.place_id || "",
      source: "productmate",
      verification: "not_verified",
      mapsUrl: mapsUrl
    })

  } catch (error) {
    console.error("Productmate API Error:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
