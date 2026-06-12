import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { LoyaltyCard } from '@core/domain/entities/LoyaltyCard'

import { LoyaltyService } from '../services/LoyaltyService'
import { loyaltyQueryKeys } from '../types/loyalty.types'

export function useAddStamp() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, LoyaltyCard>({
    mutationFn: (card) => LoyaltyService.addStamp.execute(card.tenantId, card.id),
    onSuccess: (_data, card) => {
      void queryClient.invalidateQueries({
        queryKey: loyaltyQueryKeys.card(card.tenantId, card.customerPhone),
      })
      void queryClient.invalidateQueries({ queryKey: loyaltyQueryKeys.stats(card.tenantId) })
    },
  })
}
