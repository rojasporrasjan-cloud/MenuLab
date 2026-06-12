import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { FirestoreLoyaltyCardRepository } from '@infrastructure/repositories/FirestoreLoyaltyCardRepository'
import { FindLoyaltyCardUseCase } from '@core/use-cases/loyalty/FindLoyaltyCardUseCase'
import { CreateLoyaltyCardUseCase } from '@core/use-cases/loyalty/CreateLoyaltyCardUseCase'
import { AddStampUseCase } from '@core/use-cases/loyalty/AddStampUseCase'
import { RedeemRewardUseCase } from '@core/use-cases/loyalty/RedeemRewardUseCase'
import { GetLoyaltyStatsUseCase } from '@core/use-cases/loyalty/GetLoyaltyStatsUseCase'
import type { LoyaltyConfig } from '@core/domain/entities/Tenant'

/**
 * Composition root del feature de lealtad.
 * Singleton a nivel de módulo — mismo patrón que OrderService.
 */
const loyaltyCardRepository = new FirestoreLoyaltyCardRepository()

export const LoyaltyService = {
  findCard: new FindLoyaltyCardUseCase(loyaltyCardRepository),
  createCard: new CreateLoyaltyCardUseCase(loyaltyCardRepository),
  addStamp: new AddStampUseCase(loyaltyCardRepository),
  redeemReward: new RedeemRewardUseCase(loyaltyCardRepository),
  getStats: new GetLoyaltyStatsUseCase(loyaltyCardRepository),

  /** Configuración del programa — vive en el doc del tenant (mismo patrón que SettingsService). */
  async updateConfig(tenantId: string, config: LoyaltyConfig): Promise<void> {
    await updateDoc(doc(db, firestorePaths.tenant(tenantId)), {
      loyaltyConfig: config,
      updatedAt: serverTimestamp(),
    })
  },
} as const
