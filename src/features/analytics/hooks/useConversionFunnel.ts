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
    // Conteo por etapa primero; luego la conversión se calcula contra la etapa
    // anterior por índice (sin variable mutable de acumulación durante el render).
    const counts = FUNNEL_STAGES.map(({ key, label }) => ({
      key,
      label,
      count: AnalyticsPageService.sumByType(summaries, key),
    }))

    return counts.map((stage, index) => {
      const previous = index === 0 ? null : counts[index - 1]?.count ?? null
      const conversionFromPrevious =
        previous === null
          ? FULL_PERCENT
          : previous > 0
            ? (stage.count / previous) * FULL_PERCENT
            : 0
      return { ...stage, conversionFromPrevious }
    })
  }, [summaries])
}
