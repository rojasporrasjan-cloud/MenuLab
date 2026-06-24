import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DishService } from '../services/DishService'
import { dishQueryKeys } from '../types/dish.types'
import { menuQueryKeys } from '@features/menu/types/menu.types'

interface UseUpdateDishPriceReturn {
  updatePrice: (menuId: string, dishId: string, amount: number) => Promise<void>
  savingId: string | null
}

/** Edición rápida de precio (panel staff) — sin tocar el resto del plato. */
export function useUpdateDishPrice(tenantId: string): UseUpdateDishPriceReturn {
  const queryClient = useQueryClient()
  const [savingId, setSavingId] = useState<string | null>(null)

  const updatePrice = async (menuId: string, dishId: string, amount: number) => {
    setSavingId(dishId)
    try {
      await DishService.updateDishPrice(tenantId, menuId, dishId, amount)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dishQueryKeys.byMenu(tenantId, menuId) }),
        queryClient.invalidateQueries({ queryKey: dishQueryKeys.all(tenantId) }),
        queryClient.invalidateQueries({ queryKey: menuQueryKeys.all }),
      ])
    } finally {
      setSavingId(null)
    }
  }

  return { updatePrice, savingId }
}
