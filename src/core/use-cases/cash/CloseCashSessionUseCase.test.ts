import { describe, it, expect } from 'vitest'
import { CloseCashSessionUseCase } from './CloseCashSessionUseCase'
import { ValidationError } from '@core/errors/ValidationError'
import type { ICashSessionRepository } from '@core/domain/repositories/ICashSessionRepository'
import type { IPaymentRepository } from '@core/domain/repositories/IPaymentRepository'
import type { CashSession, CashSessionClose, NewCashSession } from '@core/domain/entities/CashSession'
import type { Payment, PaymentMethod, NewPayment } from '@core/domain/entities/Payment'

class FakeCashSessionRepo implements ICashSessionRepository {
  openSession: CashSession | null = null
  closedWith: CashSessionClose | null = null
  async create(_s: NewCashSession): Promise<CashSession> { throw new Error('not used') }
  async findOpen(): Promise<CashSession | null> { return this.openSession }
  async close(_t: string, _id: string, data: CashSessionClose): Promise<void> {
    this.closedWith = data
    this.openSession = null
  }
  async listRecent(): Promise<CashSession[]> { return [] }
}

class FakePaymentRepo implements IPaymentRepository {
  payments: Payment[] = []
  async create(_p: NewPayment): Promise<Payment> { throw new Error('not used') }
  async listBetween(): Promise<Payment[]> { return this.payments }
}

function pay(method: PaymentMethod, amount: number): Payment {
  return {
    id: `p-${method}-${amount}`, tenantId: 't1', orderId: 'o', amount, currency: 'CRC',
    method, reference: null, cashGiven: null, cashChange: null, createdAt: new Date(), createdBy: 'x',
  }
}

function openFixture(openingAmount: number): CashSession {
  return {
    id: 's1', tenantId: 't1', status: 'open', openingAmount, openedBy: 'x',
    openedAt: new Date('2026-06-14T08:00:00Z'), closedBy: null, closedAt: null,
    countedCash: null, totals: null, expectedCash: null, difference: null, note: null,
  }
}

describe('CloseCashSessionUseCase', () => {
  it('calcula esperado, diferencia y totales al cerrar (sobrante)', async () => {
    const sessions = new FakeCashSessionRepo()
    sessions.openSession = openFixture(10000)
    const payments = new FakePaymentRepo()
    payments.payments = [pay('cash', 5000), pay('card', 3000), pay('cash', 2000)]

    // esperado = fondo 10000 + cash 7000 = 17000 ; contado 17500 → +500
    const result = await new CloseCashSessionUseCase(sessions, payments).execute({
      tenantId: 't1', closedBy: 'x', countedCash: 17500, note: null,
    })
    expect(result.expectedCash).toBe(17000)
    expect(result.difference).toBe(500)
    expect(result.totals.cash).toBe(7000)
    expect(result.totals.card).toBe(3000)
    expect(result.totals.total).toBe(10000)
    expect(result.totals.count).toBe(3)
    expect(sessions.closedWith).toEqual(result)
    expect(sessions.openSession).toBeNull()
  })

  it('diferencia negativa cuando falta efectivo', async () => {
    const sessions = new FakeCashSessionRepo()
    sessions.openSession = openFixture(10000)
    const payments = new FakePaymentRepo()
    payments.payments = [pay('cash', 5000)]
    const result = await new CloseCashSessionUseCase(sessions, payments).execute({
      tenantId: 't1', closedBy: 'x', countedCash: 14000, note: 'falta',
    })
    expect(result.expectedCash).toBe(15000)
    expect(result.difference).toBe(-1000)
  })

  it('rechaza efectivo contado negativo', async () => {
    const sessions = new FakeCashSessionRepo()
    sessions.openSession = openFixture(10000)
    await expect(
      new CloseCashSessionUseCase(sessions, new FakePaymentRepo()).execute({
        tenantId: 't1', closedBy: 'x', countedCash: -1, note: null,
      }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('rechaza cerrar si no hay caja abierta', async () => {
    const sessions = new FakeCashSessionRepo()
    await expect(
      new CloseCashSessionUseCase(sessions, new FakePaymentRepo()).execute({
        tenantId: 't1', closedBy: 'x', countedCash: 1000, note: null,
      }),
    ).rejects.toBeInstanceOf(ValidationError)
  })
})
