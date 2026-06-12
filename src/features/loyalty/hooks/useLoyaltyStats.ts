import { useQuery } from '@tanstack/react-query'

import { LoyaltyService } from '../services/LoyaltyService'
import { loyaltyQueryKeys } from '../types/loyalty.types'

const STATS_STALE_MS = 1000 * 60

export function useLoyaltyStats(tenantId: string) {
  return useQuery({
    queryKey: loyaltyQueryKeys.stats(tenantId),
    queryFn: () => LoyaltyService.getStats.execute(tenantId),
    enabled: Boolean(tenantId),
    staleTime: STATS_STALE_MS,
  })
}
