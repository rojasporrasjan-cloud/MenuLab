import type { ICashSessionRepository } from '@core/domain/repositories/ICashSessionRepository'
import type { CashSession } from '@core/domain/entities/CashSession'

/** Historial de cierres de caja (más recientes primero). */
export class ListCashSessionsUseCase {
  private readonly repository: ICashSessionRepository

  constructor(repository: ICashSessionRepository) {
    this.repository = repository
  }

  execute(tenantId: string, max: number): Promise<CashSession[]> {
    return this.repository.listRecent(tenantId, max)
  }
}
