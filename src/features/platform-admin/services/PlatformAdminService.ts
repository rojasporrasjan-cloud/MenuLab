import { FirestoreTenantRepository } from '@infrastructure/repositories/FirestoreTenantRepository'
import { GetAllTenantsUseCase } from '@core/use-cases/tenant/GetAllTenantsUseCase'
import { GetTenantByIdUseCase } from '@core/use-cases/tenant/GetTenantByIdUseCase'
import { UpdateTenantSubscriptionUseCase } from '@core/use-cases/tenant/UpdateTenantSubscriptionUseCase'
import type { UpdateTenantSubscriptionInput } from '@core/use-cases/tenant/UpdateTenantSubscriptionUseCase'
import type { Tenant } from '@core/domain/entities/Tenant'

const tenantRepo = new FirestoreTenantRepository()
const getAllTenantsUseCase = new GetAllTenantsUseCase(tenantRepo)
const getTenantByIdUseCase = new GetTenantByIdUseCase(tenantRepo)
const updateSubscriptionUseCase = new UpdateTenantSubscriptionUseCase(tenantRepo)

export const PlatformAdminService = {
  getAllTenants(): Promise<Tenant[]> {
    return getAllTenantsUseCase.execute()
  },
  getTenant(tenantId: string): Promise<Tenant> {
    return getTenantByIdUseCase.execute(tenantId)
  },
  updateSubscription(input: UpdateTenantSubscriptionInput): Promise<void> {
    return updateSubscriptionUseCase.execute(input)
  },
}
