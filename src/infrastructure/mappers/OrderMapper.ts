import type { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import type { Order, OrderItem, OrderStatus, OrderType } from '@core/domain/entities/Order'

type FirestoreDoc = DocumentSnapshot | QueryDocumentSnapshot

function toDate(value: unknown): Date {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate() // safe: duck-typed Firestore Timestamp con toDate()
  }
  return new Date(0)
}

function toItems(raw: unknown): OrderItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item: Record<string, unknown>) => ({
    dishId: String(item['dishId'] ?? ''),
    dishName: String(item['dishName'] ?? ''),
    quantity: Number(item['quantity'] ?? 0),
    unitPrice: Number(item['unitPrice'] ?? 0),
    variantLabel: typeof item['variantLabel'] === 'string' ? item['variantLabel'] : null,
    note: typeof item['note'] === 'string' ? item['note'] : null,
  }))
}

export class OrderMapper {
  static toDomain(doc: FirestoreDoc, tenantId: string): Order {
    const data = doc.data() ?? {}
    return {
      id: doc.id,
      tenantId,
      tableId: typeof data['tableId'] === 'string' ? data['tableId'] : null,
      tableLabel: typeof data['tableLabel'] === 'string' ? data['tableLabel'] : null,
      type: (data['type'] as OrderType) ?? 'pickup', // safe: validado por reglas + escritura tipada
      items: toItems(data['items']),
      subtotal: Number(data['subtotal'] ?? 0),
      deliveryCost: Number(data['deliveryCost'] ?? 0),
      taxAmount: Number(data['taxAmount'] ?? 0),
      total: Number(data['total'] ?? data['subtotal'] ?? 0), // fallback al subtotal viejo
      currency: String(data['currency'] ?? 'CRC'),
      customerName: typeof data['customerName'] === 'string' ? data['customerName'] : null,
      customerPhone: typeof data['customerPhone'] === 'string' ? data['customerPhone'] : null,
      deliveryAddress: typeof data['deliveryAddress'] === 'string' ? data['deliveryAddress'] : null,
      note: typeof data['note'] === 'string' ? data['note'] : null,
      status: (data['status'] as OrderStatus) ?? 'pending', // safe: escrito siempre desde tipos del dominio
      paymentStatus: (data['paymentStatus'] as any) === 'paid' ? 'paid' : 'pending',
      createdAt: toDate(data['createdAt']),
      updatedAt: toDate(data['updatedAt']),
    }
  }
}
