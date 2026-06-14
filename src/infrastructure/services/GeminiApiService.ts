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

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}`)
    }

    return data as GeminiMenuPayload
  }
}
