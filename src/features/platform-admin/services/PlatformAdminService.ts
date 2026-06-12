import { FirestoreTenantRepository } from '@infrastructure/repositories/FirestoreTenantRepository'
import { GetAllTenantsUseCase } from '@core/use-cases/tenant/GetAllTenantsUseCase'
import type { Tenant } from '@core/domain/entities/Tenant'

const tenantRepo = new FirestoreTenantRepository()
const getAllTenantsUseCase = new GetAllTenantsUseCase(tenantRepo)

export const PlatformAdminService = {
  getAllTenants(): Promise<Tenant[]> {
    return getAllTenantsUseCase.execute()
  },
}
