import type { Ingredient } from '@core/domain/entities/Ingredient'
import type { IIngredientRepository } from '@core/domain/repositories/IIngredientRepository'

export class ListIngredientsUseCase {
  private readonly ingredientRepository: IIngredientRepository

  constructor(ingredientRepository: IIngredientRepository) {
    this.ingredientRepository = ingredientRepository
  }

  async execute(tenantId: string): Promise<Ingredient[]> {
    return this.ingredientRepository.list(tenantId)
  }
}
