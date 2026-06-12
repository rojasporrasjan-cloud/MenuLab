import { useQuery } from '@tanstack/react-query'

import { isFirebaseConfigured } from '@infrastructure/firebase/config'
import { LIMITS } from '@shared/constants/limits'

import { InventoryService } from '../services/InventoryService'
import { inventoryQueryKeys } from '../types/inventory.types'

const MOVEMENTS_STALE_MS = 1000 * 30

/** Últimos movimientos de stock; opcionalmente de un ingrediente. */
export function useStockMovements(tenantId: string, ingredientId: string | null) {
  return useQuery({
    queryKey: inventoryQueryKeys.movements(tenantId, ingredientId),
    queryFn: () =>
      InventoryService.listMovements.execute(
        tenantId,
        ingredientId,
        LIMITS.inventory.movementsPageSize,
      ),
    enabled: Boolean(tenantId) && isFirebaseConfigured,
    staleTime: MOVEMENTS_STALE_MS,
  })
}
