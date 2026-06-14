import type { DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore'
import type { Invoice, InvoiceLine, ComprobanteType, InvoiceStatus } from '@core/domain/entities/Invoice'

type FirestoreDoc = DocumentSnapshot | QueryDocumentSnapshot

function toDate(value: unknown): Date {
  if (value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate() // safe: duck-typed Firestore Timestamp
  }
  return new Date(0)
}

function toLines(raw: unknown): InvoiceLine[] {
  if (!Array.isArray(raw)) return []
  return raw.map((line: Record<string, unknown>) => ({
    lineNumber: Number(line['lineNumber'] ?? 0),
    description: String(line['description'] ?? ''),
    quantity: Number(line['quantity'] ?? 0),
    unitPrice: Number(line['unitPrice'] ?? 0),
    subtotal: Number(line['subtotal'] ?? 0),
    taxRate: Number(line['taxRate'] ?? 0),
    taxAmount: Number(line['taxAmount'] ?? 0),
    total: Number(line['total'] ?? 0),
  }))
}

export class InvoiceMapper {
  static toDomain(doc: FirestoreDoc, tenantId: string): Invoice {
    const data = doc.data() ?? {}
    return {
      id: doc.id,
      tenantId,
      type: (data['type'] as ComprobanteType) ?? '04',
      consecutivo: String(data['consecutivo'] ?? ''),
      clave: String(data['clave'] ?? ''),
      status: (data['status'] as InvoiceStatus) ?? 'draft',
      orderId: typeof data['orderId'] === 'string' ? data['orderId'] : null,
      currency: String(data['currency'] ?? 'CRC'),
      lines: toLines(data['lines']),
      subtotal: Number(data['subtotal'] ?? 0),
      taxTotal: Number(data['taxTotal'] ?? 0),
      total: Number(data['total'] ?? 0),
      customerName: typeof data['customerName'] === 'string' ? data['customerName'] : null,
      customerId: typeof data['customerId'] === 'string' ? data['customerId'] : null,
      issuedAt: toDate(data['issuedAt']),
      createdAt: toDate(data['createdAt']),
      haciendaResponse: typeof data['haciendaResponse'] === 'string' ? data['haciendaResponse'] : null,
    }
  }
}
