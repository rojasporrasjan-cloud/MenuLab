import type { GeminiMenuPayload } from '@features/editor/services/AIParserService'

// ─── Service ──────────────────────────────────────────────────────────────────

export class GeminiApiService {
  static isConfigured(): boolean {
    // Vercel Serverless Function maneja la llave secreta
    return true
  }

  static async analyzeMenuImages(
    images: Array<{ base64: string; mimeType: string }>,
  ): Promise<GeminiMenuPayload> {
    const url = '/api/analyzeMenu'

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
    })

    const text = await response.text()
    
    let data
    try {
      data = text ? JSON.parse(text) : {}
    } catch (_err) {
      throw new Error(`Respuesta inválida del servidor (HTTP ${response.status}). Intenta con menos imágenes o más pequeñas.`, { cause: _err })
    }

    if (!response.ok) {
      if (response.status === 413) {
        throw new Error('Las imágenes son muy pesadas para enviarlas de un solo golpe. Por favor sube menos páginas a la vez.')
      }
      throw new Error(data.error?.message || `Error del servidor HTTP ${response.status}`)
    }

    return data as GeminiMenuPayload
  }
}
