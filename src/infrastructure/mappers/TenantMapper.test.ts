import { describe, it, expect } from 'vitest'
import type { DocumentSnapshot } from 'firebase/firestore'
import { TenantMapper } from './TenantMapper'

// safe (test): mock mínimo del snapshot — el mapper solo usa doc.id y doc.data().
function snap(id: string, data: Record<string, unknown>): DocumentSnapshot {
  return { id, data: () => data } as unknown as DocumentSnapshot
}
function ts(date: Date): { toDate: () => Date } {
  return { toDate: () => date }
}

describe('TenantMapper.toDomain', () => {
  it('mapea un tenant con dueño y aplica defaults de branding', () => {
    const tenant = TenantMapper.toDomain(snap('soda-test', {
      slug: 'soda-test', name: 'Soda Test', ownerId: 'uid-1', ownerEmail: 'dueno@x.com',
      plan: 'pro', status: 'active', templateId: 'dark-modern',
      timezone: 'America/Costa_Rica', locale: 'es-CR',
      createdAt: ts(new Date('2026-01-01')), updatedAt: ts(new Date('2026-06-01')),
    }))
    expect(tenant.id).toBe('soda-test')
    expect(tenant.name).toBe('Soda Test')
    expect(tenant.ownerId).toBe('uid-1')
    expect(tenant.ownerEmail).toBe('dueno@x.com')
    expect(tenant.plan).toBe('pro')
    expect(tenant.status).toBe('active')
    expect(tenant.branding.primaryColor).toBe('#e11d48') // default cuando falta branding
    expect(tenant.lockedModules).toEqual([])
    expect(tenant.onboardingCompletedAt).toBeNull()
  })

  it('ownerId/ownerEmail en null cuando faltan (tenants previos al cambio)', () => {
    const tenant = TenantMapper.toDomain(snap('old', {
      slug: 'old', name: 'Old', plan: 'free', status: 'active', templateId: 'dark-modern',
      timezone: 'America/Costa_Rica', locale: 'es-CR',
      createdAt: ts(new Date('2025-01-01')), updatedAt: ts(new Date('2025-01-01')),
    }))
    expect(tenant.ownerId).toBeNull()
    expect(tenant.ownerEmail).toBeNull()
  })
})
