import type { ITenantRepository } from '@core/domain/repositories/ITenantRepository'
import type { Tenant } from '@core/domain/entities/Tenant'

export class GetTenantByIdUseCase {
  private readonly tenants: ITenantRepository

  constructor(tenants: ITenantRepository) {
    this.tenants = tenants
  }

  execute(tenantId: string): Promise<Tenant> {
    return this.tenants.getById(tenantId)
  }
}
