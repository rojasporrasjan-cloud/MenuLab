import type { LoyaltyCard } from '@core/domain/entities/LoyaltyCard'
import { normalizeLoyaltyPhone } from '@core/domain/entities/LoyaltyCard'
import type { ILoyaltyCardRepository } from '@core/domain/repositories/ILoyaltyCardRepository'

export class FindLoyaltyCardUseCase {
  private readonly loyaltyCardRepository: ILoyaltyCardRepository

  constructor(loyaltyCardRepository: ILoyaltyCardRepository) {
    this.loyaltyCardRepository = loyaltyCardRepository
  }

  async execute(tenantId: string, phone: string): Promise<LoyaltyCard | null> {
    const normalized = normalizeLoyaltyPhone(phone)
    if (!normalized) return null
    return this.loyaltyCardRepository.findByPhone(tenantId, normalized)
  }
}
