import type { DocumentSnapshot, Timestamp } from 'firebase/firestore'
import type { PlanId, Subscription, SubscriptionStatus } from '@core/domain/entities/Subscription'

function toDateOrNull(value: unknown): Date | null {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate() // safe: duck-typed Firestore Timestamp con toDate()
  }
  return null
}

export class SubscriptionMapper {
  static toDomain(doc: DocumentSnapshot, tenantId: string): Subscription {
    const data = doc.data() ?? {}
    return {
      tenantId,
      plan: (data['plan'] as PlanId) ?? 'free', // safe: escrito siempre desde tipos del dominio / Admin SDK
      status: (data['status'] as SubscriptionStatus) ?? 'active', // safe: escrito siempre desde tipos del dominio
      trialEndsAt: toDateOrNull(data['trialEndsAt']),
      currentPeriodEnd: toDateOrNull(data['currentPeriodEnd']),
      stripeCustomerId: typeof data['stripeCustomerId'] === 'string' ? data['stripeCustomerId'] : null,
      stripeSubscriptionId:
        typeof data['stripeSubscriptionId'] === 'string' ? data['stripeSubscriptionId'] : null,
      updatedAt: toDateOrNull(data['updatedAt']) ?? new Date(0),
    }
  }
}
