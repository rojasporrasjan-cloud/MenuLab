import type { IngredientUnit } from '@core/domain/entities/Ingredient'

export const inventoryQueryKeys = {
  ingredients: (tenantId: string) => ['inventory', tenantId, 'ingredients'] as const,
  recipes: (tenantId: string) => ['inventory', tenantId, 'recipes'] as const,
  recipe: (tenantId: string, dishId: string) =>
    ['inventory', tenantId, 'recipe', dishId] as const,
  movements: (tenantId: string, ingredientId: string | null) =>
    ['inventory', tenantId, 'movements', ingredientId ?? 'all'] as const,
} as const

export const INGREDIENT_UNIT_LABELS: Record<IngredientUnit, string> = {
  kg: 'kg',
  g: 'g',
  l: 'L',
  ml: 'ml',
  unit: 'unidad',
  portion: 'porción',
}

/** Pestañas de la página de inventario. */
export const INVENTORY_TAB = {
  ingredients: 'ingredients',
  recipes: 'recipes',
  movements: 'movements',
  alerts: 'alerts',
} as const

export type InventoryTab = (typeof INVENTORY_TAB)[keyof typeof INVENTORY_TAB]
