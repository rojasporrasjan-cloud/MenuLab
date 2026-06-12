import type { PaymentMethod } from '@core/domain/entities/Payment'
import { COPY } from '@shared/copy/ui.copy'

export const posQueryKeys = {
  session: (tenantId: string) => ['pos', tenantId, 'session'] as const,
} as const

/** Estado visual de una mesa en el grid del POS. */
export const POS_TABLE_STATE = {
  free: 'free',
  occupied: 'occupied',
  pending: 'pending',
} as const

export type POSTableState = (typeof POS_TABLE_STATE)[keyof typeof POS_TABLE_STATE]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: COPY.pos.check.methods.cash,
  card: COPY.pos.check.methods.card,
  sinpe: COPY.pos.check.methods.sinpe,
  yape: COPY.pos.check.methods.yape,
  other: COPY.pos.check.methods.other,
}

/** Sesión activa del POS (persistida en sessionStorage). */
export interface POSSessionData {
  readonly employeeName: string
  readonly employeeId: string | null
  readonly unlockedAt: number
}

/** Línea de la comanda en preparación (antes de enviar a cocina). */
export interface POSCartLine {
  readonly dishId: string
  readonly dishName: string
  readonly unitPrice: number
  readonly currency: string
  readonly quantity: number
}
