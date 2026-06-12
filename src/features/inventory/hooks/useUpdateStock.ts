import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { NewStockMovement } from '@core/domain/entities/StockMovement'

import { InventoryService } from '../services/InventoryService'
import { inventoryQueryKeys } from '../types/inventory.types'

/**
 * Registra un movimiento de stock (compra/venta/merma/ajuste) e invalida
 * ingredientes y movimientos. El ajuste del stock es atómico en el repo.
 */
export function useUpdateStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: NewStockMovement) => InventoryService.registerMovement.execute(input),
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.ingredients(input.tenantId),
      })
      void queryClient.invalidateQueries({
        queryKey: ['inventory', input.tenantId, 'movements'],
      })
    },
  })
}
