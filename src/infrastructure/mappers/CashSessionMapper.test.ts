import { describe, it, expect } from 'vitest'
import type { DocumentSnapshot } from 'firebase/firestore'
import { CashSessionMapper } from './CashSessionMapper'

// safe (test): mock mínimo del snapshot — el mapper solo usa doc.id y doc.data().
function snap(id: string, data: Record<string, unknown> | undefined): DocumentSnapshot {
  return { id, data: () => data } as unknown as DocumentSnapshot
}
function ts(date: Date): { toDate: () => Date } {
  return { toDate: () => date }
}

describe('CashSessionMapper.toDomain', () => {
  it('mapea una sesión abierta', () => {
    const session = CashSessionMapper.toDomain(snap('s1', {
      status: 'open', openingAmount: 10000, openedBy: 'caja@x.com',
      openedAt: ts(new Date('2026-06-14T08:00:00Z')),
    }), 't1')
    expect(session.id).toBe('s1')
    expect(session.tenantId).toBe('t1')
    expect(session.status).toBe('open')
    expect(session.openingAmount).toBe(10000)
    expect(session.openedBy).toBe('caja@x.com')
    expect(session.openedAt).toEqual(new Date('2026-06-14T08:00:00Z'))
    expect(session.closedAt).toBeNull()
    expect(session.totals).toBeNull()
  })

  it('mapea una sesión cerrada con totales y diferencia', () => {
    const session = CashSessionMapper.toDomain(snap('s2', {
      status: 'closed', openingAmount: 5000, openedBy: 'x',
      openedAt: ts(new Date('2026-06-14T08:00:00Z')),
      closedAt: ts(new Date('2026-06-14T16:00:00Z')), closedBy: 'y',
      countedCash: 17500, expectedCash: 17000, difference: 500,
      totals: { cash: 7000, card: 3000, sinpe: 0, yape: 0, other: 0, total: 10000, count: 3 },
      note: 'turno tarde',
    }), 't1')
    expect(session.status).toBe('closed')
    expect(session.countedCash).toBe(17500)
    expect(session.difference).toBe(500)
    expect(session.totals?.total).toBe(10000)
    expect(session.totals?.count).toBe(3)
    expect(session.note).toBe('turno tarde')
  })

  it('usa defaults seguros con data faltante', () => {
    const session = CashSessionMapper.toDomain(snap('s3', undefined), 't1')
    expect(session.status).toBe('open')
    expect(session.openingAmount).toBe(0)
    expect(session.openedAt).toEqual(new Date(0))
    expect(session.totals).toBeNull()
    expect(session.note).toBeNull()
  })
})
