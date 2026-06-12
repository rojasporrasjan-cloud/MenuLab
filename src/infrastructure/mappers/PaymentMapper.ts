import type { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import type { Payment, PaymentMethod } from '@core/domain/entities/Payment'
import { PAYMENT_METHOD } from '@core/domain/entities/Payment'

type FirestoreDoc = DocumentSnapshot | QueryDocumentSnapshot

function toDateOrEpoch(value: unknown): Date {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate() // safe: duck-typed Firestore Timestamp con toDate()
  }
  return new Date(0)
}

function toMethod(raw: unknown): PaymentMethod {
  const methods: readonly string[] = Object.values(PAYMENT_METHOD)
  return typeof raw === 'string' && methods.includes(raw)
    ? (raw as PaymentMethod) // safe: validado contra PAYMENT_METHOD en la línea anterior
    : PAYMENT_METHOD.other
}

function toNumberOrNull(raw: unknown): number | null {
  return typeof raw === 'number' ? raw : null
}

export class PaymentMapper {
  static toDomain(doc: FirestoreDoc, tenantId: string): Payment {
    const data = doc.data() ?? {}
    return {
      id: doc.id,
      tenantId,
      orderId: String(data['orderId'] ?? ''),
      amount: Number(data['amount'] ?? 0),
      currency: String(data['currency'] ?? 'CRC'),
      method: toMethod(data['method']),
      reference: typeof data['reference'] === 'string' ? data['reference'] : null,
      cashGiven: toNumberOrNull(data['cashGiven']),
      cashChange: toNumberOrNull(data['cashChange']),
      createdAt: toDateOrEpoch(data['createdAt']),
      createdBy: String(data['createdBy'] ?? ''),
    }
  }
}
