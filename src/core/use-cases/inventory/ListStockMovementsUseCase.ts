import type { StockMovement } from '@core/domain/entities/StockMovement'
import type { IStockMovementRepository } from '@core/domain/repositories/IStockMovementRepository'

export class ListStockMovementsUseCase {
  private readonly stockMovementRepository: IStockMovementRepository

  constructor(stockMovementRepository: IStockMovementRepository) {
    this.stockMovementRepository = stockMovementRepository
  }

  async execute(
    tenantId: string,
    ingredientId: string | null,
    max: number,
  ): Promise<StockMovement[]> {
    return this.stockMovementRepository.list(tenantId, ingredientId, max)
  }
}
