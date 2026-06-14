import type { NewPayment, Payment } from '../entities/Payment'

export interface IPaymentRepository {
  create(payment: NewPayment): Promise<Payment>
  /** Cobros creados en el rango [start, end] — para arqueo de caja. */
  listBetween(tenantId: string, start: Date, end: Date): Promise<Payment[]>
}
