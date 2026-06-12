import type { Order } from '@core/domain/entities/Order'
import type { IOrderRepository } from '@core/domain/repositories/IOrderRepository'

export class ListOrdersByDateUseCase {
  private readonly orderRepository: IOrderRepository

  constructor(orderRepository: IOrderRepository) {
    this.orderRepository = orderRepository
  }

  /** `date` en formato YYYY-MM-DD (zona horaria local del dispositivo). */
  async execute(tenantId: string, date: string): Promise<Order[]> {
    return this.orderRepository.listByDate(tenantId, date)
  }
}
