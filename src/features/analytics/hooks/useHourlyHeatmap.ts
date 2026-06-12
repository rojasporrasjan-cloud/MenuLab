import { useMemo } from 'react'

import type { HourlyHeatmapMatrix } from '../types/analytics.types'
import { useOrdersRange } from './useOrdersRange'

const DAYS_PER_WEEK = 7
const HOURS_PER_DAY = 24

/** getDay() devuelve 0=domingo; la matriz usa 0=lunes. */
function toMondayIndex(jsDay: number): number {
  return (jsDay + 6) % DAYS_PER_WEEK
}

interface HourlyHeatmapResult {
  readonly matrix: HourlyHeatmapMatrix
  readonly maxCount: number
  readonly isLoading: boolean
}

/** Heatmap 7 días × 24 horas con # de pedidos por franja en el rango. */
export function useHourlyHeatmap(tenantId: string, days: number): HourlyHeatmapResult {
  const { data: orders = [], isLoading } = useOrdersRange(tenantId, days)

  const { matrix, maxCount } = useMemo(() => {
    const grid: number[][] = Array.from({ length: DAYS_PER_WEEK }, () =>
      Array.from({ length: HOURS_PER_DAY }, () => 0),
    )
    let max = 0

    for (const order of orders) {
      if (order.status === 'cancelled') continue
      const day = toMondayIndex(order.createdAt.getDay())
      const hour = order.createdAt.getHours()
      const row = grid[day]
      if (!row) continue
      const next = (row[hour] ?? 0) + 1
      row[hour] = next
      if (next > max) max = next
    }

    return { matrix: grid, maxCount: max }
  }, [orders])

  return { matrix, maxCount, isLoading }
}
