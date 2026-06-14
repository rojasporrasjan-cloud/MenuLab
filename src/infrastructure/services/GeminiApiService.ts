import { ENV } from '@shared/constants/env'
import type { GeminiMenuPayload } from '@features/editor/services/AIParserService'

// ─── Gemini REST API ──────────────────────────────────────────────────────────
//
// Calls Gemini directly from the browser using the REST API.
// This replaces the Firebase Cloud Function approach for local development.
//
// NOTA: requiere una API key de Google AI Studio (empieza con "AIza…"),
// creada en https://aistudio.google.com/apikey. Un token OAuth NO sirve aquí.

const GEMINI_MODEL  = 'gemini-2.5-flash'
const GEMINI_BASE   = 'https://generativelanguage.googleapis.com/v1beta/models'
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeminiCandidate {
  content: {
    parts: Array<{ text?: string }>
  }
}

interface GeminiApiResponse {
  candidates?: GeminiCandidate[]
  error?: { message: string; code: number }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class GeminiApiService {
  static isConfigured(): boolean {
    return Boolean(ENV.gemini.apiKey)
  }

  static async analyzeMenuImages(
    images: Array<{ base64: string; mimeType: string }>,
  ): Promise<GeminiMenuPayload> {
    const apiKey = ENV.gemini.apiKey
    if (!apiKey) {
      throw new Error('GEMINI_KEY_MISSING: Configura VITE_GEMINI_API_KEY en .env para usar el digitalizador de IA.')
    }

    // Acumuladores mutables — el payload final se construye inmutable al final.
    const allCategories: GeminiMenuPayload['categories'][number][] = []
    const allDishes: GeminiMenuPayload['dishes'][number][] = []
    let detectedLocale: string | null = null
    let tenantFields: GeminiMenuPayload['tenantFields'] = []

    const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const body = {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: img.mimeType,
                  data: img.base64,
                },
              },
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

      const data = (await response.json()) as GeminiApiResponse

      if (!response.ok) {
        const message = data.error?.message ?? `HTTP ${response.status}`
        if (
          response.status === 401 ||
          response.status === 403 ||
          /API key not valid|invalid authentication|UNAUTHENTICATED|API_KEY_INVALID/i.test(message)
        ) {
          throw new Error(
            'La API key de Gemini no es válida. Crea una en https://aistudio.google.com/apikey (debe empezar con "AIza…") y ponla en VITE_GEMINI_API_KEY.',
          )
        }
        if (response.status === 404 && /model/i.test(message)) {
          throw new Error('El modelo de Gemini no está disponible para tu key. Verifica que tu proyecto tenga acceso a la API de Gemini.')
        }
        if (response.status === 429) {
          throw new Error('Se agotó la cuota de Gemini por ahora. Espera unos minutos o revisa tu cuota/plan en Google AI Studio.')
        }
        throw new Error(`Error de Gemini en la imagen ${i + 1}: ${message}`)
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        throw new Error(`Gemini no retornó contenido para la imagen ${i + 1}. Intenta con una imagen más clara.`)
      }

      let payload: GeminiMenuPayload
      try {
        payload = JSON.parse(text) as GeminiMenuPayload
      } catch (_parseError) {
        // A veces Gemini envuelve el JSON con texto extra: rescatamos el bloque {...}
        try {
          const start = text.indexOf('{')
          const end = text.lastIndexOf('}')
          if (start !== -1 && end !== -1 && end > start) {
            const jsonString = text.substring(start, end + 1)
            payload = JSON.parse(jsonString) as GeminiMenuPayload
          } else {
            throw new Error('No JSON format detected.', { cause: _parseError })
          }
        } catch (innerErr) {
          throw new Error(
            `La respuesta de Gemini no es válida para la imagen ${i + 1}. Puede que el texto sea muy largo. Intenta con menos imágenes.`,
            { cause: innerErr },
          )
        }
      }

      // Fusión de campos generales (gana la primera imagen que los traiga)
      if (!detectedLocale && payload.detectedLocale) {
        detectedLocale = payload.detectedLocale
      }
      if (payload.tenantFields && tenantFields.length === 0) {
        tenantFields = payload.tenantFields
      }

      // Evitar colisiones de IDs entre imágenes: copias con sufijo por imagen
      // (los tipos del payload son readonly — nunca se mutan en sitio).
      const suffix = `_img${i + 1}`
      allCategories.push(
        ...(payload.categories ?? []).map((cat) => ({ ...cat, id: `${cat.id}${suffix}` })),
      )
      allDishes.push(
        ...(payload.dishes ?? []).map((dish) => ({
          ...dish,
          id: `${dish.id}${suffix}`,
          categoryId: `${dish.categoryId}${suffix}`,
        })),
      )
    }

    return {
      sourceImageWidthPx: 1024,
      sourceImageHeightPx: 1024,
      suggestedTemplateId: null,
      detectedLocale,
      tenantFields,
      categories: allCategories,
      dishes: allDishes,
    }
  }
}
