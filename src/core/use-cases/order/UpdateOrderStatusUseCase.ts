import type { OrderStatus } from '@core/domain/entities/Order'
import type { IOrderRepository } from '@core/domain/repositories/IOrderRepository'

export class UpdateOrderStatusUseCase {
  private readonly orderRepository: IOrderRepository

  constructor(orderRepository: IOrderRepository) {
    this.orderRepository = orderRepository
  }

  async execute(tenantId: string, orderId: string, status: OrderStatus): Promise<void> {
    await this.orderRepository.updateStatus(tenantId, orderId, status)
  }
}
