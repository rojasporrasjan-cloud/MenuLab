import type { Recipe } from '@core/domain/entities/Recipe'
import type { IRecipeRepository } from '@core/domain/repositories/IRecipeRepository'

export class GetRecipeUseCase {
  private readonly recipeRepository: IRecipeRepository

  constructor(recipeRepository: IRecipeRepository) {
    this.recipeRepository = recipeRepository
  }

  async execute(tenantId: string, dishId: string): Promise<Recipe | null> {
    return this.recipeRepository.get(tenantId, dishId)
  }
}
