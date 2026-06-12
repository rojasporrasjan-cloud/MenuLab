import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { LoyaltyCardMapper } from '@infrastructure/mappers/LoyaltyCardMapper'
import type { ILoyaltyCardRepository } from '@core/domain/repositories/ILoyaltyCardRepository'
import type { LoyaltyCard, NewLoyaltyCard } from '@core/domain/entities/LoyaltyCard'
import { NotFoundError } from '@core/errors/NotFoundError'

/**
 * Colección: tenants/{tenantId}/loyalty_cards
 * El teléfono se guarda normalizado (solo dígitos) — clave de búsqueda única.
 * Multi-tenant: el aislamiento lo garantiza el path de la subcolección.
 */
export class FirestoreLoyaltyCardRepository implements ILoyaltyCardRepository {
  async findByPhone(tenantId: string, phone: string): Promise<LoyaltyCard | null> {
    const q = query(
      collection(db, firestorePaths.loyaltyCards(tenantId)),
      where('customerPhone', '==', phone),
      limit(1),
    )
    const snap = await getDocs(q)
    const first = snap.docs[0]
    if (!first) return null
    return LoyaltyCardMapper.toDomain(first, tenantId)
  }

  async create(card: NewLoyaltyCard): Promise<LoyaltyCard> {
    const ref = await addDoc(collection(db, firestorePaths.loyaltyCards(card.tenantId)), {
      ...card,
      stamps: 0,
      totalStamps: 0,
      redeemedRewards: 0,
      createdAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
    })
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new NotFoundError('LoyaltyCard', ref.id)
    return LoyaltyCardMapper.toDomain(snap, card.tenantId)
  }

  async addStamp(tenantId: string, cardId: string): Promise<void> {
    await updateDoc(doc(db, firestorePaths.loyaltyCard(tenantId, cardId)), {
      stamps: increment(1),
      totalStamps: increment(1),
      lastActivityAt: serverTimestamp(),
    })
  }

  async redeemReward(tenantId: string, cardId: string): Promise<void> {
    await updateDoc(doc(db, firestorePaths.loyaltyCard(tenantId, cardId)), {
      stamps: 0,
      redeemedRewards: increment(1),
      lastActivityAt: serverTimestamp(),
    })
  }

  async listAll(tenantId: string): Promise<LoyaltyCard[]> {
    const snap = await getDocs(collection(db, firestorePaths.loyaltyCards(tenantId)))
    return snap.docs.map((d) => LoyaltyCardMapper.toDomain(d, tenantId))
  }
}
