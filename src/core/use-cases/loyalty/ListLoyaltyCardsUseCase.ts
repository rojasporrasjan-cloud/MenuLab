import type { LoyaltyCard } from '@core/domain/entities/LoyaltyCard'
import type { ILoyaltyCardRepository } from '@core/domain/repositories/ILoyaltyCardRepository'

export class ListLoyaltyCardsUseCase {
  private readonly repository: ILoyaltyCardRepository
  constructor(repository: ILoyaltyCardRepository) {
    this.repository = repository
  }

  async execute(tenantId: string): Promise<LoyaltyCard[]> {
    return this.repository.listAll(tenantId)
  }
}
