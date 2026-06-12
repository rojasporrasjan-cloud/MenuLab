import type { Ingredient, IngredientUnit } from './Ingredient'

export interface RecipeItem {
  readonly ingredientId: string
  readonly ingredientName: string
  readonly quantity: number
  readonly unit: IngredientUnit
}

/** Receta de un plato. El id del documento es el dishId (1:1). */
export interface Recipe {
  readonly id: string
  readonly tenantId: string
  readonly dishId: string
  readonly items: readonly RecipeItem[]
  /** Porciones que rinde la receta (divide el costo). */
  readonly yield: number
  /** Costo total de insumos por porción. */
  readonly foodCostAmount: number
  /** % del precio de venta que representa el costo (0-100). */
  readonly foodCostPercent: number
  readonly updatedAt: Date
}

export type NewRecipe = Omit<Recipe, 'updatedAt'>

/** Costo de insumos por porción según los costos actuales de los ingredientes. */
export function calculateFoodCostAmount(
  items: readonly RecipeItem[],
  ingredients: readonly Ingredient[],
  recipeYield: number,
): number {
  const costIndex = new Map(ingredients.map((i) => [i.id, i.costPerUnit]))
  const total = items.reduce(
    (sum, item) => sum + (costIndex.get(item.ingredientId) ?? 0) * item.quantity,
    0,
  )
  const portions = recipeYield > 0 ? recipeYield : 1
  return total / portions
}

/** % de food cost contra el precio de venta del plato (0 si no hay precio). */
export function calculateFoodCostPercent(foodCostAmount: number, dishPrice: number): number {
  if (dishPrice <= 0) return 0
  return (foodCostAmount / dishPrice) * 100
}
