function getEnv(key: string): string {
  return (import.meta.env[key] as string | undefined) ?? ''
}

export const ENV = {
  platformAdminUids: getEnv('VITE_PLATFORM_ADMIN_UIDS')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  stripe: {
    // Opcionales — si faltan, el upgrade cae al flujo de WhatsApp.
    publishableKey: getEnv('VITE_STRIPE_PUBLISHABLE_KEY'),
    paymentLinks: {
      starter: getEnv('VITE_STRIPE_PAYMENT_LINK_STARTER'),
      pro: getEnv('VITE_STRIPE_PAYMENT_LINK_PRO'),
      business: getEnv('VITE_STRIPE_PAYMENT_LINK_BUSINESS'),
    },
  },
} as const
