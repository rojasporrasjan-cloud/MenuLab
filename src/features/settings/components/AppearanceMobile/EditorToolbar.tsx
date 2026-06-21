import { cn } from '@shared/utils/cn'
import type { EditorTool } from './types'

interface EditorToolbarProps {
  readonly tools: readonly EditorTool[]
  readonly activeId: string | null
  readonly onSelect: (id: string) => void
}

/**
 * Barra de herramientas inferior, estilo CapCut: chips deslizables en
 * horizontal con snap táctil. Vive en la zona del pulgar; cada chip es un
 * touch-target de 60px. La barra de scroll se oculta vía `.scrollbar-hide`.
 */
export function EditorToolbar({ tools, activeId, onSelect }: EditorToolbarProps) {
  return (
    <nav
      aria-label="Herramientas de apariencia"
      className="scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
    >
      {tools.map((tool) => {
        const Icon = tool.icon
        const isActive = tool.id === activeId
        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelect(tool.id)}
            aria-pressed={isActive}
            className={cn(
              'flex h-[60px] min-w-[68px] shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-2xl px-3',
              'text-[11px] font-semibold tracking-tight transition-all duration-200 active:scale-90',
              isActive
                ? 'bg-white/10 text-white shadow-lg shadow-black/40 ring-1 ring-white/15'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <Icon
              size={21}
              strokeWidth={isActive ? 2.4 : 1.9}
              className={isActive ? 'text-brand-400' : ''}
            />
            <span className="leading-none">{tool.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
