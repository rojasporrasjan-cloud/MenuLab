import { useQuery } from '@tanstack/react-query'

import { isFirebaseConfigured } from '@infrastructure/firebase/config'

import { AnalyticsProService } from '../services/AnalyticsProService'
import { analyticsQueryKeys } from '../types/analytics.types'

const ORDERS_RANGE_STALE_MS = 1000 * 60 * 5

/** Pedidos de los últimos `days` días (compartido por funnel/heatmap/engineering). */
export function useOrdersRange(tenantId: string, days: number) {
  return useQuery({
    queryKey: analyticsQueryKeys.ordersRange(tenantId, days),
    queryFn: () => AnalyticsProService.getOrdersRange(tenantId, days),
    enabled: Boolean(tenantId) && isFirebaseConfigured,
    staleTime: ORDERS_RANGE_STALE_MS,
  })
}
