export interface OrderItem {
  readonly dishId: string
  readonly dishName: string
  readonly quantity: number
  readonly unitPrice: number
  readonly variantLabel: string | null
  readonly note: string | null
}

export type OrderType = 'table' | 'pickup' | 'delivery'

export const ORDER_STATUS = {
  pending: 'pending',
  confirmed: 'confirmed',
  preparing: 'preparing',
  ready: 'ready',
  delivered: 'delivered',
  cancelled: 'cancelled',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

/** Estados que cuentan como "activos" para cocina/admin en tiempo real. */
export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.pending,
  ORDER_STATUS.confirmed,
  ORDER_STATUS.preparing,
  ORDER_STATUS.ready,
]

/** Transición natural de progreso de un pedido (sin contar cancelación). */
export const ORDER_STATUS_FLOW: readonly OrderStatus[] = [
  ORDER_STATUS.pending,
  ORDER_STATUS.confirmed,
  ORDER_STATUS.preparing,
  ORDER_STATUS.ready,
  ORDER_STATUS.delivered,
]

export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const idx = ORDER_STATUS_FLOW.indexOf(status)
  if (idx === -1 || idx === ORDER_STATUS_FLOW.length - 1) return null
  return ORDER_STATUS_FLOW[idx + 1] ?? null
}

export interface Order {
  readonly id: string
  readonly tenantId: string
  readonly tableId: string | null
  readonly tableLabel: string | null
  readonly type: OrderType
  readonly items: readonly OrderItem[]
  readonly subtotal: number
  readonly currency: string
  readonly customerName: string | null
  readonly customerPhone: string | null
  /** Dirección de entrega cuando `type === 'delivery'`; null en otros modos. */
  readonly deliveryAddress: string | null
  readonly note: string | null
  readonly status: OrderStatus
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type NewOrder = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>

export function calculateOrderSubtotal(items: readonly OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
}
