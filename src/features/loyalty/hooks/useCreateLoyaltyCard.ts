import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { LoyaltyCard, NewLoyaltyCard } from '@core/domain/entities/LoyaltyCard'

import { LoyaltyService } from '../services/LoyaltyService'
import { loyaltyQueryKeys } from '../types/loyalty.types'

export function useCreateLoyaltyCard() {
  const queryClient = useQueryClient()

  return useMutation<LoyaltyCard, Error, NewLoyaltyCard>({
    mutationFn: (input) => LoyaltyService.createCard.execute(input),
    onSuccess: (card) => {
      void queryClient.invalidateQueries({
        queryKey: loyaltyQueryKeys.card(card.tenantId, card.customerPhone),
      })
      void queryClient.invalidateQueries({ queryKey: loyaltyQueryKeys.stats(card.tenantId) })
    },
  })
}
