import type { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import type { CashSession, CashSessionStatus, PaymentTotals } from '@core/domain/entities/CashSession'
import { CASH_SESSION_STATUS } from '@core/domain/entities/CashSession'

type FirestoreDoc = DocumentSnapshot | QueryDocumentSnapshot

function toDate(value: unknown): Date {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate() // safe: duck-typed Firestore Timestamp
  }
  return new Date(0)
}

function toDateOrNull(value: unknown): Date | null {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate() // safe: duck-typed Firestore Timestamp
  }
  return null
}

function toNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function toTotals(raw: unknown): PaymentTotals | null {
  if (typeof raw !== 'object' || raw === null) return null
  const t = raw as Record<string, unknown>
  return {
    cash: Number(t['cash'] ?? 0),
    card: Number(t['card'] ?? 0),
    sinpe: Number(t['sinpe'] ?? 0),
    yape: Number(t['yape'] ?? 0),
    other: Number(t['other'] ?? 0),
    total: Number(t['total'] ?? 0),
    count: Number(t['count'] ?? 0),
  }
}

export class CashSessionMapper {
  static toDomain(doc: FirestoreDoc, tenantId: string): CashSession {
    const data = doc.data() ?? {}
    return {
      id: doc.id,
      tenantId,
      status: (data['status'] === CASH_SESSION_STATUS.closed
        ? CASH_SESSION_STATUS.closed
        : CASH_SESSION_STATUS.open) as CashSessionStatus,
      openingAmount: Number(data['openingAmount'] ?? 0),
      openedBy: String(data['openedBy'] ?? ''),
      openedAt: toDate(data['openedAt']),
      closedBy: typeof data['closedBy'] === 'string' ? data['closedBy'] : null,
      closedAt: toDateOrNull(data['closedAt']),
      countedCash: toNumberOrNull(data['countedCash']),
      totals: toTotals(data['totals']),
      expectedCash: toNumberOrNull(data['expectedCash']),
      difference: toNumberOrNull(data['difference']),
      note: typeof data['note'] === 'string' ? data['note'] : null,
    }
  }
}
