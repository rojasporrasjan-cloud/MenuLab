export const crmQueryKeys = {
  customers: (tenantId: string) => ['crm', tenantId, 'customers'] as const,
  customerOrders: (tenantId: string, phone: string) =>
    ['crm', tenantId, 'customer-orders', phone] as const,
} as const

/** Criterios de ordenamiento de la lista de clientes. */
export const CUSTOMER_SORT = {
  recent: 'recent',
  orders: 'orders',
  spent: 'spent',
} as const

export type CustomerSort = (typeof CUSTOMER_SORT)[keyof typeof CUSTOMER_SORT]

export const CUSTOMER_SORT_LABELS: Record<CustomerSort, string> = {
  recent: 'Más recientes',
  orders: 'Más pedidos',
  spent: 'Mayor gasto',
}
