export const PLAN_ID = {
  free: 'free',
  starter: 'starter',
  pro: 'pro',
  business: 'business',
} as const

export type PlanId = (typeof PLAN_ID)[keyof typeof PLAN_ID]

export const SUBSCRIPTION_STATUS = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  cancelled: 'cancelled',
} as const

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS]

/** Capacidades que desbloquea cada plan. */
export type PlanFeature =
  | 'ordering'
  | 'kds'
  | 'pos'
  | 'reservations'
  | 'ar_unlimited'
  | 'analytics_pro'
  | 'loyalty'
  | 'inventory'
  | 'crm'
  | 'custom_domain'
  | 'multi_location'
  | 'white_label'

export interface Subscription {
  readonly tenantId: string
  readonly plan: PlanId
  readonly status: SubscriptionStatus
  readonly trialEndsAt: Date | null
  readonly currentPeriodEnd: Date | null
  readonly stripeCustomerId: string | null
  readonly stripeSubscriptionId: string | null
  readonly updatedAt: Date
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function trialDaysLeft(subscription: Subscription, now: Date): number {
  if (subscription.status !== 'trialing' || !subscription.trialEndsAt) return 0
  const diff = subscription.trialEndsAt.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / MS_PER_DAY))
}
