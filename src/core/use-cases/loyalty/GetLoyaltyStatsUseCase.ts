import type { LoyaltyStats } from '@core/domain/entities/LoyaltyCard'
import { calculateLoyaltyStats } from '@core/domain/entities/LoyaltyCard'
import type { ILoyaltyCardRepository } from '@core/domain/repositories/ILoyaltyCardRepository'

export class GetLoyaltyStatsUseCase {
  private readonly loyaltyCardRepository: ILoyaltyCardRepository

  constructor(loyaltyCardRepository: ILoyaltyCardRepository) {
    this.loyaltyCardRepository = loyaltyCardRepository
  }

  async execute(tenantId: string): Promise<LoyaltyStats> {
    const cards = await this.loyaltyCardRepository.listAll(tenantId)
    return calculateLoyaltyStats(cards, new Date())
  }
}
