import { useMemo } from 'react'

import type { Ingredient } from '@core/domain/entities/Ingredient'
import { selectLowStockIngredients } from '@core/domain/entities/Ingredient'

import { useIngredients } from './useIngredients'

interface LowStockAlertsResult {
  readonly alerts: Ingredient[]
  readonly count: number
  readonly isLoading: boolean
}

/** Ingredientes bajo el stock mínimo (para banner y badge del sidebar). */
export function useLowStockAlerts(tenantId: string): LowStockAlertsResult {
  const { data: ingredients = [], isLoading } = useIngredients(tenantId)

  const alerts = useMemo(() => selectLowStockIngredients(ingredients), [ingredients])

  return { alerts, count: alerts.length, isLoading }
}
