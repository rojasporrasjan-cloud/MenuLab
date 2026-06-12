import type { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import type {
  Reservation,
  ReservationSource,
  ReservationStatus,
} from '@core/domain/entities/Reservation'

type FirestoreDoc = DocumentSnapshot | QueryDocumentSnapshot

function toDate(value: unknown): Date {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate() // safe: duck-typed Firestore Timestamp con toDate()
  }
  return new Date(0)
}

export class ReservationMapper {
  static toDomain(doc: FirestoreDoc, tenantId: string): Reservation {
    const data = doc.data() ?? {}
    return {
      id: doc.id,
      tenantId,
      customerName: String(data['customerName'] ?? ''),
      customerPhone: String(data['customerPhone'] ?? ''),
      partySize: Number(data['partySize'] ?? 1),
      date: String(data['date'] ?? ''),
      time: String(data['time'] ?? ''),
      note: typeof data['note'] === 'string' ? data['note'] : null,
      status: (data['status'] as ReservationStatus) ?? 'pending', // safe: escrito siempre desde tipos del dominio
      source: (data['source'] as ReservationSource) ?? 'qr', // safe: escrito siempre desde tipos del dominio
      createdAt: toDate(data['createdAt']),
    }
  }
}
