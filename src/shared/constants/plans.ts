import type { PlanFeature, PlanId } from '@core/domain/entities/Subscription'

/** Valor sentinela: recurso ilimitado en el plan. */
export const UNLIMITED = -1

export interface PlanLimits {
  readonly dishes: number
  readonly menus: number
  readonly tables: number
  readonly arModels: number
}

export interface PlanDefinition {
  readonly id: PlanId
  readonly name: string
  readonly priceUsd: number
  readonly tagline: string
  readonly features: readonly PlanFeature[]
  readonly limits: PlanLimits
  /** Plan recomendado en la tabla comparativa. */
  readonly highlighted: boolean
}

const STARTER_FEATURES: readonly PlanFeature[] = ['ordering', 'reservations']

const PRO_FEATURES: readonly PlanFeature[] = [
  ...STARTER_FEATURES,
  'kds',
  'pos',
  'ar_unlimited',
  'analytics_pro',
  'loyalty',
  'crm',
]

const BUSINESS_FEATURES: readonly PlanFeature[] = [
  ...PRO_FEATURES,
  'inventory',
  'custom_domain',
  'multi_location',
  'white_label',
]

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Gratis',
    priceUsd: 0,
    tagline: 'Para probar tu menú digital',
    features: [],
    limits: { dishes: 20, menus: 1, tables: 3, arModels: 3 },
    highlighted: false,
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceUsd: 29,
    tagline: 'Pedidos y reservas en línea',
    features: STARTER_FEATURES,
    limits: { dishes: UNLIMITED, menus: UNLIMITED, tables: 15, arModels: 10 },
    highlighted: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceUsd: 59,
    tagline: 'Operación completa del restaurante',
    features: PRO_FEATURES,
    limits: { dishes: UNLIMITED, menus: UNLIMITED, tables: 30, arModels: UNLIMITED },
    highlighted: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    priceUsd: 129,
    tagline: 'Multi-local y marca propia',
    features: BUSINESS_FEATURES,
    limits: { dishes: UNLIMITED, menus: UNLIMITED, tables: UNLIMITED, arModels: UNLIMITED },
    highlighted: false,
  },
} as const

/** Orden de menor a mayor para tablas comparativas y upgrades. */
export const PLAN_ORDER: readonly PlanId[] = ['free', 'starter', 'pro', 'business']

export const PLAN_FEATURE_LABELS: Record<PlanFeature, string> = {
  ordering: 'Pedidos en línea',
  kds: 'Pantalla de cocina (KDS)',
  pos: 'POS / Comandero',
  reservations: 'Reservaciones',
  ar_unlimited: 'Modelos AR ilimitados',
  analytics_pro: 'Analíticas Pro',
  loyalty: 'Programa de lealtad',
  inventory: 'Inventario y food cost',
  crm: 'CRM de clientes',
  custom_domain: 'Dominio propio',
  multi_location: 'Multi-local',
  white_label: 'Marca blanca',
}

export const PLAN_LIMIT_LABELS: Record<keyof PlanLimits, string> = {
  dishes: 'Platos',
  menus: 'Menús',
  tables: 'Mesas',
  arModels: 'Modelos AR',
}

export function formatLimit(value: number): string {
  return value === UNLIMITED ? 'Ilimitado' : String(value)
}
