import type { LoyaltyCard, NewLoyaltyCard } from '@core/domain/entities/LoyaltyCard'

export interface ILoyaltyCardRepository {
  /** Busca por teléfono normalizado (solo dígitos). null si no existe. */
  findByPhone(tenantId: string, phone: string): Promise<LoyaltyCard | null>
  create(card: NewLoyaltyCard): Promise<LoyaltyCard>
  addStamp(tenantId: string, cardId: string): Promise<void>
  /** Reinicia los sellos y suma una recompensa canjeada. */
  redeemReward(tenantId: string, cardId: string): Promise<void>
  listAll(tenantId: string): Promise<LoyaltyCard[]>
}
