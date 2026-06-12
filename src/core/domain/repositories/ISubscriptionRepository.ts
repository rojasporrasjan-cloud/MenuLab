import type { Subscription } from '@core/domain/entities/Subscription'

export interface ISubscriptionRepository {
  /** null si el tenant nunca ha tenido doc de suscripción (plan según Tenant.plan). */
  getByTenantId(tenantId: string): Promise<Subscription | null>
}
