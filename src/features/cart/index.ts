// ── Context ───────────────────────────────────────────────────────────────────
export { CartProvider } from './context/CartContext'
export type { CartContextValue } from './context/CartContext'

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useCart, useOptionalCart } from './hooks/useCart'
export { useCreateOrder } from './hooks/useCreateOrder'
export { useActiveOrders } from './hooks/useActiveOrders'
export { useOrdersByDate } from './hooks/useOrdersByDate'
export { useUpdateOrderStatus } from './hooks/useUpdateOrderStatus'

// ── Components ────────────────────────────────────────────────────────────────
export { CartButton } from './components/CartButton'
export { CartDrawer } from './components/CartDrawer'
export { CartItem } from './components/CartItem'
export { CheckoutModal } from './components/CheckoutModal'
export { OrderStatusBadge } from './components/OrderStatusBadge'

// ── Types ─────────────────────────────────────────────────────────────────────
export type { CartLine, CartState, CartAction } from './types/cart.types'
export { orderQueryKeys } from './types/cart.types'
