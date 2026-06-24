import type { Table } from '@core/domain/entities/Table'
import { COPY } from '@shared/copy/ui.copy'

import type { POSTableState } from '../../types/pos.types'

interface TableGridProps {
  readonly tables: readonly Table[]
  readonly stateOf: (tableId: string) => POSTableState
  readonly ordersOf: (tableId: string) => readonly Order[]
  readonly onSelect: (table: Table) => void
}

const STATE_STYLE: Record<POSTableState, { bg: string; border: string; label: string }> = {
  free: {
    bg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.45)',
    label: COPY.pos.tables.free,
  },
  occupied: {
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.5)',
    label: COPY.pos.tables.occupied,
  },
  pending: {
    bg: 'rgba(239,68,68,0.14)',
    border: 'rgba(239,68,68,0.55)',
    label: COPY.pos.tables.pending,
  },
}

const STATE_DOT: Record<POSTableState, string> = {
  free: '#10b981',
  occupied: '#f59e0b',
  pending: '#ef4444',
}

/** Grid de mesas color-coded: verde libre, naranja ocupada, rojo pendiente. */
export function TableGrid({ tables, stateOf, ordersOf, onSelect }: TableGridProps) {
  if (tables.length === 0) {
    return (
      <p
        className="rounded-2xl border border-dashed px-4 py-12 text-center text-[13px]"
        style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}
      >
        {COPY.pos.tables.empty}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {tables.map((table) => {
        const state = stateOf(table.id)
        const style = STATE_STYLE[state]
        return (
          <button
            key={table.id}
            type="button"
            onClick={() => onSelect(table)}
            className="flex flex-col items-start gap-1.5 rounded-2xl p-4 text-left transition-all active:scale-95"
            style={{ background: style.bg, border: `1.5px solid ${style.border}` }}
          >
            <span className="text-[16px] font-black text-white">
              {table.label ?? COPY.table.label(table.number)}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span className="h-2 w-2 rounded-full" style={{ background: STATE_DOT[state] }} />
              {style.label}
            </span>
            {(() => {
              const orders = ordersOf(table.id)
              if (orders.length === 0) return null

              // Aggrupar items de todas las órdenes activas de la mesa
              const allItems = orders.flatMap(o => o.items)
              if (allItems.length === 0) return null

              const summary = allItems.slice(0, 3).map(i => `${i.quantity}x ${i.dishName}`).join(', ')
              const hasMore = allItems.length > 3
              const accountSize = orders.length

              return (
                <div className="mt-2 flex flex-col gap-1 w-full">
                  <span className="text-[11px] leading-snug line-clamp-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {summary}{hasMore ? '...' : ''}
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {COPY.pos.tables.account(accountSize)}
                  </span>
                </div>
              )
            })()}
          </button>
        )
      })}
    </div>
  )
}
