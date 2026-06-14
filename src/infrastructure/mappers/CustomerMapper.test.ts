import { describe, it, expect } from 'vitest'
import type { DocumentSnapshot } from 'firebase/firestore'
import { CustomerMapper } from './CustomerMapper'

// safe (test): mock mínimo del snapshot — el mapper solo usa doc.id y doc.data().
function snap(id: string, data: Record<string, unknown> | undefined): DocumentSnapshot {
  return { id, data: () => data } as unknown as DocumentSnapshot
}
function ts(date: Date): { toDate: () => Date } {
  return { toDate: () => date }
}

describe('CustomerMapper.toDomain', () => {
  it('mapea un cliente y deriva el ticket promedio', () => {
    const c = CustomerMapper.toDomain(snap('50688887777', {
      phone: '50688887777', name: 'Ana', email: 'ana@x.com',
      totalOrders: 4, totalSpent: 20000, currency: 'CRC',
      tags: ['VIP', 123, 'Frecuente'], note: 'clienta fiel',
      createdAt: ts(new Date('2026-01-01')),
    }), 't1')
    expect(c.id).toBe('50688887777')
    expect(c.phone).toBe('50688887777')
    expect(c.name).toBe('Ana')
    expect(c.averageTicket).toBe(5000) // 20000 / 4
    expect(c.tags).toEqual(['VIP', 'Frecuente']) // filtra valores no-string
  })

  it('ticket promedio 0 cuando no hay pedidos', () => {
    const c = CustomerMapper.toDomain(snap('888', { totalOrders: 0, totalSpent: 0 }), 't1')
    expect(c.averageTicket).toBe(0)
  })

  it('usa el doc.id como teléfono y defaults si faltan campos', () => {
    const c = CustomerMapper.toDomain(snap('999', {}), 't1')
    expect(c.phone).toBe('999')
    expect(c.currency).toBe('CRC')
    expect(c.tags).toEqual([])
    expect(c.createdAt).toEqual(new Date(0))
  })
})
