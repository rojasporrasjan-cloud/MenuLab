import type { Order } from '@core/domain/entities/Order'
import type { IOrderRepository } from '@core/domain/repositories/IOrderRepository'

export class ListActiveOrdersUseCase {
  private readonly orderRepository: IOrderRepository

  constructor(orderRepository: IOrderRepository) {
    this.orderRepository = orderRepository
  }

  async execute(tenantId: string): Promise<Order[]> {
    return this.orderRepository.listActive(tenantId)
  }
}
