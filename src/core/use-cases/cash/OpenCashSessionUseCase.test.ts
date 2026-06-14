import { describe, it, expect } from 'vitest'
import { OpenCashSessionUseCase } from './OpenCashSessionUseCase'
import { ValidationError } from '@core/errors/ValidationError'
import type { ICashSessionRepository } from '@core/domain/repositories/ICashSessionRepository'
import type { CashSession, CashSessionClose, NewCashSession } from '@core/domain/entities/CashSession'

class FakeCashSessionRepo implements ICashSessionRepository {
  openSession: CashSession | null = null
  createdCount = 0

  async create(session: NewCashSession): Promise<CashSession> {
    this.createdCount++
    const full: CashSession = {
      id: 's1', tenantId: session.tenantId, status: 'open',
      openingAmount: session.openingAmount, openedBy: session.openedBy,
      openedAt: new Date('2026-06-14T08:00:00Z'), closedBy: null, closedAt: null,
      countedCash: null, totals: null, expectedCash: null, difference: null, note: null,
    }
    this.openSession = full
    return full
  }
  async findOpen(): Promise<CashSession | null> { return this.openSession }
  async close(_t: string, _id: string, _d: CashSessionClose): Promise<void> { this.openSession = null }
  async listRecent(): Promise<CashSession[]> { return [] }
}

function openFixture(): CashSession {
  return {
    id: 's0', tenantId: 't1', status: 'open', openingAmount: 5000, openedBy: 'x',
    openedAt: new Date(), closedBy: null, closedAt: null, countedCash: null,
    totals: null, expectedCash: null, difference: null, note: null,
  }
}

describe('OpenCashSessionUseCase', () => {
  it('abre la caja cuando no hay una abierta', async () => {
    const repo = new FakeCashSessionRepo()
    const session = await new OpenCashSessionUseCase(repo).execute({
      tenantId: 't1', openingAmount: 10000, openedBy: 'caja@x.com',
    })
    expect(session.status).toBe('open')
    expect(session.openingAmount).toBe(10000)
    expect(repo.createdCount).toBe(1)
  })

  it('rechaza un fondo negativo', async () => {
    const repo = new FakeCashSessionRepo()
    await expect(
      new OpenCashSessionUseCase(repo).execute({ tenantId: 't1', openingAmount: -1, openedBy: 'x' }),
    ).rejects.toBeInstanceOf(ValidationError)
    expect(repo.createdCount).toBe(0)
  })

  it('rechaza abrir si ya hay una caja abierta', async () => {
    const repo = new FakeCashSessionRepo()
    repo.openSession = openFixture()
    await expect(
      new OpenCashSessionUseCase(repo).execute({ tenantId: 't1', openingAmount: 10000, openedBy: 'x' }),
    ).rejects.toBeInstanceOf(ValidationError)
    expect(repo.createdCount).toBe(0)
  })
})
