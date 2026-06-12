import type { Ingredient, IngredientUpdate, NewIngredient } from '../entities/Ingredient'

export interface IIngredientRepository {
  list(tenantId: string): Promise<Ingredient[]>
  create(ingredient: NewIngredient): Promise<Ingredient>
  update(tenantId: string, ingredientId: string, changes: IngredientUpdate): Promise<void>
}
