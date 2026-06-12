export interface Customer {
  readonly id: string
  readonly tenantId: string
  /** Teléfono normalizado (solo dígitos) — clave del upsert. */
  readonly phone: string
  readonly name: string
  readonly email: string | null
  readonly totalOrders: number
  readonly totalSpent: number
  readonly currency: string
  readonly averageTicket: number
  readonly lastOrderAt: Date | null
  readonly firstOrderAt: Date | null
  /** Etiquetas manuales del restaurante (las automáticas se calculan). */
  readonly tags: readonly string[]
  readonly note: string | null
  readonly createdAt: Date
}

/** Umbrales para etiquetas automáticas — los provee la capa de feature (LIMITS.crm). */
export interface CustomerTagThresholds {
  readonly newCustomerDays: number
  readonly frequentOrdersMin: number
  readonly vipOrdersMin: number
  readonly inactiveDays: number
}

export const CUSTOMER_AUTO_TAG = {
  new: 'Nuevo',
  frequent: 'Frecuente',
  vip: 'VIP',
  inactive: 'Inactivo',
} as const

export type CustomerAutoTag = (typeof CUSTOMER_AUTO_TAG)[keyof typeof CUSTOMER_AUTO_TAG]

const MS_PER_DAY = 1000 * 60 * 60 * 24

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY)
}

/** Etiquetas automáticas según historial: Nuevo, Frecuente, VIP, Inactivo. */
export function customerAutoTags(
  customer: Customer,
  now: Date,
  thresholds: CustomerTagThresholds,
): CustomerAutoTag[] {
  const tags: CustomerAutoTag[] = []

  if (customer.firstOrderAt && daysBetween(customer.firstOrderAt, now) < thresholds.newCustomerDays) {
    tags.push(CUSTOMER_AUTO_TAG.new)
  }
  if (customer.totalOrders >= thresholds.vipOrdersMin) {
    tags.push(CUSTOMER_AUTO_TAG.vip)
  } else if (customer.totalOrders >= thresholds.frequentOrdersMin) {
    tags.push(CUSTOMER_AUTO_TAG.frequent)
  }
  if (customer.lastOrderAt && daysBetween(customer.lastOrderAt, now) > thresholds.inactiveDays) {
    tags.push(CUSTOMER_AUTO_TAG.inactive)
  }

  return tags
}

/** Teléfono normalizado a solo dígitos. */
export function normalizeCustomerPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}
