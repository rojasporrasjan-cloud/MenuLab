import { useQuery } from '@tanstack/react-query'

import { isFirebaseConfigured } from '@infrastructure/firebase/config'

import { InventoryService } from '../services/InventoryService'
import { inventoryQueryKeys } from '../types/inventory.types'

const RECIPE_STALE_MS = 1000 * 60

/** Receta de un plato (null si aún no tiene). */
export function useRecipe(tenantId: string, dishId: string | null) {
  return useQuery({
    queryKey: inventoryQueryKeys.recipe(tenantId, dishId ?? ''),
    queryFn: () => InventoryService.getRecipe.execute(tenantId, dishId ?? ''),
    enabled: Boolean(tenantId) && Boolean(dishId) && isFirebaseConfigured,
    staleTime: RECIPE_STALE_MS,
  })
}
