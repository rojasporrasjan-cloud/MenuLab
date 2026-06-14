import type { ICashSessionRepository } from '@core/domain/repositories/ICashSessionRepository'
import type { CashSession, NewCashSession } from '@core/domain/entities/CashSession'
import { ValidationError } from '@core/errors/ValidationError'

/** Abre la caja con un fondo inicial. Falla si ya hay una caja abierta. */
export class OpenCashSessionUseCase {
  private readonly repository: ICashSessionRepository

  constructor(repository: ICashSessionRepository) {
    this.repository = repository
  }

  async execute(input: NewCashSession): Promise<CashSession> {
    if (input.openingAmount < 0) {
      throw new ValidationError('openingAmount', 'El fondo de caja no puede ser negativo.')
    }
    const existing = await this.repository.findOpen(input.tenantId)
    if (existing) {
      throw new ValidationError('session', 'Ya hay una caja abierta. Ciérrala antes de abrir otra.')
    }
    return this.repository.create(input)
  }
}
