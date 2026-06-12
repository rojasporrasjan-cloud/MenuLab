import { useCartContext, useOptionalCartContext } from '../context/CartContext'
import type { CartContextValue } from '../context/CartContext'

/** Hook público del feature de carrito. Debe usarse dentro de <CartProvider>. */
export function useCart(): CartContextValue {
  return useCartContext()
}

/** Variante tolerante: null si no hay <CartProvider> (templates compartidos). */
export function useOptionalCart(): CartContextValue | null {
  return useOptionalCartContext()
}
