import type { LoyaltyCard, NewLoyaltyCard } from '@core/domain/entities/LoyaltyCard'
import { normalizeLoyaltyPhone } from '@core/domain/entities/LoyaltyCard'
import type { ILoyaltyCardRepository } from '@core/domain/repositories/ILoyaltyCardRepository'
import { ValidationError } from '@core/errors/ValidationError'

export class CreateLoyaltyCardUseCase {
  private readonly loyaltyCardRepository: ILoyaltyCardRepository

  constructor(loyaltyCardRepository: ILoyaltyCardRepository) {
    this.loyaltyCardRepository = loyaltyCardRepository
  }

  async execute(input: NewLoyaltyCard): Promise<LoyaltyCard> {
    const normalized = normalizeLoyaltyPhone(input.customerPhone)
    if (!normalized) {
      throw new ValidationError('customerPhone', 'El teléfono es obligatorio.')
    }
    if (!input.customerName.trim()) {
      throw new ValidationError('customerName', 'El nombre es obligatorio.')
    }
    if (input.stampsForReward < 1) {
      throw new ValidationError('stampsForReward', 'La meta de sellos debe ser al menos 1.')
    }

    const existing = await this.loyaltyCardRepository.findByPhone(input.tenantId, normalized)
    if (existing) return existing

    return this.loyaltyCardRepository.create({
      ...input,
      customerPhone: normalized,
      customerName: input.customerName.trim(),
    })
  }
}
