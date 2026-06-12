import { useMemo } from 'react'

import type { Order } from '@core/domain/entities/Order'
import { useOrdersByDate } from '@features/cart'
import { usePendingReservations } from '@features/reservations'

const FULL_PERCENT = 100

function dateISO(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

function summarize(orders: readonly Order[]): { count: number; revenue: number } {
  const valid = orders.filter((o) => o.status !== 'cancelled')
  return {
    count: valid.length,
    revenue: valid.reduce((sum, o) => sum + o.subtotal, 0),
  }
}

export interface TodayMetrics {
  readonly ordersToday: number
  readonly ordersTrendPercent: number
  readonly ordersTrendPositive: boolean
  readonly revenueToday: number
  readonly averageTicket: number
  readonly pendingReservations: number
  readonly currency: string
  readonly isLoading: boolean
}

/** Métricas del día para el dashboard: pedidos (vs ayer), ingresos, ticket, reservas. */
export function useTodayMetrics(tenantId: string): TodayMetrics {
  const { data: todayOrders = [], isLoading: isLoadingToday } = useOrdersByDate(
    tenantId,
    dateISO(0),
  )
  const { data: yesterdayOrders = [], isLoading: isLoadingYesterday } = useOrdersByDate(
    tenantId,
    dateISO(1),
  )
  const { count: pendingReservations } = usePendingReservations(tenantId)

  return useMemo(() => {
    const today = summarize(todayOrders)
    const yesterday = summarize(yesterdayOrders)

    const ordersTrendPercent =
      yesterday.count > 0
        ? ((today.count - yesterday.count) / yesterday.count) * FULL_PERCENT
        : today.count > 0
          ? FULL_PERCENT
          : 0

    return {
      ordersToday: today.count,
      ordersTrendPercent: Math.abs(ordersTrendPercent),
      ordersTrendPositive: ordersTrendPercent >= 0,
      revenueToday: today.revenue,
      averageTicket: today.count > 0 ? today.revenue / today.count : 0,
      pendingReservations,
      currency: todayOrders[0]?.currency ?? 'CRC',
      isLoading: isLoadingToday || isLoadingYesterday,
    }
  }, [todayOrders, yesterdayOrders, pendingReservations, isLoadingToday, isLoadingYesterday])
}
