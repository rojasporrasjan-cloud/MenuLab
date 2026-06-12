export const billingQueryKeys = {
  subscription: (tenantId: string) => ['billing', tenantId, 'subscription'] as const,
} as const
