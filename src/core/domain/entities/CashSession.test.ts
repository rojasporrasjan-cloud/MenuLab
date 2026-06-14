import { describe, it, expect } from 'vitest'
import {
  summarizePayments,
  calculateExpectedCash,
  calculateCashDifference,
} from './CashSession'
import type { Payment, PaymentMethod } from './Payment'

function makePayment(method: PaymentMethod, amount: number): Payment {
  return {
    id: `p-${method}-${amount}`,
    tenantId: 't1',
    orderId: 'o1',
    amount,
    currency: 'CRC',
    method,
    reference: null,
    cashGiven: null,
    cashChange: null,
    createdAt: new Date(),
    createdBy: 'tester',
  }
}

describe('summarizePayments', () => {
  it('agrupa por método y suma total + count', () => {
    const totals = summarizePayments([
      makePayment('cash', 1000),
      makePayment('cash', 500),
      makePayment('card', 2000),
      makePayment('sinpe', 300),
    ])
    expect(totals.cash).toBe(1500)
    expect(totals.card).toBe(2000)
    expect(totals.sinpe).toBe(300)
    expect(totals.yape).toBe(0)
    expect(totals.other).toBe(0)
    expect(totals.total).toBe(3800)
    expect(totals.count).toBe(4)
  })

  it('devuelve ceros y count 0 con lista vacía', () => {
    expect(summarizePayments([])).toEqual({
      cash: 0, card: 0, sinpe: 0, yape: 0, other: 0, total: 0, count: 0,
    })
  })

  it('suma todos los métodos a la vez', () => {
    const totals = summarizePayments([
      makePayment('cash', 100),
      makePayment('card', 200),
      makePayment('sinpe', 300),
      makePayment('yape', 400),
      makePayment('other', 500),
    ])
    expect(totals.total).toBe(1500)
    expect(totals.count).toBe(5)
  })
})

describe('calculateExpectedCash', () => {
  it('suma fondo inicial + cobros en efectivo', () => {
    expect(calculateExpectedCash(10000, 5000)).toBe(15000)
  })
  it('funciona con cero', () => {
    expect(calculateExpectedCash(0, 0)).toBe(0)
  })
  it('solo fondo cuando no hubo cobros', () => {
    expect(calculateExpectedCash(20000, 0)).toBe(20000)
  })
})

describe('calculateCashDifference', () => {
  it('positivo cuando sobra efectivo', () => {
    expect(calculateCashDifference(16000, 15000)).toBe(1000)
  })
  it('negativo cuando falta efectivo', () => {
    expect(calculateCashDifference(14000, 15000)).toBe(-1000)
  })
  it('cero cuando la caja cuadra', () => {
    expect(calculateCashDifference(15000, 15000)).toBe(0)
  })
})
