import { useQuery } from '@tanstack/react-query'

import { isFirebaseConfigured } from '@infrastructure/firebase/config'

import { InventoryService } from '../services/InventoryService'
import { inventoryQueryKeys } from '../types/inventory.types'

const INGREDIENTS_STALE_MS = 1000 * 30

/** Ingredientes del tenant ordenados por nombre. */
export function useIngredients(tenantId: string) {
  return useQuery({
    queryKey: inventoryQueryKeys.ingredients(tenantId),
    queryFn: () => InventoryService.listIngredients.execute(tenantId),
    enabled: Boolean(tenantId) && isFirebaseConfigured,
    staleTime: INGREDIENTS_STALE_MS,
  })
}
