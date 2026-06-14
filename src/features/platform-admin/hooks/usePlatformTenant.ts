import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlatformAdminService } from '../services/PlatformAdminService'
import type { Tenant, TenantPlan, TenantStatus } from '@core/domain/entities/Tenant'

export function usePlatformTenant(tenantId: string) {
  return useQuery<Tenant>({
    queryKey: ['platform', 'tenant', tenantId],
    queryFn: () => PlatformAdminService.getTenant(tenantId),
    enabled: Boolean(tenantId),
  })
}

export interface SubscriptionUpdate {
  readonly plan?: TenantPlan
  readonly status?: TenantStatus
}

export function useUpdateTenantSubscription(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (update: SubscriptionUpdate) =>
      PlatformAdminService.updateSubscription({
        tenantId,
        plan: update.plan,
        status: update.status,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'tenant', tenantId] })
      void queryClient.invalidateQueries({ queryKey: ['platform', 'tenants'] })
    },
  })
}
