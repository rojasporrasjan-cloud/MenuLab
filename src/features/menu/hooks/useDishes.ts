import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { DishMapper } from '@infrastructure/mappers/DishMapper'
import { CategoryMapper } from '@infrastructure/mappers/CategoryMapper'
import type { Dish } from '@core/domain/entities/Dish'
import type { Category } from '@core/domain/entities/Category'
import { MenuService } from '../services/MenuService'
import { menuQueryKeys } from '../types/menu.types'
import type { DishesGroupedByCategory } from '../types/menu.types'

/**
 * Fetches all available dishes for a menu, grouped and ordered by category.
 * Escucha cambios en tiempo real (dishes y categories) para actualizar el menú al instante.
 */
export function useActiveDishes(
  tenantId: string,
  menuId: string,
  categoryOrder: string[],
): {
  groups: DishesGroupedByCategory[]
  isLoading: boolean
  isError: boolean
} {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: menuQueryKeys.dishes(tenantId, menuId),
    queryFn: () => MenuService.getActiveDishes.execute(tenantId, menuId, categoryOrder),
    enabled: Boolean(tenantId) && Boolean(menuId),
    staleTime: Infinity, // never stale, managed by onSnapshot
  })

  useEffect(() => {
    if (!tenantId || !menuId) return

    let categories: Category[] | null = null
    let dishes: Dish[] | null = null

    const updateQuery = () => {
      if (!categories || !dishes) return
      
      const categoryMap = new Map(categories.map((c) => [c.id, c]))
      const dishesByCategory = new Map<string, Dish[]>()

      for (const dish of dishes) {
        const existing = dishesByCategory.get(dish.categoryId) ?? []
        existing.push(dish)
        dishesByCategory.set(dish.categoryId, existing)
      }

      const orderedIds = categoryOrder.length > 0 ? categoryOrder : categories.map((c) => c.id)

      const groups = orderedIds
        .filter((id) => dishesByCategory.has(id) && categoryMap.has(id))
        .map((id) => ({
          category: categoryMap.get(id)!,
          dishes: dishesByCategory.get(id)!
        }))

      queryClient.setQueryData(menuQueryKeys.dishes(tenantId, menuId), groups)
    }

    const unsubCats = onSnapshot(collection(db, firestorePaths.categories(tenantId, menuId)), (snap) => {
      categories = snap.docs.map((d) => CategoryMapper.toDomain(d, tenantId, menuId))
      updateQuery()
    })

    const qDishes = query(collection(db, firestorePaths.dishes(tenantId, menuId)), orderBy('sortOrder', 'asc'))
    const unsubDishes = onSnapshot(qDishes, (snap) => {
      dishes = snap.docs
        .map((d) => DishMapper.toDomain(d, tenantId, menuId))
        .filter(d => d.status === 'available')
      updateQuery()
    })

    return () => {
      unsubCats()
      unsubDishes()
    }
  }, [tenantId, menuId, categoryOrder.join(','), queryClient])

  return {
    groups: data ?? [],
    isLoading,
    isError,
  }
}
