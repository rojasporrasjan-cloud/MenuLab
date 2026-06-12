export interface LoyaltyCard {
  readonly id: string
  readonly tenantId: string
  readonly customerPhone: string
  readonly customerName: string
  /** Sellos acumulados hacia la próxima recompensa. */
  readonly stamps: number
  /** Meta de sellos vigente para esta tarjeta. */
  readonly stampsForReward: number
  /** Sellos históricos (nunca se reinicia). */
  readonly totalStamps: number
  readonly redeemedRewards: number
  readonly createdAt: Date
  readonly lastActivityAt: Date
}

export interface NewLoyaltyCard {
  readonly tenantId: string
  readonly customerPhone: string
  readonly customerName: string
  readonly stampsForReward: number
}

export function canRedeemReward(card: LoyaltyCard): boolean {
  return card.stamps >= card.stampsForReward
}

/** Normaliza un teléfono a solo dígitos — clave de búsqueda de la tarjeta. */
export function normalizeLoyaltyPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

export interface LoyaltyStats {
  readonly totalCards: number
  readonly newThisMonth: number
  readonly activeThisMonth: number
  readonly totalRewardsRedeemed: number
}

function isSameMonth(date: Date, reference: Date): boolean {
  return (
    date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
  )
}

export function calculateLoyaltyStats(cards: readonly LoyaltyCard[], now: Date): LoyaltyStats {
  return {
    totalCards: cards.length,
    newThisMonth: cards.filter((c) => isSameMonth(c.createdAt, now)).length,
    activeThisMonth: cards.filter((c) => isSameMonth(c.lastActivityAt, now)).length,
    totalRewardsRedeemed: cards.reduce((sum, c) => sum + c.redeemedRewards, 0),
  }
}
