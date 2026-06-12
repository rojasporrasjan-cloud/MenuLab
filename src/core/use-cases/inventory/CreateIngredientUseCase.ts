import type { Ingredient, NewIngredient } from '@core/domain/entities/Ingredient'
import type { IIngredientRepository } from '@core/domain/repositories/IIngredientRepository'
import { ValidationError } from '@core/errors/ValidationError'

export class CreateIngredientUseCase {
  private readonly ingredientRepository: IIngredientRepository

  constructor(ingredientRepository: IIngredientRepository) {
    this.ingredientRepository = ingredientRepository
  }

  async execute(input: NewIngredient): Promise<Ingredient> {
    if (!input.tenantId) {
      throw new ValidationError('tenantId', 'El ingrediente necesita un tenant.')
    }
    if (!input.name.trim()) {
      throw new ValidationError('name', 'El ingrediente necesita un nombre.')
    }
    if (input.currentStock < 0 || input.minimumStock < 0) {
      throw new ValidationError('stock', 'El stock no puede ser negativo.')
    }
    if (input.costPerUnit < 0) {
      throw new ValidationError('costPerUnit', 'El costo no puede ser negativo.')
    }

    return this.ingredientRepository.create({ ...input, name: input.name.trim() })
  }
}
