import { ChevronUp, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@shared/utils/cn'

interface EditorSheetProps {
  readonly title: string
  readonly expanded: boolean
  readonly onToggleExpand: () => void
  readonly onClose: () => void
  readonly children: ReactNode
}

/**
 * Bottom-sheet glassmorphism para los controles de la herramienta activa.
 * Dos alturas (peek / expandido) con transición suave; al expandir, el preview
 * superior se encoge (vive en el mismo flex-column que el sheet). El contenido
 * hace scroll interno sin scrollbar visible.
 */
export function EditorSheet({ title, expanded, onToggleExpand, onClose, children }: EditorSheetProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-t-3xl bg-white',
        'shadow-[0_-10px_40px_rgba(0,0,0,0.35)] transition-[height] duration-300 ease-out',
        expanded ? 'h-[62dvh]' : 'h-[44dvh]',
      )}
    >
      {/* Grabber + cabecera */}
      <header className="relative flex shrink-0 items-center justify-between border-b border-zinc-100 px-4 pb-2.5 pt-3">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={expanded ? 'Contraer panel' : 'Expandir panel'}
          className="absolute left-1/2 top-1.5 grid h-5 -translate-x-1/2 place-items-center px-8 active:scale-90"
        >
          <span className="block h-1 w-10 rounded-full bg-zinc-300" />
        </button>

        <h3 className="mt-1.5 text-[15px] font-black tracking-tight text-zinc-900">{title}</h3>

        <div className="mt-1.5 flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={expanded ? 'Contraer panel' : 'Expandir panel'}
            className="grid h-11 w-11 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 active:scale-90"
          >
            <ChevronUp size={19} className={cn('transition-transform duration-300', expanded && 'rotate-180')} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="grid h-11 w-11 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 active:scale-90"
          >
            <X size={19} />
          </button>
        </div>
      </header>

      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </section>
  )
}
