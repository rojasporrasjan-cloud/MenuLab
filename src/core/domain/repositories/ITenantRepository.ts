import type { Tenant } from '../entities/Tenant'

export interface ITenantRepository {
  getById(tenantId: string): Promise<Tenant>
  getBySlug(slug: string): Promise<Tenant>
  getAll(): Promise<Tenant[]>
}
