import type { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import type { LoyaltyCard } from '@core/domain/entities/LoyaltyCard'

type FirestoreDoc = DocumentSnapshot | QueryDocumentSnapshot

function toDate(value: unknown): Date {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate() // safe: duck-typed Firestore Timestamp con toDate()
  }
  return new Date(0)
}

export class LoyaltyCardMapper {
  static toDomain(doc: FirestoreDoc, tenantId: string): LoyaltyCard {
    const data = doc.data() ?? {}
    return {
      id: doc.id,
      tenantId,
      customerPhone: String(data['customerPhone'] ?? ''),
      customerName: String(data['customerName'] ?? ''),
      stamps: Number(data['stamps'] ?? 0),
      stampsForReward: Number(data['stampsForReward'] ?? 10),
      totalStamps: Number(data['totalStamps'] ?? 0),
      redeemedRewards: Number(data['redeemedRewards'] ?? 0),
      createdAt: toDate(data['createdAt']),
      lastActivityAt: toDate(data['lastActivityAt']),
    }
  }
}
