import type { NewPayment, Payment } from '../entities/Payment'

export interface IPaymentRepository {
  create(payment: NewPayment): Promise<Payment>
}
