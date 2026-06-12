import { useQuery } from '@tanstack/react-query'
import { PlatformAdminService } from '../services/PlatformAdminService'
import type { Tenant } from '@core/domain/entities/Tenant'

export function usePlatformTenants() {
  return useQuery<Tenant[]>({
    queryKey: ['platform', 'tenants'],
    queryFn: () => PlatformAdminService.getAllTenants(),
    staleTime: 1000 * 60 * 2,
  })
}
