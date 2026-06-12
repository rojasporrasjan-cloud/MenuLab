import { ShoppingBag } from 'lucide-react'
import { Z } from '@shared/design-tokens'
import { useCart } from '../../hooks/useCart'

interface CartButtonProps {
  /** Color primario del branding del tenant. */
  readonly accentColor: string
}

/**
 * FAB flotante de carrito, siempre visible mientras los pedidos estén activos.
 * Permite ordenar sin estar en una mesa (para llevar / domicilio). El badge
 * contador solo aparece cuando hay items en la bolsa.
 */
export function CartButton({ accentColor }: CartButtonProps) {
  const cart = useCart()
  const hasItems = cart.itemCount > 0

  return (
    <button
      type="button"
      onClick={cart.open}
      aria-label={hasItems ? `Abrir pedido (${cart.itemCount} items)` : 'Abrir bolsa de pedido'}
      className="fixed bottom-4 left-4 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
      style={{
        background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
        boxShadow: `0 8px 24px ${accentColor}55`,
        zIndex: Z.toast,
      }}
    >
      <ShoppingBag size={22} />
      {hasItems && (
        <span
          className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-black"
          style={{ background: '#ffffff', color: '#18181b', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
        >
          {cart.itemCount}
        </span>
      )}
    </button>
  )
}
