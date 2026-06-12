export const INGREDIENT_UNIT = {
  kg: 'kg',
  g: 'g',
  l: 'l',
  ml: 'ml',
  unit: 'unit',
  portion: 'portion',
} as const

export type IngredientUnit = (typeof INGREDIENT_UNIT)[keyof typeof INGREDIENT_UNIT]

export interface Ingredient {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly unit: IngredientUnit
  readonly currentStock: number
  readonly minimumStock: number
  readonly costPerUnit: number
  readonly currency: string
  readonly category: string | null
  readonly updatedAt: Date
}

export type NewIngredient = Omit<Ingredient, 'id' | 'updatedAt'>

/** Campos editables de un ingrediente (el stock se mueve solo vía movimientos). */
export type IngredientUpdate = Partial<
  Pick<Ingredient, 'name' | 'unit' | 'minimumStock' | 'costPerUnit' | 'category'>
>

/** Un ingrediente está en alerta cuando su stock cae bajo el mínimo. */
export function isLowStock(ingredient: Ingredient): boolean {
  return ingredient.currentStock < ingredient.minimumStock
}

/** Ingredientes bajo mínimo, los más críticos primero (mayor déficit relativo). */
export function selectLowStockIngredients(ingredients: readonly Ingredient[]): Ingredient[] {
  return ingredients
    .filter(isLowStock)
    .sort((a, b) => a.currentStock - a.minimumStock - (b.currentStock - b.minimumStock))
}
