import type { Recipe } from '@core/domain/entities/Recipe'
import type { IRecipeRepository } from '@core/domain/repositories/IRecipeRepository'

export class ListRecipesUseCase {
  private readonly recipeRepository: IRecipeRepository

  constructor(recipeRepository: IRecipeRepository) {
    this.recipeRepository = recipeRepository
  }

  async execute(tenantId: string): Promise<Recipe[]> {
    return this.recipeRepository.list(tenantId)
  }
}
