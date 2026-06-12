import type { Order } from '@core/domain/entities/Order'
import { STOCK_MOVEMENT_TYPE } from '@core/domain/entities/StockMovement'
import type { IRecipeRepository } from '@core/domain/repositories/IRecipeRepository'
import type { IStockMovementRepository } from '@core/domain/repositories/IStockMovementRepository'

const AUTO_DEDUCT_ACTOR = 'auto-deduct'

/**
 * Descuenta del inventario los insumos de un pedido según las recetas.
 * Genera un movimiento 'sale' por ingrediente (cantidades agregadas).
 * Los platos sin receta se ignoran silenciosamente.
 */
export class DeductStockForOrderUseCase {
  private readonly recipeRepository: IRecipeRepository
  private readonly stockMovementRepository: IStockMovementRepository

  constructor(
    recipeRepository: IRecipeRepository,
    stockMovementRepository: IStockMovementRepository,
  ) {
    this.recipeRepository = recipeRepository
    this.stockMovementRepository = stockMovementRepository
  }

  async execute(order: Order): Promise<void> {
    // Total a descontar por ingrediente (sumando todos los platos del pedido).
    const totals = new Map<string, number>()

    for (const item of order.items) {
      const recipe = await this.recipeRepository.get(order.tenantId, item.dishId)
      if (!recipe) continue
      for (const recipeItem of recipe.items) {
        const current = totals.get(recipeItem.ingredientId) ?? 0
        totals.set(recipeItem.ingredientId, current + recipeItem.quantity * item.quantity)
      }
    }

    for (const [ingredientId, quantity] of totals) {
      await this.stockMovementRepository.create({
        tenantId: order.tenantId,
        ingredientId,
        type: STOCK_MOVEMENT_TYPE.sale,
        quantity: -quantity,
        note: null,
        orderId: order.id,
        createdBy: AUTO_DEDUCT_ACTOR,
      })
    }
  }
}
