export const loyaltyQueryKeys = {
  card: (tenantId: string, phone: string) => ['loyalty', tenantId, 'card', phone] as const,
  stats: (tenantId: string) => ['loyalty', tenantId, 'stats'] as const,
} as const
