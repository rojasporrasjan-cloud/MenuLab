import { createContext, useContext, useReducer, useMemo, type ReactNode } from 'react'
import type { CartAction, CartLine, CartState } from '../types/cart.types'

function buildLineId(dishId: string, variantLabel: string | null): string {
  return variantLabel ? `${dishId}::${variantLabel}` : dishId
}

const INITIAL_STATE: CartState = {
  lines: [],
  isOpen: false,
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { payload } = action
      const lineId = buildLineId(payload.dishId, payload.variantLabel)
      const quantity = payload.quantity ?? 1
      const existing = state.lines.find((l) => l.lineId === lineId)
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.lineId === lineId ? { ...l, quantity: l.quantity + quantity } : l,
          ),
        }
      }
      const newLine: CartLine = {
        lineId,
        dishId: payload.dishId,
        dishName: payload.dishName,
        unitPrice: payload.unitPrice,
        currency: payload.currency,
        variantLabel: payload.variantLabel,
        note: payload.note,
        quantity,
      }
      return { ...state, lines: [...state.lines, newLine] }
    }
    case 'REMOVE_ITEM':
      return { ...state, lines: state.lines.filter((l) => l.lineId !== action.lineId) }
    case 'SET_QTY': {
      if (action.quantity <= 0) {
        return { ...state, lines: state.lines.filter((l) => l.lineId !== action.lineId) }
      }
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.lineId === action.lineId ? { ...l, quantity: action.quantity } : l,
        ),
      }
    }
    case 'CLEAR':
      return { ...state, lines: [] }
    case 'OPEN':
      return { ...state, isOpen: true }
    case 'CLOSE':
      return { ...state, isOpen: false }
    default:
      return state
  }
}

export interface CartContextValue {
  readonly state: CartState
  readonly itemCount: number
  readonly subtotal: number
  readonly currency: string
  add(line: Omit<CartLine, 'lineId' | 'quantity'> & { quantity?: number }): void
  remove(lineId: string): void
  setQuantity(lineId: string, quantity: number): void
  clear(): void
  open(): void
  close(): void
}

const CartContext = createContext<CartContextValue | null>(null)

const DEFAULT_CURRENCY = 'CRC'

interface CartProviderProps {
  readonly children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_STATE)

  const value = useMemo<CartContextValue>(() => {
    const itemCount = state.lines.reduce((sum, l) => sum + l.quantity, 0)
    const subtotal = state.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
    const currency = state.lines[0]?.currency ?? DEFAULT_CURRENCY
    return {
      state,
      itemCount,
      subtotal,
      currency,
      add: (line) => dispatch({ type: 'ADD_ITEM', payload: line }),
      remove: (lineId) => dispatch({ type: 'REMOVE_ITEM', lineId }),
      setQuantity: (lineId, quantity) => dispatch({ type: 'SET_QTY', lineId, quantity }),
      clear: () => dispatch({ type: 'CLEAR' }),
      open: () => dispatch({ type: 'OPEN' }),
      close: () => dispatch({ type: 'CLOSE' }),
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Los hooks del contexto viven junto al provider a propósito (patrón estándar de
// React Context). `react-refresh/only-export-components` es solo una optimización
// de HMR en desarrollo — no afecta el runtime ni la correctitud.
// eslint-disable-next-line react-refresh/only-export-components
export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartContext must be used inside <CartProvider>')
  return ctx
}

/** Variante opcional: retorna null fuera del provider (para componentes compartidos). */
// eslint-disable-next-line react-refresh/only-export-components
export function useOptionalCartContext(): CartContextValue | null {
  return useContext(CartContext)
}
