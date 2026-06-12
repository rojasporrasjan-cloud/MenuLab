import { FirestoreOrderRepository } from '@infrastructure/repositories/FirestoreOrderRepository'
import { FirestorePaymentRepository } from '@infrastructure/repositories/FirestorePaymentRepository'
import { CloseCheckUseCase } from '@core/use-cases/pos/CloseCheckUseCase'

/**
 * Composition root del feature POS.
 * Singleton a nivel de módulo — mismo patrón que OrderService.
 */
const orderRepository = new FirestoreOrderRepository()
const paymentRepository = new FirestorePaymentRepository()

export const POSService = {
  closeCheck: new CloseCheckUseCase(orderRepository, paymentRepository),
} as const
