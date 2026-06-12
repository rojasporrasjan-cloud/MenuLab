import type { Order } from '@core/domain/entities/Order'
import type { IOrderRepository } from '@core/domain/repositories/IOrderRepository'

export class ListOrdersBetweenUseCase {
  private readonly orderRepository: IOrderRepository

  constructor(orderRepository: IOrderRepository) {
    this.orderRepository = orderRepository
  }

  async execute(tenantId: string, start: Date, end: Date): Promise<Order[]> {
    return this.orderRepository.listBetween(tenantId, start, end)
  }
}
