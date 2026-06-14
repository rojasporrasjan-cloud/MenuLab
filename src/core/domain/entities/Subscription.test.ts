import { describe, it, expect } from 'vitest'
import { trialDaysLeft } from './Subscription'
import type { Subscription } from './Subscription'

function makeSub(partial: Partial<Subscription>): Subscription {
  return {
    tenantId: 't1',
    plan: 'pro',
    status: 'trialing',
    trialEndsAt: null,
    currentPeriodEnd: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    updatedAt: new Date(),
    ...partial,
  }
}

describe('trialDaysLeft', () => {
  const now = new Date('2026-06-14T00:00:00Z')

  it('cuenta los días restantes del trial', () => {
    const sub = makeSub({ status: 'trialing', trialEndsAt: new Date('2026-06-19T00:00:00Z') })
    expect(trialDaysLeft(sub, now)).toBe(5)
  })

  it('redondea fracciones de día hacia arriba', () => {
    const sub = makeSub({ status: 'trialing', trialEndsAt: new Date('2026-06-14T12:00:00Z') })
    expect(trialDaysLeft(sub, now)).toBe(1)
  })

  it('devuelve 0 si el trial ya venció', () => {
    const sub = makeSub({ status: 'trialing', trialEndsAt: new Date('2026-06-10T00:00:00Z') })
    expect(trialDaysLeft(sub, now)).toBe(0)
  })

  it('devuelve 0 si la suscripción no está en trialing', () => {
    const sub = makeSub({ status: 'active', trialEndsAt: new Date('2026-06-19T00:00:00Z') })
    expect(trialDaysLeft(sub, now)).toBe(0)
  })

  it('devuelve 0 si no hay fecha de fin de trial', () => {
    const sub = makeSub({ status: 'trialing', trialEndsAt: null })
    expect(trialDaysLeft(sub, now)).toBe(0)
  })
})
