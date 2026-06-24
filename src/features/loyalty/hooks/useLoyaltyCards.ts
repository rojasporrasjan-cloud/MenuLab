import { useQuery } from '@tanstack/react-query'
import type { LoyaltyCard } from '@core/domain/entities/LoyaltyCard'
import { LoyaltyService } from '../services/LoyaltyService'
import { loyaltyQueryKeys } from '../types/loyalty.types'

export function useLoyaltyCards(tenantId: string | undefined) {
  return useQuery<LoyaltyCard[]>({
    queryKey: loyaltyQueryKeys.all(tenantId!),
    queryFn: () => LoyaltyService.listCards.execute(tenantId!),
    enabled: Boolean(tenantId),
  })
}
