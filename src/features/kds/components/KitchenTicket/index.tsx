import { Timer, StickyNote } from 'lucide-react'

import type { Order } from '@core/domain/entities/Order'
import { ORDER_STATUS } from '@core/domain/entities/Order'
import { LIMITS } from '@shared/constants/limits'
import { COPY } from '@shared/copy/ui.copy'

interface KitchenTicketProps {
  readonly order: Order
  readonly now: Date
  readonly onAdvance: (orderId: string) => void
  readonly isUpdating: boolean
}

const ORDER_NUMBER_CHARS = 4

type TicketUrgency = 'fresh' | 'warning' | 'danger'

const URGENCY_STYLES: Record<TicketUrgency, { border: string; badge: string; badgeText: string }> = {
  fresh: { border: 'rgba(34,197,94,0.55)', badge: 'rgba(34,197,94,0.15)', badgeText: '#4ade80' },
  warning: { border: 'rgba(234,179,8,0.6)', badge: 'rgba(234,179,8,0.15)', badgeText: '#facc15' },
  danger: { border: 'rgba(239,68,68,0.7)', badge: 'rgba(239,68,68,0.18)', badgeText: '#f87171' },
}

function urgencyFor(elapsedMin: number): TicketUrgency {
  if (elapsedMin >= LIMITS.kds.dangerAfterMin) return 'danger'
  if (elapsedMin >= LIMITS.kds.warnAfterMin) return 'warning'
  return 'fresh'
}

function actionLabelFor(order: Order): string | null {
  if (order.status === ORDER_STATUS.confirmed) return COPY.kds.actions.startPreparing
  if (order.status === ORDER_STATUS.preparing) return COPY.kds.actions.markReady
  if (order.status === ORDER_STATUS.ready) return COPY.kds.actions.markDelivered
  return null
}

export function KitchenTicket({ order, now, onAdvance, isUpdating }: KitchenTicketProps) {
  const elapsedMin = Math.max(0, Math.floor((now.getTime() - order.createdAt.getTime()) / 60000))
  const urgency = urgencyFor(elapsedMin)
  const styles = URGENCY_STYLES[urgency]
  const orderNumber = order.id.slice(-ORDER_NUMBER_CHARS).toUpperCase()
  const origin = order.tableLabel ? COPY.table.label(order.tableLabel) : COPY.kds.pickup
  const actionLabel = actionLabelFor(order)

  function handleAdvance() {
    onAdvance(order.id)
  }

  return (
    <article
      className="flex flex-col gap-3 rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `2px solid ${styles.border}`,
      }}
    >
      {/* Header: número + edad */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-black tabular-nums text-white">
          {COPY.kds.orderNumber(orderNumber)}
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-black tabular-nums"
          style={{ background: styles.badge, color: styles.badgeText }}
        >
          <Timer size={12} strokeWidth={2.4} />
          {COPY.kds.elapsed(elapsedMin)}
        </span>
      </div>

      {/* Origen */}
      <p className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {origin}
      </p>

      {/* Items con cantidad grande */}
      <ul className="flex flex-col gap-2">
        {order.items.map((item, idx) => (
          <li key={`${item.dishId}-${idx}`} className="flex items-start gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base font-black tabular-nums"
              style={{ background: 'rgba(255,255,255,0.09)', color: '#fff' }}
            >
              {item.quantity}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[15px] font-bold leading-tight text-white">{item.dishName}</p>
              {item.variantLabel && (
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {item.variantLabel}
                </p>
              )}
              {item.note && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-[12px]" style={{ color: '#facc15' }}>
                  <StickyNote size={11} /> {item.note}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Nota general */}
      {order.note && (
        <p
          className="rounded-xl px-3 py-2 text-[12.5px] font-semibold"
          style={{ background: 'rgba(250,204,21,0.08)', color: '#fde047', border: '1px solid rgba(250,204,21,0.2)' }}
        >
          📝 {order.note}
        </p>
      )}

      {/* Acción */}
      {actionLabel && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={handleAdvance}
          className="w-full rounded-xl py-3 text-[14px] font-black text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          {actionLabel}
        </button>
      )}
    </article>
  )
}
