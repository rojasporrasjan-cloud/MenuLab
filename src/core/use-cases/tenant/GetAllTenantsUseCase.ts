import type { ITenantRepository } from '@core/domain/repositories/ITenantRepository'
import type { Tenant } from '@core/domain/entities/Tenant'

export class GetAllTenantsUseCase {
  private readonly tenantRepository: ITenantRepository

  constructor(tenantRepository: ITenantRepository) {
    this.tenantRepository = tenantRepository
  }

  async execute(): Promise<Tenant[]> {
    return this.tenantRepository.getAll()
  }
}
