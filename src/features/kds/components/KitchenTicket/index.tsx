import { Timer, StickyNote, UtensilsCrossed, ShoppingBag, ArrowRight } from 'lucide-react'

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

const URGENCY_STYLES: Record<TicketUrgency, { 
  border: string; 
  bg: string;
  badge: string; 
  badgeText: string;
  glow: string;
}> = {
  fresh: { 
    border: 'rgba(52,211,153,0.3)', // emerald-400
    bg: 'rgba(52,211,153,0.03)',
    badge: 'rgba(52,211,153,0.15)', 
    badgeText: '#34d399',
    glow: 'rgba(52,211,153,0.05)',
  },
  warning: { 
    border: 'rgba(250,204,21,0.5)', // yellow-400
    bg: 'rgba(250,204,21,0.05)',
    badge: 'rgba(250,204,21,0.2)', 
    badgeText: '#facc15',
    glow: 'rgba(250,204,21,0.1)',
  },
  danger: { 
    border: 'rgba(248,113,113,0.6)', // red-400
    bg: 'rgba(248,113,113,0.08)',
    badge: 'rgba(248,113,113,0.25)', 
    badgeText: '#f87171',
    glow: 'rgba(248,113,113,0.15)',
  },
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
  
  const isTable = !!order.tableLabel
  const origin = isTable 
    ? COPY.table.label(order.tableLabel || '') 
    : order.type === 'delivery'
      ? COPY.cart.delivery.delivery
      : COPY.kds.pickup
  const actionLabel = actionLabelFor(order)

  function handleAdvance() {
    onAdvance(order.id)
  }

  return (
    <article
      className="group relative flex flex-col gap-4 rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, ${styles.bg} 100%)`,
        border: `1px solid ${styles.border}`,
        boxShadow: `0 8px 32px -8px ${styles.glow}`,
      }}
    >
      {/* Header: número + edad */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[18px] font-black tabular-nums tracking-wider text-white drop-shadow-sm">
            #{orderNumber}
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 shadow-inner"
          style={{ background: styles.badge, border: `1px solid ${styles.border}` }}
        >
          <Timer size={14} strokeWidth={2.5} style={{ color: styles.badgeText }} />
          <span className="text-[13.5px] font-black tabular-nums" style={{ color: styles.badgeText }}>
            {COPY.kds.elapsed(elapsedMin)}
          </span>
        </div>
      </div>

      {/* Origen */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
          {isTable ? <UtensilsCrossed size={14} className="text-white/70" /> : <ShoppingBag size={14} className="text-white/70" />}
        </div>
        <p className="text-[14px] font-bold uppercase tracking-[0.1em] text-white/70">
          {origin}
        </p>
      </div>

      {/* Items */}
      <ul className="mt-1 flex flex-col gap-3">
        {order.items.map((item, idx) => (
          <li key={`${item.dishId}-${idx}`} className="flex items-start gap-3 rounded-2xl bg-black/20 p-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[16px] font-black tabular-nums shadow-inner"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
            >
              {item.quantity}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[16px] font-bold leading-tight text-white/90">{item.dishName}</p>
              {item.variantLabel && (
                <p className="mt-1 text-[13px] font-medium text-white/50">
                  {item.variantLabel}
                </p>
              )}
              {item.note && (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-500/10 p-2 text-[12.5px] font-medium text-amber-300">
                  <StickyNote size={13} className="shrink-0 mt-0.5" /> 
                  <span>{item.note}</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Nota general */}
      {order.note && (
        <div
          className="mt-1 rounded-2xl p-3 shadow-inner"
          style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.2)' }}
        >
          <p className="flex items-start gap-2 text-[13.5px] font-medium text-amber-200">
            <span className="shrink-0 text-amber-400">📝</span> {order.note}
          </p>
        </div>
      )}

      {/* Acción */}
      {actionLabel && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={handleAdvance}
          className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[14.5px] font-black text-white shadow-lg transition-all active:scale-95 disabled:opacity-40"
          style={{ 
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)', 
            border: '1px solid rgba(255,255,255,0.2)' 
          }}
        >
          {actionLabel}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      )}
    </article>
  )
}
