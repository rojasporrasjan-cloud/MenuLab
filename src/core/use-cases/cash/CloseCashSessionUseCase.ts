import type { ICashSessionRepository } from '@core/domain/repositories/ICashSessionRepository'
import type { IPaymentRepository } from '@core/domain/repositories/IPaymentRepository'
import type { CashSessionClose } from '@core/domain/entities/CashSession'
import { summarizePayments, calculateExpectedCash, calculateCashDifference } from '@core/domain/entities/CashSession'
import { ValidationError } from '@core/errors/ValidationError'

export interface CloseCashSessionInput {
  readonly tenantId: string
  readonly closedBy: string
  /** Efectivo realmente contado en la caja al cierre. */
  readonly countedCash: number
  readonly note: string | null
}

/**
 * Cierra la caja abierta: agrega los cobros del turno, calcula el efectivo
 * esperado (fondo + cobros en efectivo) y la diferencia contra lo contado.
 */
export class CloseCashSessionUseCase {
  private readonly sessions: ICashSessionRepository
  private readonly payments: IPaymentRepository

  constructor(sessions: ICashSessionRepository, payments: IPaymentRepository) {
    this.sessions = sessions
    this.payments = payments
  }

  async execute(input: CloseCashSessionInput): Promise<CashSessionClose> {
    if (input.countedCash < 0) {
      throw new ValidationError('countedCash', 'El efectivo contado no puede ser negativo.')
    }
    const open = await this.sessions.findOpen(input.tenantId)
    if (!open) {
      throw new ValidationError('session', 'No hay una caja abierta para cerrar.')
    }

    const payments = await this.payments.listBetween(input.tenantId, open.openedAt, new Date())
    const totals = summarizePayments(payments)
    const expectedCash = calculateExpectedCash(open.openingAmount, totals.cash)
    const difference = calculateCashDifference(input.countedCash, expectedCash)

    const close: CashSessionClose = {
      closedBy: input.closedBy,
      countedCash: input.countedCash,
      totals,
      expectedCash,
      difference,
      note: input.note,
    }

    await this.sessions.close(input.tenantId, open.id, close)
    return close
  }
}
