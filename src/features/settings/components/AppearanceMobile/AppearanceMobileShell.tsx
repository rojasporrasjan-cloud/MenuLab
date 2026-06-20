import { useState } from 'react'
import type { ReactNode } from 'react'
import { EditorToolbar } from './EditorToolbar'
import { EditorSheet } from './EditorSheet'
import type { EditorTool } from './types'

interface AppearanceMobileShellProps {
  /** Preview en vivo (el `<TemplatePreview>` o iframe ya escalado). */
  readonly preview: ReactNode
  /** Herramientas del editor — cada una aporta su panel de controles. */
  readonly tools: readonly EditorTool[]
  /** Acciones flotantes sobre el preview (cerrar, publicar…). Opcional. */
  readonly header?: ReactNode
}

/**
 * Experiencia de edición de apariencia para móvil, estilo CapCut / Stories:
 * - Layout exacto de 100dvh, sin scroll global.
 * - Mitad superior: SOLO preview, limpio y sin obstrucciones.
 * - Zona del pulgar: toolbar deslizable + bottom-sheet expandible para los
 *   controles. Al abrir/expandir el sheet, el preview se encoge (mismo flex).
 *
 * Es agnóstico de la data: recibe `preview` y `tools` como nodos, así que se
 * monta sobre el estado de edición existente sin acoplarse a él.
 */
export function AppearanceMobileShell({ preview, tools, header }: AppearanceMobileShellProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const activeTool = tools.find((tool) => tool.id === activeId) ?? null

  function handleSelect(id: string) {
    // Tocar la herramienta activa otra vez cierra el sheet (toggle).
    setActiveId((prev) => (prev === id ? null : id))
    setExpanded(false)
  }

  function handleClose() {
    setActiveId(null)
    setExpanded(false)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950 text-white">
      {/* ── Viewport: preview limpio ─────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {header && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-3 [&>*]:pointer-events-auto">
            {header}
          </div>
        )}
        <div className="grid h-full w-full place-items-center overflow-hidden p-4">
          {preview}
        </div>
      </div>

      {/* ── Zona del pulgar: sheet + toolbar ─────────────────────────────── */}
      <div className="z-20 flex shrink-0 flex-col border-t border-white/10 bg-zinc-950/95 backdrop-blur-xl">
        {activeTool && (
          <EditorSheet
            title={activeTool.label}
            expanded={expanded}
            onToggleExpand={() => setExpanded((value) => !value)}
            onClose={handleClose}
          >
            {activeTool.content}
          </EditorSheet>
        )}
        <EditorToolbar tools={tools} activeId={activeId} onSelect={handleSelect} />
      </div>
    </div>
  )
}
