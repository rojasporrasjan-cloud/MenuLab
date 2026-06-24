export const loyaltyQueryKeys = {
  all: (tenantId: string) => ['loyalty', tenantId, 'cards'] as const,
  card: (tenantId: string, phone: string) => ['loyalty', tenantId, 'card', phone] as const,
  stats: (tenantId: string) => ['loyalty', tenantId, 'stats'] as const,
} as const
