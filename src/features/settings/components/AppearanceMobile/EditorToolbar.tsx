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
      className="grid grid-cols-3 gap-2 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
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
              'flex h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-transparent',
              'text-[12px] font-medium tracking-tight transition-all duration-200 active:scale-95',
              isActive
                ? 'bg-zinc-800/80 text-white shadow-md border-zinc-700'
                : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border-zinc-800/50',
            )}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.2 : 1.8}
              className={isActive ? 'text-brand-400' : ''}
            />
            <span className="leading-none">{tool.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
