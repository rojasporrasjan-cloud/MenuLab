import type { NewOrder, Order } from '@core/domain/entities/Order'
import { calculateOrderSubtotal } from '@core/domain/entities/Order'
import { normalizeCustomerPhone } from '@core/domain/entities/Customer'
import type { IOrderRepository } from '@core/domain/repositories/IOrderRepository'
import type { ICustomerRepository } from '@core/domain/repositories/ICustomerRepository'
import { ValidationError } from '@core/errors/ValidationError'

export class CreateOrderUseCase {
  private readonly orderRepository: IOrderRepository
  private readonly customerRepository: ICustomerRepository | null

  constructor(orderRepository: IOrderRepository, customerRepository?: ICustomerRepository) {
    this.orderRepository = orderRepository
    this.customerRepository = customerRepository ?? null
  }

  async execute(input: NewOrder): Promise<Order> {
    if (!input.tenantId) {
      throw new ValidationError('tenantId', 'El pedido necesita un tenant.')
    }
    if (input.items.length === 0) {
      throw new ValidationError('items', 'El pedido debe tener al menos un plato.')
    }
    if (input.items.some((i) => i.quantity <= 0)) {
      throw new ValidationError('items', 'Las cantidades deben ser mayores a cero.')
    }

    // El subtotal siempre se recalcula en el dominio — nunca se confía en la UI.
    const subtotal = calculateOrderSubtotal(input.items)

    const order = await this.orderRepository.create({ ...input, subtotal })

    // CRM: upsert del cliente por teléfono — fire-and-forget, nunca rompe el pedido.
    if (this.customerRepository && order.customerPhone) {
      const phone = normalizeCustomerPhone(order.customerPhone)
      if (phone) {
        try {
          await this.customerRepository.upsertFromOrder({
            tenantId: order.tenantId,
            phone,
            name: order.customerName ?? '',
            subtotal: order.subtotal,
            currency: order.currency,
          })
        } catch (error) {
          // El perfil CRM es secundario: si falla, el pedido ya está creado.
          void error
        }
      }
    }

    return order
  }
}
