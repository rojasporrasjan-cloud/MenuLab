import type { ILoyaltyCardRepository } from '@core/domain/repositories/ILoyaltyCardRepository'

export class AddStampUseCase {
  private readonly loyaltyCardRepository: ILoyaltyCardRepository

  constructor(loyaltyCardRepository: ILoyaltyCardRepository) {
    this.loyaltyCardRepository = loyaltyCardRepository
  }

  async execute(tenantId: string, cardId: string): Promise<void> {
    await this.loyaltyCardRepository.addStamp(tenantId, cardId)
  }
}
