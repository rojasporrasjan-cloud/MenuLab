import { useState }                    from 'react'
import { useQueryClient }              from '@tanstack/react-query'
import type { TemplateId }             from '@core/domain/entities/Tenant'
import type { EditorTheme }            from '@features/editor/types/editor.types'
import type { CanvaTemplateRef }       from '@features/editor/types/blocks.types'
import type { GeminiMenuPayload }      from '@features/editor/services/AIParserService'
import { parseGeminiPayload }          from '@features/editor/services/AIParserService'
import { importGeminiMenuToFirestore } from '@features/editor/services/AIMenuImportService'
import { useEditorStore, selectTheme } from '@features/editor/store/useEditorStore'
import { GeminiApiService }            from '@infrastructure/services/GeminiApiService'

// ─── Phase discriminated union ────────────────────────────────────────────────

export type DigitalizePhase =
  | { readonly phase: 'idle' }
  | { readonly phase: 'extracting' }
  | { readonly phase: 'preview';  readonly payload: GeminiMenuPayload }
  | { readonly phase: 'applying' }
  | { readonly phase: 'done' }
  | { readonly phase: 'error';    readonly message: string; readonly code: string }

// ─── Fallback theme ───────────────────────────────────────────────────────────

const FALLBACK_THEME: EditorTheme = {
  primaryColor:    '#c0392b',
  backgroundColor: '#1a0a00',
  fontFamily:      'Inter, sans-serif',
  textScale:       '1',
  imgRadius:       '12px',
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
//
// Two-phase workflow:
//   1. extract()  — calls Gemini REST API, stores raw payload, advances to 'preview'
//                   so the caller can show extracted content and let the user pick a template.
//   2. apply()    — saves Gemini payload to Firestore (real docs with Gemini IDs),
//                   calls parseGeminiPayload to build the editor document (whose
//                   DataLayer bindings now reference real Firestore IDs), loads it.

export function useDigitalizeMenu(tenantId: string, menuId: string | null) {
  const [status, setStatus] = useState<DigitalizePhase>({ phase: 'idle' })

  const queryClient  = useQueryClient()
  const theme        = useEditorStore(selectTheme)
  const loadDocument = useEditorStore((s) => s.loadDocument)

  async function extract(imageBase64: string, mimeType: string): Promise<void> {
    if (!GeminiApiService.isConfigured()) {
      setStatus({
        phase:   'error',
        message: 'Falta la API key de Gemini. Añade VITE_GEMINI_API_KEY en tu archivo .env y reinicia el servidor.',
        code:    'GEMINI_KEY_MISSING',
      })
      return
    }

    setStatus({ phase: 'extracting' })

    try {
      const payload = await GeminiApiService.analyzeMenuImages([{ base64: imageBase64, mimeType }])
      setStatus({ phase: 'preview', payload })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido al analizar la imagen.'
      setStatus({ phase: 'error', message, code: 'CALL_FAILED' })
    }
  }

  async function apply(
    templateId:    TemplateId,
    canvaTemplate: CanvaTemplateRef | null,
  ): Promise<void> {
    if (status.phase !== 'preview') return

    if (!menuId) {
      setStatus({
        phase:   'error',
        message: 'No se encontró un menú activo. Crea uno desde la sección Menú antes de digitalizar.',
        code:    'NO_MENU',
      })
      return
    }

    setStatus({ phase: 'applying' })

    try {
      // 1. Save AI-extracted categories + dishes to Firestore using Gemini IDs as doc IDs.
      //    This is what makes the DataLayer bindings resolve to real data.
      await importGeminiMenuToFirestore(tenantId, menuId, status.payload)

      // 2. Invalidate the dish/category caches so EditorPage rebuilds its context.
      await queryClient.invalidateQueries({ queryKey: ['dishes', tenantId] })
      await queryClient.invalidateQueries({ queryKey: ['categories', tenantId] })
      await queryClient.invalidateQueries({ queryKey: ['menus', tenantId] })

      // 3. Parse the payload into an EditorDocument whose DataLayers reference
      //    the same IDs we just wrote to Firestore.
      const effectiveTheme = theme ?? FALLBACK_THEME
      const parseResult    = parseGeminiPayload(
        status.payload,
        tenantId,
        templateId,
        canvaTemplate,
        effectiveTheme,
      )

      if (!parseResult.ok) {
        setStatus({ phase: 'error', message: parseResult.error.message, code: parseResult.error.code })
        return
      }

      loadDocument(parseResult.document)
      setStatus({ phase: 'done' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar el menú. Intenta de nuevo.'
      setStatus({ phase: 'error', message, code: 'SAVE_FAILED' })
    }
  }

  function reset(): void {
    setStatus({ phase: 'idle' })
  }

  return { status, extract, apply, reset }
}
