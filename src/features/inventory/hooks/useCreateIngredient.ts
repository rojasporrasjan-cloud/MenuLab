import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { NewIngredient } from '@core/domain/entities/Ingredient'

import { InventoryService } from '../services/InventoryService'
import { inventoryQueryKeys } from '../types/inventory.types'

/** Crea un ingrediente e invalida la lista. */
export function useCreateIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: NewIngredient) => InventoryService.createIngredient.execute(input),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.ingredients(created.tenantId),
      })
    },
  })
}
