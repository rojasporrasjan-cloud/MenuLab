import type { OrderStatus } from '@core/domain/entities/Order'
import { COPY } from '@shared/copy/ui.copy'

interface OrderStatusBadgeProps {
  readonly status: OrderStatus
}

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string }> = {
  pending: { bg: 'rgba(245,181,32,0.15)', color: '#b45309' },
  confirmed: { bg: 'rgba(96,165,250,0.15)', color: '#1d4ed8' },
  preparing: { bg: 'rgba(167,139,250,0.15)', color: '#6d28d9' },
  ready: { bg: 'rgba(52,211,153,0.15)', color: '#047857' },
  delivered: { bg: 'rgba(0,0,0,0.06)', color: '#52525b' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', color: '#b91c1c' },
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const style = STATUS_STYLE[status]
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide"
      style={{ background: style.bg, color: style.color }}
    >
      {COPY.orders.status[status]}
    </span>
  )
}
