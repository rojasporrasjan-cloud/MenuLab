import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { isFirebaseConfigured } from '@infrastructure/firebase/config'

import { AnalyticsProService } from '../services/AnalyticsProService'
import { analyticsQueryKeys } from '../types/analytics.types'
import type { MenuEngineeringPoint, MenuQuadrant } from '../types/analytics.types'
import { useOrdersRange } from './useOrdersRange'

const INDEX_STALE_MS = 1000 * 60 * 5

function median(values: readonly number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const lower = sorted[mid - 1]
  const upper = sorted[mid]
  if (sorted.length % 2 === 0 && lower !== undefined && upper !== undefined) {
    return (lower + upper) / 2
  }
  return upper ?? 0
}

function quadrantOf(
  popularity: number,
  profitability: number,
  popularityCut: number,
  profitabilityCut: number,
): MenuQuadrant {
  const popular = popularity >= popularityCut
  const profitable = profitability >= profitabilityCut
  if (popular && profitable) return 'star'
  if (popular && !profitable) return 'cow'
  if (!popular && profitable) return 'question'
  return 'dog'
}

interface MenuEngineeringResult {
  readonly points: MenuEngineeringPoint[]
  readonly popularityCut: number
  readonly profitabilityCut: number
  readonly isLoading: boolean
}

/**
 * Matriz popularidad (unidades pedidas) × rentabilidad (margen por unidad:
 * precio − food cost si hay receta; si no, precio). Cortes por mediana.
 */
export function useMenuEngineering(tenantId: string, days: number): MenuEngineeringResult {
  const { data: orders = [], isLoading: isLoadingOrders } = useOrdersRange(tenantId, days)

  const { data: dishIndex, isLoading: isLoadingIndex } = useQuery({
    queryKey: analyticsQueryKeys.dishIndex(tenantId),
    queryFn: () => AnalyticsProService.getDishIndex(tenantId),
    enabled: Boolean(tenantId) && isFirebaseConfigured,
    staleTime: INDEX_STALE_MS,
  })

  const { data: foodCostIndex } = useQuery({
    queryKey: analyticsQueryKeys.recipes(tenantId),
    queryFn: () => AnalyticsProService.getFoodCostIndex(tenantId),
    enabled: Boolean(tenantId) && isFirebaseConfigured,
    staleTime: INDEX_STALE_MS,
  })

  const result = useMemo(() => {
    const unitsByDish = new Map<string, number>()
    for (const order of orders) {
      if (order.status === 'cancelled') continue
      for (const item of order.items) {
        unitsByDish.set(item.dishId, (unitsByDish.get(item.dishId) ?? 0) + item.quantity)
      }
    }

    const raw = [...unitsByDish.entries()].map(([dishId, popularity]) => {
      const dish = dishIndex?.get(dishId)
      const price = dish?.price ?? 0
      const foodCost = foodCostIndex?.get(dishId)
      const profitability = foodCost !== undefined ? price - foodCost : price
      return { dishId, dishName: dish?.name ?? dishId.slice(0, 8), popularity, profitability }
    })

    const popularityCut = median(raw.map((p) => p.popularity))
    const profitabilityCut = median(raw.map((p) => p.profitability))

    const points: MenuEngineeringPoint[] = raw.map((p) => ({
      ...p,
      quadrant: quadrantOf(p.popularity, p.profitability, popularityCut, profitabilityCut),
    }))

    return { points, popularityCut, profitabilityCut }
  }, [orders, dishIndex, foodCostIndex])

  return { ...result, isLoading: isLoadingOrders || isLoadingIndex }
}
