import { describe, it, expect } from 'vitest'
import { UpdateTenantSubscriptionUseCase } from './UpdateTenantSubscriptionUseCase'
import type { ITenantRepository, TenantSubscriptionPatch } from '@core/domain/repositories/ITenantRepository'
import type { Tenant } from '@core/domain/entities/Tenant'

class FakeTenantRepo implements ITenantRepository {
  updates: { tenantId: string; patch: TenantSubscriptionPatch }[] = []
  async getById(): Promise<Tenant> { throw new Error('not used') }
  async getBySlug(): Promise<Tenant> { throw new Error('not used') }
  async getAll(): Promise<Tenant[]> { return [] }
  async updateSubscription(tenantId: string, patch: TenantSubscriptionPatch): Promise<void> {
    this.updates.push({ tenantId, patch })
  }
}

describe('UpdateTenantSubscriptionUseCase', () => {
  it('pasa plan y estado al repositorio', async () => {
    const repo = new FakeTenantRepo()
    await new UpdateTenantSubscriptionUseCase(repo).execute({ tenantId: 't1', plan: 'pro', status: 'active' })
    expect(repo.updates).toHaveLength(1)
    expect(repo.updates[0]?.tenantId).toBe('t1')
    expect(repo.updates[0]?.patch.plan).toBe('pro')
    expect(repo.updates[0]?.patch.status).toBe('active')
  })

  it('permite cambiar solo el estado (cancelar/renovar)', async () => {
    const repo = new FakeTenantRepo()
    await new UpdateTenantSubscriptionUseCase(repo).execute({ tenantId: 't1', status: 'suspended' })
    expect(repo.updates[0]?.patch.status).toBe('suspended')
    expect(repo.updates[0]?.patch.plan).toBeUndefined()
  })

  it('permite cambiar solo el plan', async () => {
    const repo = new FakeTenantRepo()
    await new UpdateTenantSubscriptionUseCase(repo).execute({ tenantId: 't1', plan: 'enterprise' })
    expect(repo.updates[0]?.patch.plan).toBe('enterprise')
    expect(repo.updates[0]?.patch.status).toBeUndefined()
  })
})
