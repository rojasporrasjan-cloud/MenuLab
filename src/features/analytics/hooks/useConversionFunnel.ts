import { useMemo } from 'react'

import { AnalyticsPageService } from '../services/AnalyticsPageService'
import { FUNNEL_STAGES } from '../types/analytics.types'
import type { DailySummary, FunnelStage } from '../types/analytics.types'

const FULL_PERCENT = 100

/**
 * Funnel de conversión Visitas → Vistas plato → AR → Cart adds → Pedidos,
 * calculado sobre los daily summaries ya cargados (sin queries extra).
 */
export function useConversionFunnel(summaries: DailySummary[]): FunnelStage[] {
  return useMemo(() => {
    let previous: number | null = null

    return FUNNEL_STAGES.map(({ key, label }) => {
      const count = AnalyticsPageService.sumByType(summaries, key)
      const conversionFromPrevious =
        previous === null
          ? FULL_PERCENT
          : previous > 0
            ? (count / previous) * FULL_PERCENT
            : 0
      previous = count
      return { key, label, count, conversionFromPrevious }
    })
  }, [summaries])
}
