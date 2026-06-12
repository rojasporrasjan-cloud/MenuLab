import { doc, getDoc } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { SubscriptionMapper } from '@infrastructure/mappers/SubscriptionMapper'
import type { ISubscriptionRepository } from '@core/domain/repositories/ISubscriptionRepository'
import type { Subscription } from '@core/domain/entities/Subscription'

/**
 * Documento singleton: tenants/{tenantId}/billing/subscription
 * Solo lectura desde el cliente — las escrituras llegan vía Admin SDK
 * (webhooks de Stripe o panel de plataforma).
 */
export class FirestoreSubscriptionRepository implements ISubscriptionRepository {
  async getByTenantId(tenantId: string): Promise<Subscription | null> {
    const snap = await getDoc(doc(db, firestorePaths.subscription(tenantId)))
    if (!snap.exists()) return null
    return SubscriptionMapper.toDomain(snap, tenantId)
  }
}
