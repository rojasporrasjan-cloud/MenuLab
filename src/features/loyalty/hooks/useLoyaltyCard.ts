import { useQuery } from '@tanstack/react-query'

import { normalizeLoyaltyPhone } from '@core/domain/entities/LoyaltyCard'

import { LoyaltyService } from '../services/LoyaltyService'
import { loyaltyQueryKeys } from '../types/loyalty.types'

/** Busca la tarjeta de sellos por teléfono (normalizado a dígitos). */
export function useLoyaltyCard(tenantId: string, phone: string) {
  const normalized = normalizeLoyaltyPhone(phone)
  return useQuery({
    queryKey: loyaltyQueryKeys.card(tenantId, normalized),
    queryFn: () => LoyaltyService.findCard.execute(tenantId, normalized),
    enabled: Boolean(tenantId) && normalized.length > 0,
  })
}
