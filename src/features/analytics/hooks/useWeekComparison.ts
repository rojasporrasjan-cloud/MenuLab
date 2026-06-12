import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { isFirebaseConfigured } from '@infrastructure/firebase/config'

import { AnalyticsPageService } from '../services/AnalyticsPageService'
import { analyticsQueryKeys } from '../types/analytics.types'
import type { WeekComparison } from '../types/analytics.types'

const TWO_WEEKS_DAYS = 14
const DAYS_PER_WEEK = 7
const SUMMARIES_STALE_MS = 1000 * 60 * 10

interface WeekComparisonResult extends WeekComparison {
  readonly isLoading: boolean
}

/** Total de eventos por día: esta semana vs. la pasada (14 días de summaries). */
export function useWeekComparison(tenantId: string): WeekComparisonResult {
  const { data: summaries = [], isLoading } = useQuery({
    queryKey: analyticsQueryKeys.summaries(tenantId, TWO_WEEKS_DAYS),
    queryFn: async () => {
      const raw = await AnalyticsPageService.getDailySummaries(tenantId, TWO_WEEKS_DAYS)
      return AnalyticsPageService.fillDateGaps(raw, TWO_WEEKS_DAYS)
    },
    enabled: Boolean(tenantId) && isFirebaseConfigured,
    staleTime: SUMMARIES_STALE_MS,
  })

  const { thisWeek, lastWeek } = useMemo(() => {
    const totals = summaries.map((s) => s.totalEvents)
    return {
      lastWeek: totals.slice(0, DAYS_PER_WEEK),
      thisWeek: totals.slice(DAYS_PER_WEEK, TWO_WEEKS_DAYS),
    }
  }, [summaries])

  return { thisWeek, lastWeek, isLoading }
}
