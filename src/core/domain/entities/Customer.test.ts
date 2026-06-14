import { describe, it, expect } from 'vitest'
import {
  customerAutoTags,
  normalizeCustomerPhone,
  CUSTOMER_AUTO_TAG,
} from './Customer'
import type { Customer, CustomerTagThresholds } from './Customer'

const thresholds: CustomerTagThresholds = {
  newCustomerDays: 30,
  frequentOrdersMin: 5,
  vipOrdersMin: 10,
  inactiveDays: 60,
}

function makeCustomer(partial: Partial<Customer>): Customer {
  return {
    id: 'c1',
    tenantId: 't1',
    phone: '88887777',
    name: 'Test',
    email: null,
    totalOrders: 0,
    totalSpent: 0,
    currency: 'CRC',
    averageTicket: 0,
    lastOrderAt: null,
    firstOrderAt: null,
    tags: [],
    note: null,
    createdAt: new Date(),
    ...partial,
  }
}

describe('normalizeCustomerPhone', () => {
  it('quita todo lo que no sea dígito', () => {
    expect(normalizeCustomerPhone('+506 8888-7777')).toBe('50688887777')
  })
  it('limpia paréntesis y espacios', () => {
    expect(normalizeCustomerPhone('(506) 8888 7777')).toBe('50688887777')
  })
})

describe('customerAutoTags', () => {
  const now = new Date('2026-06-14T00:00:00Z')

  it('marca Nuevo si el primer pedido fue hace poco', () => {
    const c = makeCustomer({
      firstOrderAt: new Date('2026-06-10T00:00:00Z'),
      totalOrders: 1,
      lastOrderAt: now,
    })
    expect(customerAutoTags(c, now, thresholds)).toContain(CUSTOMER_AUTO_TAG.new)
  })

  it('marca VIP con suficientes pedidos (y no Frecuente)', () => {
    const c = makeCustomer({
      totalOrders: 12,
      firstOrderAt: new Date('2025-01-01T00:00:00Z'),
      lastOrderAt: now,
    })
    const tags = customerAutoTags(c, now, thresholds)
    expect(tags).toContain(CUSTOMER_AUTO_TAG.vip)
    expect(tags).not.toContain(CUSTOMER_AUTO_TAG.frequent)
  })

  it('marca Frecuente entre el mínimo frecuente y el VIP', () => {
    const c = makeCustomer({
      totalOrders: 6,
      firstOrderAt: new Date('2025-01-01T00:00:00Z'),
      lastOrderAt: now,
    })
    expect(customerAutoTags(c, now, thresholds)).toContain(CUSTOMER_AUTO_TAG.frequent)
  })

  it('marca Inactivo si el último pedido fue hace mucho', () => {
    const c = makeCustomer({
      totalOrders: 3,
      firstOrderAt: new Date('2025-01-01T00:00:00Z'),
      lastOrderAt: new Date('2026-01-01T00:00:00Z'),
    })
    expect(customerAutoTags(c, now, thresholds)).toContain(CUSTOMER_AUTO_TAG.inactive)
  })

  it('sin historial relevante → sin tags', () => {
    const c = makeCustomer({ totalOrders: 0, firstOrderAt: null, lastOrderAt: null })
    expect(customerAutoTags(c, now, thresholds)).toEqual([])
  })
})
