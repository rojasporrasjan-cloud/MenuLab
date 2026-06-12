import type { Order } from '@core/domain/entities/Order'
import { ORDER_STATUS } from '@core/domain/entities/Order'
import type { NewPayment, Payment, PaymentMethod } from '@core/domain/entities/Payment'
import { calculateCashChange, PAYMENT_METHOD } from '@core/domain/entities/Payment'
import type { IOrderRepository } from '@core/domain/repositories/IOrderRepository'
import type { IPaymentRepository } from '@core/domain/repositories/IPaymentRepository'
import { ValidationError } from '@core/errors/ValidationError'

export interface CloseCheckInput {
  readonly tenantId: string
  /** Pedidos activos de la mesa que cierra la cuenta. */
  readonly orders: readonly Order[]
  readonly method: PaymentMethod
  readonly reference: string | null
  readonly cashGiven: number | null
  readonly createdBy: string
}

export interface CloseCheckResult {
  readonly payments: readonly Payment[]
  readonly total: number
  readonly cashChange: number | null
}

/**
 * Cierre de cuenta de mesa: registra el pago de cada pedido
 * y los marca como entregados.
 */
export class CloseCheckUseCase {
  private readonly orderRepository: IOrderRepository
  private readonly paymentRepository: IPaymentRepository

  constructor(orderRepository: IOrderRepository, paymentRepository: IPaymentRepository) {
    this.orderRepository = orderRepository
    this.paymentRepository = paymentRepository
  }

  async execute(input: CloseCheckInput): Promise<CloseCheckResult> {
    if (!input.tenantId) {
      throw new ValidationError('tenantId', 'El cierre necesita un tenant.')
    }
    if (input.orders.length === 0) {
      throw new ValidationError('orders', 'No hay pedidos que cobrar.')
    }

    const total = input.orders.reduce((sum, o) => sum + o.subtotal, 0)
    const isCash = input.method === PAYMENT_METHOD.cash

    if (isCash && (input.cashGiven === null || input.cashGiven < total)) {
      throw new ValidationError('cashGiven', 'El efectivo recibido no cubre el total.')
    }

    const cashChange =
      isCash && input.cashGiven !== null ? calculateCashChange(total, input.cashGiven) : null

    const payments: Payment[] = []
    for (const order of input.orders) {
      const payment: NewPayment = {
        tenantId: input.tenantId,
        orderId: order.id,
        amount: order.subtotal,
        currency: order.currency,
        method: input.method,
        reference: input.reference,
        // El efectivo/vuelto se asocia al primer pedido de la cuenta.
        cashGiven: isCash && payments.length === 0 ? input.cashGiven : null,
        cashChange: isCash && payments.length === 0 ? cashChange : null,
        createdBy: input.createdBy,
      }
      payments.push(await this.paymentRepository.create(payment))
      await this.orderRepository.updateStatus(input.tenantId, order.id, ORDER_STATUS.delivered)
    }

    return { payments, total, cashChange }
  }
}
