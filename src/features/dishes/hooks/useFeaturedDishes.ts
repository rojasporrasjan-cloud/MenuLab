import { useMemo } from 'react'

import { selectFeaturedDishes } from '@core/domain/entities/Dish'
import { LIMITS } from '@shared/constants/limits'

import { useAdminDishes } from './useAdminDishes'

/**
 * Platos destacados de un menú (ordenados por featuredRank, máx. 6).
 * `featuredCount` incluye también los que exceden el límite — para avisos.
 */
export function useFeaturedDishes(tenantId: string, menuId: string | null) {
  const { data: dishes = [], isLoading } = useAdminDishes(tenantId, menuId)

  const featured = useMemo(
    () => selectFeaturedDishes(dishes, LIMITS.featured.maxFeaturedDishes),
    [dishes],
  )
  const featuredCount = useMemo(() => dishes.filter((d) => d.featured).length, [dishes])

  return { featured, featuredCount, isLoading }
}
