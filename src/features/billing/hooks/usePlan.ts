import { useQuery } from '@tanstack/react-query'

import type { PlanFeature, PlanId, Subscription } from '@core/domain/entities/Subscription'
import { trialDaysLeft as calcTrialDaysLeft } from '@core/domain/entities/Subscription'
import type { TenantPlan } from '@core/domain/entities/Tenant'
import { isFirebaseConfigured } from '@infrastructure/firebase/config'
import { useTenantContext } from '@app/providers/TenantProvider'
import type { PlanDefinition, PlanLimits } from '@shared/constants/plans'
import { PLANS } from '@shared/constants/plans'

import { BillingService } from '../services/BillingService'
import { billingQueryKeys } from '../types/billing.types'

const SUBSCRIPTION_STALE_MS = 1000 * 60 * 5

/** Tenant.plan legado → PlanId actual ('enterprise' se vende hoy como 'business'). */
function mapTenantPlan(plan: TenantPlan | undefined): PlanId {
  if (plan === 'enterprise') return 'business'
  return plan ?? 'free'
}

export interface UsePlanResult {
  readonly plan: PlanId
  readonly definition: PlanDefinition
  readonly subscription: Subscription | null
  readonly isLoading: boolean
  readonly isTrialing: boolean
  readonly trialDaysLeft: number
  readonly can: (feature: PlanFeature) => boolean
  readonly withinLimit: (resource: keyof PlanLimits, current: number) => boolean
}

/**
 * Plan efectivo del tenant: doc billing/subscription si existe,
 * con fallback a Tenant.plan (tenants antiguos sin doc de billing).
 */
export function usePlan(): UsePlanResult {
  const { tenant, tenantId } = useTenantContext()

  const { data: subscription = null, isLoading } = useQuery({
    queryKey: billingQueryKeys.subscription(tenantId),
    queryFn: () => BillingService.getSubscription.execute(tenantId),
    enabled: Boolean(tenantId) && isFirebaseConfigured,
    staleTime: SUBSCRIPTION_STALE_MS,
  })

  const plan: PlanId =
    subscription && subscription.status !== 'cancelled'
      ? subscription.plan
      : mapTenantPlan(tenant?.plan)

  const definition = PLANS[plan]
  const isTrialing = subscription?.status === 'trialing'
  const trialDaysLeft = subscription ? calcTrialDaysLeft(subscription, new Date()) : 0

  function can(_feature: PlanFeature): boolean {
    // DESBLOQUEO TEMPORAL: Todas las funciones activas hasta que se lance la facturación.
    return true // definition.features.includes(_feature)
  }

  function withinLimit(_resource: keyof PlanLimits, _current: number): boolean {
    // DESBLOQUEO TEMPORAL: Límites infinitos hasta que se lance la facturación.
    return true // const max = definition.limits[_resource]; return max === UNLIMITED || _current < max
  }

  return { plan, definition, subscription, isLoading, isTrialing, trialDaysLeft, can, withinLimit }
}
