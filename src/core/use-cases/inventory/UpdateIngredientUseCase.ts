import type { IngredientUpdate } from '@core/domain/entities/Ingredient'
import type { IIngredientRepository } from '@core/domain/repositories/IIngredientRepository'
import { ValidationError } from '@core/errors/ValidationError'

export class UpdateIngredientUseCase {
  private readonly ingredientRepository: IIngredientRepository

  constructor(ingredientRepository: IIngredientRepository) {
    this.ingredientRepository = ingredientRepository
  }

  async execute(tenantId: string, ingredientId: string, changes: IngredientUpdate): Promise<void> {
    if (changes.name !== undefined && !changes.name.trim()) {
      throw new ValidationError('name', 'El ingrediente necesita un nombre.')
    }
    if (changes.minimumStock !== undefined && changes.minimumStock < 0) {
      throw new ValidationError('minimumStock', 'El mínimo no puede ser negativo.')
    }
    if (changes.costPerUnit !== undefined && changes.costPerUnit < 0) {
      throw new ValidationError('costPerUnit', 'El costo no puede ser negativo.')
    }

    await this.ingredientRepository.update(tenantId, ingredientId, changes)
  }
}
