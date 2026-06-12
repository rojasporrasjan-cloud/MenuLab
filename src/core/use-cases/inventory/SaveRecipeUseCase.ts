import type { Ingredient } from '@core/domain/entities/Ingredient'
import type { NewRecipe, RecipeItem } from '@core/domain/entities/Recipe'
import {
  calculateFoodCostAmount,
  calculateFoodCostPercent,
} from '@core/domain/entities/Recipe'
import type { IRecipeRepository } from '@core/domain/repositories/IRecipeRepository'
import { ValidationError } from '@core/errors/ValidationError'

export interface SaveRecipeInput {
  readonly tenantId: string
  readonly dishId: string
  readonly items: readonly RecipeItem[]
  readonly yield: number
  /** Precio de venta del plato — para calcular el food cost %. */
  readonly dishPrice: number
  /** Ingredientes actuales — fuente de los costos por unidad. */
  readonly ingredients: readonly Ingredient[]
}

export class SaveRecipeUseCase {
  private readonly recipeRepository: IRecipeRepository

  constructor(recipeRepository: IRecipeRepository) {
    this.recipeRepository = recipeRepository
  }

  async execute(input: SaveRecipeInput): Promise<NewRecipe> {
    if (!input.tenantId) {
      throw new ValidationError('tenantId', 'La receta necesita un tenant.')
    }
    if (!input.dishId) {
      throw new ValidationError('dishId', 'La receta necesita un plato.')
    }
    if (input.yield <= 0) {
      throw new ValidationError('yield', 'El rendimiento debe ser mayor a cero.')
    }
    if (input.items.some((i) => i.quantity <= 0)) {
      throw new ValidationError('items', 'Las cantidades deben ser mayores a cero.')
    }

    // El food cost siempre se recalcula en el dominio — nunca se confía en la UI.
    const foodCostAmount = calculateFoodCostAmount(input.items, input.ingredients, input.yield)
    const foodCostPercent = calculateFoodCostPercent(foodCostAmount, input.dishPrice)

    const recipe: NewRecipe = {
      id: input.dishId,
      tenantId: input.tenantId,
      dishId: input.dishId,
      items: input.items,
      yield: input.yield,
      foodCostAmount,
      foodCostPercent,
    }

    await this.recipeRepository.upsert(recipe)
    return recipe
  }
}
