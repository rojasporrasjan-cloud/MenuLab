import type { LoyaltyCard } from '@core/domain/entities/LoyaltyCard'
import type { ILoyaltyCardRepository } from '@core/domain/repositories/ILoyaltyCardRepository'

export class ListLoyaltyCardsUseCase {
  constructor(private readonly repository: ILoyaltyCardRepository) {}

  async execute(tenantId: string): Promise<LoyaltyCard[]> {
    return this.repository.listAll(tenantId)
  }
}
