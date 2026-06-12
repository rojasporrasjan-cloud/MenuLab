import { canRedeemReward } from '@core/domain/entities/LoyaltyCard'
import type { LoyaltyCard } from '@core/domain/entities/LoyaltyCard'
import type { ILoyaltyCardRepository } from '@core/domain/repositories/ILoyaltyCardRepository'
import { ValidationError } from '@core/errors/ValidationError'

export class RedeemRewardUseCase {
  private readonly loyaltyCardRepository: ILoyaltyCardRepository

  constructor(loyaltyCardRepository: ILoyaltyCardRepository) {
    this.loyaltyCardRepository = loyaltyCardRepository
  }

  async execute(card: LoyaltyCard): Promise<void> {
    if (!canRedeemReward(card)) {
      throw new ValidationError('stamps', 'La tarjeta aún no completa los sellos necesarios.')
    }
    await this.loyaltyCardRepository.redeemReward(card.tenantId, card.id)
  }
}
