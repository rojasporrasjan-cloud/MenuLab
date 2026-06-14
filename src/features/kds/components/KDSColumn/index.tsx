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
    <section className="flex min-h-0 flex-1 flex-col gap-4 rounded-3xl bg-neutral-900/50 p-3 ring-1 ring-white/5">
      <header
        className="flex items-center justify-between rounded-2xl px-5 py-4 shadow-sm"
        style={{ 
          background: `linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`, 
          borderTop: `3px solid ${accentColor}`,
          borderBottom: '1px solid rgba(255,255,255,0.02)',
        }}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-[14px] font-black uppercase tracking-[0.15em] text-white/90 drop-shadow-sm">{title}</h2>
        </div>
        <div
          className="flex h-8 min-w-[32px] items-center justify-center rounded-xl px-2.5 shadow-inner"
          style={{ 
            background: `color-mix(in srgb, ${accentColor} 20%, transparent)`, 
            color: accentColor,
            border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`
          }}
        >
          <span className="text-[15px] font-black tabular-nums">{count}</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {count === 0 ? (
          <div
            className="mx-2 mt-4 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed py-16 text-center shadow-inner"
            style={{ 
              borderColor: 'rgba(255,255,255,0.06)', 
              background: 'rgba(255,255,255,0.01)'
            }}
          >
            <div className="mb-3 h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full" style={{ background: accentColor, opacity: 0.5 }} />
            </div>
            <p className="text-[14px] font-bold text-white/30">
              {COPY.kds.empty}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
