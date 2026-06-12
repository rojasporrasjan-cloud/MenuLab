import type { NewRecipe, Recipe } from '../entities/Recipe'

export interface IRecipeRepository {
  /** Receta de un plato (id del doc = dishId). null si no existe. */
  get(tenantId: string, dishId: string): Promise<Recipe | null>
  list(tenantId: string): Promise<Recipe[]>
  upsert(recipe: NewRecipe): Promise<void>
}
