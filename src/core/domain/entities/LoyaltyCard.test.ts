import { describe, it, expect } from 'vitest'
import { canRedeemReward, normalizeLoyaltyPhone, calculateLoyaltyStats } from './LoyaltyCard'
import type { LoyaltyCard } from './LoyaltyCard'

function card(p: Partial<LoyaltyCard>): LoyaltyCard {
  return {
    id: 'c', tenantId: 't1', customerPhone: '8888', customerName: 'X',
    stamps: 0, stampsForReward: 10, totalStamps: 0, redeemedRewards: 0,
    createdAt: new Date(2026, 5, 1), lastActivityAt: new Date(2026, 5, 1),
    ...p,
  }
}

describe('canRedeemReward', () => {
  it('true cuando los sellos alcanzan la meta', () => {
    expect(canRedeemReward(card({ stamps: 10, stampsForReward: 10 }))).toBe(true)
  })
  it('false cuando faltan sellos', () => {
    expect(canRedeemReward(card({ stamps: 9, stampsForReward: 10 }))).toBe(false)
  })
})

describe('normalizeLoyaltyPhone', () => {
  it('deja solo dígitos', () => {
    expect(normalizeLoyaltyPhone('+506 8888-7777')).toBe('50688887777')
  })
})

describe('calculateLoyaltyStats', () => {
  const now = new Date(2026, 5, 14) // junio 2026

  it('cuenta tarjetas, nuevas/activas del mes y recompensas', () => {
    const cards = [
      card({ createdAt: new Date(2026, 5, 5), lastActivityAt: new Date(2026, 5, 10), redeemedRewards: 2 }),
      card({ createdAt: new Date(2026, 4, 15), lastActivityAt: new Date(2026, 5, 12), redeemedRewards: 1 }),
      card({ createdAt: new Date(2026, 3, 10), lastActivityAt: new Date(2026, 3, 10), redeemedRewards: 0 }),
    ]
    const stats = calculateLoyaltyStats(cards, now)
    expect(stats.totalCards).toBe(3)
    expect(stats.newThisMonth).toBe(1)     // solo la creada en junio
    expect(stats.activeThisMonth).toBe(2)  // dos con actividad en junio
    expect(stats.totalRewardsRedeemed).toBe(3)
  })

  it('cero en todo sin tarjetas', () => {
    expect(calculateLoyaltyStats([], now)).toEqual({
      totalCards: 0, newThisMonth: 0, activeThisMonth: 0, totalRewardsRedeemed: 0,
    })
  })
})
