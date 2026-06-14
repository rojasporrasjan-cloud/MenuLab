import { describe, it, expect } from 'vitest'
import { RedeemRewardUseCase } from './RedeemRewardUseCase'
import { ValidationError } from '@core/errors/ValidationError'
import type { ILoyaltyCardRepository } from '@core/domain/repositories/ILoyaltyCardRepository'
import type { LoyaltyCard } from '@core/domain/entities/LoyaltyCard'

function card(stamps: number, stampsForReward: number): LoyaltyCard {
  return {
    id: 'c1', tenantId: 't1', customerPhone: '8888', customerName: 'X',
    stamps, stampsForReward, totalStamps: stamps, redeemedRewards: 0,
    createdAt: new Date(), lastActivityAt: new Date(),
  }
}

describe('RedeemRewardUseCase', () => {
  it('canjea cuando la tarjeta tiene los sellos completos', async () => {
    let redeemed: { tenantId: string; cardId: string } | null = null
    const repo = {
      redeemReward: async (tenantId: string, cardId: string) => { redeemed = { tenantId, cardId } },
    } as unknown as ILoyaltyCardRepository
    await new RedeemRewardUseCase(repo).execute(card(10, 10))
    expect(redeemed).toEqual({ tenantId: 't1', cardId: 'c1' })
  })

  it('rechaza el canje si faltan sellos (y no llama al repo)', async () => {
    let called = false
    const repo = { redeemReward: async () => { called = true } } as unknown as ILoyaltyCardRepository
    await expect(new RedeemRewardUseCase(repo).execute(card(9, 10))).rejects.toBeInstanceOf(ValidationError)
    expect(called).toBe(false)
  })
})
