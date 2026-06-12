import type { NewStockMovement } from '@core/domain/entities/StockMovement'
import { normalizeMovementQuantity } from '@core/domain/entities/StockMovement'
import type { IStockMovementRepository } from '@core/domain/repositories/IStockMovementRepository'
import { ValidationError } from '@core/errors/ValidationError'

export class RegisterStockMovementUseCase {
  private readonly stockMovementRepository: IStockMovementRepository

  constructor(stockMovementRepository: IStockMovementRepository) {
    this.stockMovementRepository = stockMovementRepository
  }

  async execute(input: NewStockMovement): Promise<void> {
    if (!input.tenantId) {
      throw new ValidationError('tenantId', 'El movimiento necesita un tenant.')
    }
    if (!input.ingredientId) {
      throw new ValidationError('ingredientId', 'El movimiento necesita un ingrediente.')
    }
    if (input.quantity === 0) {
      throw new ValidationError('quantity', 'La cantidad no puede ser cero.')
    }

    await this.stockMovementRepository.create({
      ...input,
      quantity: normalizeMovementQuantity(input.type, input.quantity),
    })
  }
}
