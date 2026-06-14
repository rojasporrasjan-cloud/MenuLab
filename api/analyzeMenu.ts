/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable preserve-caught-error */
import type { VercelRequest, VercelResponse } from '@vercel/node'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const EXTRACT_PROMPT = `
Eres un experto en digitalización de menús de restaurantes.
Analiza esta imagen de menú y extrae TODA la información visible.

IMPORTANTE: Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown.

El JSON debe tener esta estructura exacta:
{
  "sourceImageWidthPx": 1024,
  "sourceImageHeightPx": 1024,
  "suggestedTemplateId": null,
  "detectedLocale": "es-CR",
  "tenantFields": [
    { "field": "name", "bounds": null },
    { "field": "tagline", "bounds": null },
    { "field": "phone", "bounds": null },
    { "field": "address", "bounds": null }
  ],
  "categories": [
    { "id": "cat-1", "name": "Nombre de la categoría", "bounds": null }
  ],
  "dishes": [
    {
      "id": "dish-1",
      "name": "Nombre del plato",
      "price": "₡0",
      "numericPrice": 0,
      "description": null,
      "categoryId": "cat-1",
      "bounds": null,
      "tags": []
    }
  ]
}

REGLAS:
- Extrae TODOS los platos visibles con sus nombres y precios exactos
- Usa IDs secuenciales: cat-1, cat-2... y dish-1, dish-2...
- Cada plato debe tener el categoryId correcto (la categoría a la que pertenece)
- Para precios: incluye el símbolo de moneda (₡, $, €) y el monto exacto del menú
- numericPrice: solo el número sin símbolo (ej: 8500 para ₡8,500)
- detectedLocale: detecta el idioma/región desde el contenido (ej: "es-CR" para Costa Rica)
- suggestedTemplateId: siempre null
- bounds: siempre null
- tenantFields: incluye los campos que puedas detectar en la imagen (nombre del restaurante, slogan, teléfono, dirección)
- Si un campo de tenantFields no está visible, incluye "bounds": null igual
- tags puede incluir: "vegetarian", "vegan", "spicy", "gluten-free", "recommended"

Extrae el máximo de platos posible. Si hay precios que no se ven claramente, usa null para numericPrice.
`.trim()

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuración de CORS para Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'GEMINI_API_KEY no está configurada en Vercel.' } })
  }

  try {
    const { images } = req.body

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: { message: 'No se enviaron imágenes para analizar.' } })
    }

    const allCategories: any[] = []
    const allDishes: any[] = []
    let detectedLocale: string | null = null
    let tenantFields: any[] = []

    const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const body = {
        contents: [
          {
            parts: [
              { inline_data: { mime_type: img.mimeType, data: img.base64 } },
              { text: EXTRACT_PROMPT },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data: any = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}`)
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error(`Gemini no retornó contenido para la imagen ${i + 1}.`)

      let payload: any
      try {
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        if (start !== -1 && end !== -1 && end > start) {
          payload = JSON.parse(text.substring(start, end + 1))
        } else {
          payload = JSON.parse(text)
        }
      } catch (err) {
        throw new Error(`Respuesta inválida de Gemini en la imagen ${i + 1}.`)
      }

      if (!detectedLocale && payload.detectedLocale) detectedLocale = payload.detectedLocale
      if (payload.tenantFields && tenantFields.length === 0) tenantFields = payload.tenantFields

      const suffix = `_img${i + 1}`
      allCategories.push(...(payload.categories || []).map((cat: any) => ({ ...cat, id: `${cat.id}${suffix}` })))
      allDishes.push(...(payload.dishes || []).map((dish: any) => ({
        ...dish,
        id: `${dish.id}${suffix}`,
        categoryId: `${dish.categoryId}${suffix}`,
      })))
    }

    res.status(200).json({
      sourceImageWidthPx: 1024,
      sourceImageHeightPx: 1024,
      suggestedTemplateId: null,
      detectedLocale,
      tenantFields,
      categories: allCategories,
      dishes: allDishes,
    })
  } catch (error: any) {
    console.error('Gemini API Error:', error)
    res.status(500).json({ error: { message: error.message || 'Error desconocido' } })
  }
}
