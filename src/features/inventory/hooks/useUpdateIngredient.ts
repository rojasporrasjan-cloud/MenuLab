import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { IngredientUpdate } from '@core/domain/entities/Ingredient'

import { InventoryService } from '../services/InventoryService'
import { inventoryQueryKeys } from '../types/inventory.types'

interface UpdateIngredientInput {
  readonly tenantId: string
  readonly ingredientId: string
  readonly changes: IngredientUpdate
}

/** Edita los datos maestros de un ingrediente (no el stock). */
export function useUpdateIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, ingredientId, changes }: UpdateIngredientInput) =>
      InventoryService.updateIngredient.execute(tenantId, ingredientId, changes),
    onSuccess: (_, { tenantId }) => {
      void queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.ingredients(tenantId),
      })
    },
  })
}
