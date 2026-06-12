export const PAYMENT_METHOD = {
  cash: 'cash',
  card: 'card',
  sinpe: 'sinpe',
  yape: 'yape',
  other: 'other',
} as const

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD]

export interface Payment {
  readonly id: string
  readonly tenantId: string
  readonly orderId: string
  readonly amount: number
  readonly currency: string
  readonly method: PaymentMethod
  /** Referencia externa (voucher, SINPE, etc.), si aplica. */
  readonly reference: string | null
  /** Efectivo recibido (solo method='cash'). */
  readonly cashGiven: number | null
  /** Vuelto entregado (solo method='cash'). */
  readonly cashChange: number | null
  readonly createdAt: Date
  readonly createdBy: string
}

export type NewPayment = Omit<Payment, 'id' | 'createdAt'>

/** Vuelto a entregar en pagos en efectivo (0 si no alcanza o no aplica). */
export function calculateCashChange(amount: number, cashGiven: number): number {
  return Math.max(0, cashGiven - amount)
}
