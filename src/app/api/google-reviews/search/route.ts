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
    const { query, location } = body

    if (!query) {
      return NextResponse.json({ error: "El nombre del negocio es requerido" }, { status: 400 })
    }

    const searchQuery = location ? `${query} en ${location}` : query

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      console.error("Missing GOOGLE_PLACES_API_KEY")
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }

    const googleResponse = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.googleMapsLinks.writeAReviewUri,places.googleMapsLinks.placeUri",
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        languageCode: "es",
      }),
    })

    if (!googleResponse.ok) {
      console.error("Google API Error", await googleResponse.text())
      return NextResponse.json({ error: "Error al comunicarse con Google Places" }, { status: 502 })
    }

    const data = await googleResponse.json()
    
    if (!data.places || data.places.length === 0) {
      return NextResponse.json({ results: [] })
    }

    const results = data.places.map((place: any) => ({
      placeId: place.id,
      name: place.displayName?.text || "",
      address: place.formattedAddress || "",
      reviewUrl: place.googleMapsLinks?.writeAReviewUri || "",
      mapsUrl: place.googleMapsLinks?.placeUri || "",
      source: "google",
      verification: "verified_by_google_response"
    }))

    // Return max 5 results
    return NextResponse.json({ results: results.slice(0, 5) })

  } catch (error) {
    console.error("Google Places Search Error:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
