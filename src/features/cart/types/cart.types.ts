export interface CartLine {
  /** Identidad de la línea: dishId + variante. */
  readonly lineId: string
  readonly dishId: string
  readonly dishName: string
  readonly unitPrice: number
  readonly currency: string
  readonly variantLabel: string | null
  readonly note: string | null
  readonly quantity: number
}

export interface CartState {
  readonly lines: readonly CartLine[]
  readonly isOpen: boolean
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartLine, 'lineId' | 'quantity'> & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; lineId: string }
  | { type: 'SET_QTY'; lineId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'OPEN' }
  | { type: 'CLOSE' }

export const orderQueryKeys = {
  active: (tenantId: string) => ['orders', tenantId, 'active'] as const,
  byDate: (tenantId: string, date: string) => ['orders', tenantId, 'date', date] as const,
} as const
