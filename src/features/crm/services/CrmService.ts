import { FirestoreCustomerRepository } from '@infrastructure/repositories/FirestoreCustomerRepository'
import { FirestoreOrderRepository } from '@infrastructure/repositories/FirestoreOrderRepository'
import { ListCustomersUseCase } from '@core/use-cases/crm/ListCustomersUseCase'
import { UpdateCustomerNoteUseCase } from '@core/use-cases/crm/UpdateCustomerNoteUseCase'
import { ListCustomerOrdersUseCase } from '@core/use-cases/crm/ListCustomerOrdersUseCase'

/**
 * Composition root del feature CRM.
 * Singleton a nivel de módulo — mismo patrón que OrderService.
 */
const customerRepository = new FirestoreCustomerRepository()
const orderRepository = new FirestoreOrderRepository()

export const CrmService = {
  listCustomers: new ListCustomersUseCase(customerRepository),
  updateCustomerNote: new UpdateCustomerNoteUseCase(customerRepository),
  listCustomerOrders: new ListCustomerOrdersUseCase(orderRepository),
} as const
