import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  /** Título principal — negro cálido, font-black (estilo landing). */
  readonly title: string
  /** Etiqueta pequeña dorada en mayúsculas sobre el título. */
  readonly eyebrow?: string
  /** Descripción breve bajo el título. */
  readonly subtitle?: string
  /** Ícono opcional en chip dorado a la izquierda. */
  readonly icon?: LucideIcon
  /** Acciones a la derecha (botones, filtros…). */
  readonly actions?: ReactNode
}

/**
 * Encabezado editorial unificado para los módulos del panel.
 * Reproduce el lenguaje visual de la landing (eyebrow dorado + título negro
 * font-black) usando tokens del tema (brand-* / surface-*), sin hexes sueltos.
 */
export function PageHeader({ title, eyebrow, subtitle, icon: Icon, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Icon size={21} strokeWidth={2} />
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          {eyebrow && (
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-600">
              {eyebrow}
            </p>
          )}
          <h1 className="text-[22px] font-black leading-tight tracking-tight text-surface-900">
            {title}
          </h1>
          {subtitle && <p className="text-[13px] leading-snug text-surface-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
