import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Order } from '@core/domain/entities/Order'
import { OrderService } from '@features/cart/services/OrderService'
import { orderQueryKeys } from '@features/cart/types/cart.types'

export type DateRangePreset = 'today' | 'week' | 'month' | 'custom'

const FULL_PERCENT = 100

function summarize(orders: readonly Order[]): { count: number; revenue: number } {
  const valid = orders.filter((o) => o.status !== 'cancelled')
  return {
    count: valid.length,
    revenue: valid.reduce((sum, o) => sum + o.total, 0),
  }
}

export interface DateRangeMetrics {
  readonly ordersCount: number
  readonly ordersTrendPercent: number
  readonly ordersTrendPositive: boolean
  readonly revenueTotal: number
  readonly averageTicket: number
  readonly currency: string
  readonly isLoading: boolean
}

// Helpers for date calculations
function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function getEndOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export function getDateRangeBounds(
  preset: DateRangePreset,
  customStart?: Date,
  customEnd?: Date
): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date()
  
  if (preset === 'today') {
    const start = getStartOfDay(now)
    const end = getEndOfDay(now)
    const prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - 1)
    const prevEnd = new Date(end)
    prevEnd.setDate(prevEnd.getDate() - 1)
    return { start, end, prevStart, prevEnd }
  }
  
  if (preset === 'week') {
    // Current week (starting Monday)
    const day = now.getDay() || 7 // Make Sunday (0) -> 7
    const start = getStartOfDay(now)
    start.setDate(start.getDate() - day + 1)
    const end = getEndOfDay(now)
    
    // Previous week
    const prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - 7)
    const prevEnd = new Date(end)
    prevEnd.setDate(prevEnd.getDate() - 7)
    return { start, end, prevStart, prevEnd }
  }
  
  if (preset === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const end = getEndOfDay(now)
    
    // Previous month
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999) // Last day of prev month
    return { start, end, prevStart, prevEnd }
  }
  
  // Custom
  const start = customStart ? getStartOfDay(customStart) : getStartOfDay(now)
  const end = customEnd ? getEndOfDay(customEnd) : getEndOfDay(now)
  const diffTime = end.getTime() - start.getTime()
  const prevStart = new Date(start.getTime() - diffTime)
  const prevEnd = new Date(start) // Prev period ends right before current starts
  
  return { start, end, prevStart, prevEnd }
}

function formatDateKey(date: Date) {
  return date.toISOString()
}

export function useDateRangeMetrics(
  tenantId: string, 
  preset: DateRangePreset,
  customStart?: Date,
  customEnd?: Date
): DateRangeMetrics {
  
  const { start, end, prevStart, prevEnd } = useMemo(
    () => getDateRangeBounds(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  )

  const { data: currentOrders = [], isLoading: isLoadingCurrent } = useQuery({
    queryKey: orderQueryKeys.between(tenantId, formatDateKey(start), formatDateKey(end)),
    queryFn: () => OrderService.listOrdersBetween.execute(tenantId, start, end),
    enabled: Boolean(tenantId),
    staleTime: 1000 * 60,
  })

  const { data: prevOrders = [], isLoading: isLoadingPrev } = useQuery({
    queryKey: orderQueryKeys.between(tenantId, formatDateKey(prevStart), formatDateKey(prevEnd)),
    queryFn: () => OrderService.listOrdersBetween.execute(tenantId, prevStart, prevEnd),
    enabled: Boolean(tenantId),
    staleTime: 1000 * 60,
  })

  return useMemo(() => {
    const current = summarize(currentOrders)
    const prev = summarize(prevOrders)

    const ordersTrendPercent =
      prev.count > 0
        ? ((current.count - prev.count) / prev.count) * FULL_PERCENT
        : current.count > 0
          ? FULL_PERCENT
          : 0

    return {
      ordersCount: current.count,
      ordersTrendPercent: Math.abs(ordersTrendPercent),
      ordersTrendPositive: ordersTrendPercent >= 0,
      revenueTotal: current.revenue,
      averageTicket: current.count > 0 ? current.revenue / current.count : 0,
      currency: currentOrders[0]?.currency ?? 'CRC',
      isLoading: isLoadingCurrent || isLoadingPrev,
    }
  }, [currentOrders, prevOrders, isLoadingCurrent, isLoadingPrev])
}
