import type { ICashSessionRepository } from '@core/domain/repositories/ICashSessionRepository'
import type { CashSession } from '@core/domain/entities/CashSession'

/** Devuelve la caja abierta del tenant (o null si está cerrada). */
export class GetOpenCashSessionUseCase {
  private readonly repository: ICashSessionRepository

  constructor(repository: ICashSessionRepository) {
    this.repository = repository
  }

  execute(tenantId: string): Promise<CashSession | null> {
    return this.repository.findOpen(tenantId)
  }
}
