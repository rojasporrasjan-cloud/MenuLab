import type { ReactNode } from 'react'

import { COPY } from '@shared/copy/ui.copy'

interface KDSColumnProps {
  readonly title: string
  readonly count: number
  readonly accentColor: string
  readonly children: ReactNode
}

export function KDSColumn({ title, count, accentColor, children }: KDSColumnProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <header
        className="flex items-center justify-between rounded-xl px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.04)', borderTop: `3px solid ${accentColor}` }}
      >
        <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-white">{title}</h2>
        <span
          className="flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[13px] font-black tabular-nums"
          style={{ background: `${accentColor}26`, color: accentColor }}
        >
          {count}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
        {count === 0 ? (
          <p
            className="rounded-2xl border border-dashed py-10 text-center text-[13px] font-semibold"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.3)' }}
          >
            {COPY.kds.empty}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
