import type { Order } from '@core/domain/entities/Order'
import { normalizeCustomerPhone } from '@core/domain/entities/Customer'
import type { IOrderRepository } from '@core/domain/repositories/IOrderRepository'

/**
 * Historial de pedidos de un cliente del CRM.
 * El id del cliente es su teléfono normalizado; los pedidos guardan el teléfono
 * tal como lo escribió el cliente, así que se normaliza antes de comparar.
 * Se escanea una ventana de pedidos recientes (sin índice adicional).
 */
export class ListCustomerOrdersUseCase {
  private readonly orderRepository: IOrderRepository

  constructor(orderRepository: IOrderRepository) {
    this.orderRepository = orderRepository
  }

  async execute(tenantId: string, customerPhone: string, scanWindow: number): Promise<Order[]> {
    const normalized = normalizeCustomerPhone(customerPhone)
    if (!normalized) return []

    const recent = await this.orderRepository.listRecent(tenantId, scanWindow)
    return recent.filter(
      (order) =>
        order.customerPhone !== null &&
        normalizeCustomerPhone(order.customerPhone) === normalized,
    )
  }
}
