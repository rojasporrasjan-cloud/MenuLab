import type { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import type { StockMovement, StockMovementType } from '@core/domain/entities/StockMovement'
import { STOCK_MOVEMENT_TYPE } from '@core/domain/entities/StockMovement'

type FirestoreDoc = DocumentSnapshot | QueryDocumentSnapshot

function toDateOrEpoch(value: unknown): Date {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate() // safe: duck-typed Firestore Timestamp con toDate()
  }
  return new Date(0)
}

function toType(raw: unknown): StockMovementType {
  const types: readonly string[] = Object.values(STOCK_MOVEMENT_TYPE)
  return typeof raw === 'string' && types.includes(raw)
    ? (raw as StockMovementType) // safe: validado contra STOCK_MOVEMENT_TYPE en la línea anterior
    : STOCK_MOVEMENT_TYPE.adjustment
}

export class StockMovementMapper {
  static toDomain(doc: FirestoreDoc, tenantId: string): StockMovement {
    const data = doc.data() ?? {}
    return {
      id: doc.id,
      tenantId,
      ingredientId: String(data['ingredientId'] ?? ''),
      type: toType(data['type']),
      quantity: Number(data['quantity'] ?? 0),
      note: typeof data['note'] === 'string' ? data['note'] : null,
      orderId: typeof data['orderId'] === 'string' ? data['orderId'] : null,
      createdAt: toDateOrEpoch(data['createdAt']),
      createdBy: String(data['createdBy'] ?? ''),
    }
  }
}
