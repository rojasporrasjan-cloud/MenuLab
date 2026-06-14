import { FirestoreOrderRepository } from '@infrastructure/repositories/FirestoreOrderRepository'
import { FirestoreCustomerRepository } from '@infrastructure/repositories/FirestoreCustomerRepository'
import { CreateOrderUseCase } from '@core/use-cases/order/CreateOrderUseCase'
import { ListActiveOrdersUseCase } from '@core/use-cases/order/ListActiveOrdersUseCase'
import { ListOrdersByDateUseCase } from '@core/use-cases/order/ListOrdersByDateUseCase'
import { ListOrdersBetweenUseCase } from '@core/use-cases/order/ListOrdersBetweenUseCase'
import { UpdateOrderStatusUseCase } from '@core/use-cases/order/UpdateOrderStatusUseCase'

/**
 * Composition root del feature de pedidos.
 * Singleton a nivel de módulo — mismo patrón que MenuService.
 * El CustomerRepository alimenta el CRM en cada pedido con teléfono.
 */
const orderRepository = new FirestoreOrderRepository()
const customerRepository = new FirestoreCustomerRepository()

export const OrderService = {
  createOrder: new CreateOrderUseCase(orderRepository, customerRepository),
  listActiveOrders: new ListActiveOrdersUseCase(orderRepository),
  listOrdersByDate: new ListOrdersByDateUseCase(orderRepository),
  listOrdersBetween: new ListOrdersBetweenUseCase(orderRepository),
  updateOrderStatus: new UpdateOrderStatusUseCase(orderRepository),
} as const
