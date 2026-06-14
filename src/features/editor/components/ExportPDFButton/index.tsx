import { useState } from 'react'
import { Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useEditorStore } from '@features/editor/store/useEditorStore'
import {
  selectDocument,
  selectIsDirty,
  selectExportStatus,
} from '@features/editor/store/useEditorStore'
import { ExportPDFService } from '@features/editor/services/ExportPDFService'

interface ExportPDFButtonProps {
  /** Variante compacta para la barra superior (icono + "PDF"). */
  readonly compact?: boolean
}

export function ExportPDFButton({ compact = false }: ExportPDFButtonProps) {
  const document = useEditorStore(selectDocument)
  const isDirty = useEditorStore(selectIsDirty)
  const exportStatus = useEditorStore(selectExportStatus)
  const dispatch = useEditorStore((s) => s.dispatch)

  const [localError, setLocalError] = useState<string | null>(null)
  const [showSuccessText, setShowSuccessText] = useState(false)

  // Block interaction if there is no document loaded
  if (!document) return null

  const isExporting = exportStatus === 'exporting'
  const isDisabled = isDirty || isExporting

  async function handleExport() {
    if (isDisabled) return
    
    setLocalError(null)
    setShowSuccessText(false)
    dispatch({ type: 'EXPORT_PDF_START' })

    try {
      // Calls our high-definition export service targeting the canvas element ID
      await ExportPDFService.exportToPDF('menu-canvas-container', document)
      
      dispatch({ type: 'EXPORT_PDF_SUCCESS' })
      setShowSuccessText(true)
      
      // Auto-dismiss success status after 3 seconds
      setTimeout(() => {
        setShowSuccessText(false)
      }, 3000)
    } catch (err) {
      console.error('[Export PDF Failure]:', err)
      const message = err instanceof Error ? err.message : 'Error interno al exportar el PDF'
      dispatch({ type: 'EXPORT_PDF_ERROR', message })
      setLocalError(message)
    }
  }

  // ── Variante compacta para la barra superior ────────────────────────────────
  if (compact) {
    return (
      <button
        onClick={handleExport}
        disabled={isDisabled}
        title={isDirty ? 'Guardando cambios…' : 'Exportar menú a PDF para imprenta'}
        className={[
          'flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-colors',
          isDisabled
            ? 'cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-600'
            : showSuccessText
              ? 'border-emerald-600/40 bg-emerald-600/20 text-emerald-300'
              : 'border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
        ].join(' ')}
      >
        {isExporting
          ? <Loader2 size={13} className="animate-spin" />
          : showSuccessText
            ? <CheckCircle2 size={13} />
            : <Download size={13} />}
        <span>{isExporting ? 'PDF…' : showSuccessText ? 'Listo' : 'PDF'}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-sm">
      {/* Interactive premium action button */}
      <button
        onClick={handleExport}
        disabled={isDisabled}
        className={[
          'relative flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 shadow-md',
          isDirty
            ? 'cursor-not-allowed border border-surface-200 bg-surface-100 text-surface-400 shadow-none'
            : isExporting
            ? 'cursor-wait bg-brand-500/80 text-white'
            : showSuccessText
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 active:scale-[0.98]',
        ].join(' ')}
      >
        {isExporting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Generando PDF HD…</span>
          </>
        ) : showSuccessText ? (
          <>
            <CheckCircle2 size={18} />
            <span>¡PDF Listo! Descargando</span>
          </>
        ) : (
          <>
            <Download size={18} />
            <span>Exportar Menú (PDF Imprenta)</span>
          </>
        )}
      </button>

      {/* Auxiliary informative badges based on state */}
      {isDirty && (
        <div className="flex items-center gap-1.5 px-1 py-0.5 text-xs text-amber-600 animate-pulse">
          <AlertCircle size={14} className="shrink-0" />
          <span>Espera un momento, guardando cambios automáticamente…</span>
        </div>
      )}

      {localError && (
        <div className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 shadow-sm">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Fallo en la exportación</p>
            <p className="mt-0.5 opacity-90">{localError}</p>
          </div>
        </div>
      )}
    </div>
  )
}
