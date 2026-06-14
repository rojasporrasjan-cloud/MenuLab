import type { ITenantRepository } from '@core/domain/repositories/ITenantRepository'
import type { TenantPlan, TenantStatus } from '@core/domain/entities/Tenant'

export interface UpdateTenantSubscriptionInput {
  readonly tenantId: string
  readonly plan?: TenantPlan
  readonly status?: TenantStatus
}

/**
 * Cambia el plan y/o el estado de la suscripción de un tenant.
 * Pensado para el superadmin de la plataforma (cancelar = suspended,
 * renovar/reactivar = active, cambiar de plan).
 */
export class UpdateTenantSubscriptionUseCase {
  private readonly tenants: ITenantRepository

  constructor(tenants: ITenantRepository) {
    this.tenants = tenants
  }

  execute(input: UpdateTenantSubscriptionInput): Promise<void> {
    return this.tenants.updateSubscription(input.tenantId, {
      plan: input.plan,
      status: input.status,
    })
  }
}
