import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { SaveRecipeInput } from '@core/use-cases/inventory/SaveRecipeUseCase'

import { InventoryService } from '../services/InventoryService'
import { inventoryQueryKeys } from '../types/inventory.types'

/** Guarda la receta de un plato (recalcula food cost en el dominio). */
export function useSaveRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SaveRecipeInput) => InventoryService.saveRecipe.execute(input),
    onSuccess: (recipe) => {
      void queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.recipe(recipe.tenantId, recipe.dishId),
      })
      void queryClient.invalidateQueries({
        queryKey: inventoryQueryKeys.recipes(recipe.tenantId),
      })
    },
  })
}
