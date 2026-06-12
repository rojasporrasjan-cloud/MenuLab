import type { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import type { Customer } from '@core/domain/entities/Customer'

type FirestoreDoc = DocumentSnapshot | QueryDocumentSnapshot

function toDateOrNull(value: unknown): Date | null {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate() // safe: duck-typed Firestore Timestamp con toDate()
  }
  return null
}

function toStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((t): t is string => typeof t === 'string')
}

export class CustomerMapper {
  static toDomain(doc: FirestoreDoc, tenantId: string): Customer {
    const data = doc.data() ?? {}
    const totalOrders = Number(data['totalOrders'] ?? 0)
    const totalSpent = Number(data['totalSpent'] ?? 0)

    return {
      id: doc.id,
      tenantId,
      phone: String(data['phone'] ?? doc.id),
      name: String(data['name'] ?? ''),
      email: typeof data['email'] === 'string' ? data['email'] : null,
      totalOrders,
      totalSpent,
      currency: String(data['currency'] ?? 'CRC'),
      // El ticket promedio se deriva siempre — un solo lugar de verdad.
      averageTicket: totalOrders > 0 ? totalSpent / totalOrders : 0,
      lastOrderAt: toDateOrNull(data['lastOrderAt']),
      firstOrderAt: toDateOrNull(data['firstOrderAt']),
      tags: toStringArray(data['tags']),
      note: typeof data['note'] === 'string' ? data['note'] : null,
      createdAt: toDateOrNull(data['createdAt']) ?? new Date(0),
    }
  }
}
