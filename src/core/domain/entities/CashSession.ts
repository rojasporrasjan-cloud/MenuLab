import type { Payment, PaymentMethod } from './Payment'

export const CASH_SESSION_STATUS = {
  open: 'open',
  closed: 'closed',
} as const

export type CashSessionStatus = (typeof CASH_SESSION_STATUS)[keyof typeof CASH_SESSION_STATUS]

/** Desglose de cobros por método + total y cantidad. */
export interface PaymentTotals {
  readonly cash: number
  readonly card: number
  readonly sinpe: number
  readonly yape: number
  readonly other: number
  readonly total: number
  readonly count: number
}

/**
 * Sesión de caja (arqueo): se abre con un fondo inicial y se cierra contando
 * el efectivo. El sistema compara lo esperado (fondo + cobros en efectivo) con
 * lo contado y muestra la diferencia (sobrante/faltante).
 */
export interface CashSession {
  readonly id: string
  readonly tenantId: string
  readonly status: CashSessionStatus
  /** Fondo de caja con el que se abrió. */
  readonly openingAmount: number
  readonly openedBy: string
  readonly openedAt: Date
  readonly closedBy: string | null
  readonly closedAt: Date | null
  /** Efectivo realmente contado al cierre. */
  readonly countedCash: number | null
  /** Snapshot de cobros del turno (calculado al cerrar). */
  readonly totals: PaymentTotals | null
  /** Efectivo esperado = fondo + cobros en efectivo. */
  readonly expectedCash: number | null
  /** countedCash − expectedCash. Positivo = sobrante; negativo = faltante. */
  readonly difference: number | null
  readonly note: string | null
}

export interface NewCashSession {
  readonly tenantId: string
  readonly openingAmount: number
  readonly openedBy: string
}

/** Datos del cierre que se persisten sobre una sesión abierta. */
export interface CashSessionClose {
  readonly closedBy: string
  readonly countedCash: number
  readonly totals: PaymentTotals
  readonly expectedCash: number
  readonly difference: number
  readonly note: string | null
}

/** Agrupa cobros por método de pago. */
export function summarizePayments(payments: readonly Payment[]): PaymentTotals {
  const byMethod: Record<PaymentMethod, number> = { cash: 0, card: 0, sinpe: 0, yape: 0, other: 0 }
  let total = 0
  for (const payment of payments) {
    byMethod[payment.method] += payment.amount
    total += payment.amount
  }
  return { ...byMethod, total, count: payments.length }
}

export function calculateExpectedCash(openingAmount: number, cashTotal: number): number {
  return openingAmount + cashTotal
}

export function calculateCashDifference(countedCash: number, expectedCash: number): number {
  return countedCash - expectedCash
}
