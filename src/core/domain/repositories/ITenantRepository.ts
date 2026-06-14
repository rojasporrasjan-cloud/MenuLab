import type { Tenant, TenantPlan, TenantStatus } from '../entities/Tenant'

/** Cambios de suscripción que el superadmin puede aplicar a un tenant. */
export interface TenantSubscriptionPatch {
  readonly plan?: TenantPlan
  readonly status?: TenantStatus
}

export interface ITenantRepository {
  getById(tenantId: string): Promise<Tenant>
  getBySlug(slug: string): Promise<Tenant>
  getAll(): Promise<Tenant[]>
  updateSubscription(tenantId: string, patch: TenantSubscriptionPatch): Promise<void>
}
