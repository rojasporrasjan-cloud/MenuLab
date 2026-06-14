import { describe, it, expect } from 'vitest'
import type { DocumentSnapshot } from 'firebase/firestore'
import { OrderMapper } from './OrderMapper'

// safe (test): mock mínimo del snapshot — el mapper solo usa doc.id y doc.data().
function snap(id: string, data: Record<string, unknown> | undefined): DocumentSnapshot {
  return { id, data: () => data } as unknown as DocumentSnapshot
}
function ts(date: Date): { toDate: () => Date } {
  return { toDate: () => date }
}

describe('OrderMapper.toDomain', () => {
  it('mapea un pedido a domicilio con items', () => {
    const o = OrderMapper.toDomain(snap('o1', {
      type: 'delivery', subtotal: 7600, currency: 'CRC', status: 'confirmed',
      customerName: 'Ana', customerPhone: '8888', deliveryAddress: '100m norte',
      items: [
        { dishId: 'd1', dishName: 'Casado', quantity: 2, unitPrice: 3800, variantLabel: 'Pollo', note: 'sin cebolla' },
      ],
      createdAt: ts(new Date('2026-06-14T12:00:00Z')),
      updatedAt: ts(new Date('2026-06-14T12:05:00Z')),
    }), 't1')
    expect(o.id).toBe('o1')
    expect(o.tenantId).toBe('t1')
    expect(o.type).toBe('delivery')
    expect(o.status).toBe('confirmed')
    expect(o.deliveryAddress).toBe('100m norte')
    expect(o.items).toHaveLength(1)
    expect(o.items[0]?.dishName).toBe('Casado')
    expect(o.items[0]?.quantity).toBe(2)
    expect(o.items[0]?.unitPrice).toBe(3800)
  })

  it('usa defaults seguros con data faltante', () => {
    const o = OrderMapper.toDomain(snap('o2', undefined), 't1')
    expect(o.type).toBe('pickup')
    expect(o.status).toBe('pending')
    expect(o.items).toEqual([])
    expect(o.subtotal).toBe(0)
    expect(o.currency).toBe('CRC')
    expect(o.createdAt).toEqual(new Date(0))
  })
})
