import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, ShoppingBag, MessageCircle, CreditCard } from 'lucide-react'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { COPY } from '@shared/copy/ui.copy'
import { useCart } from '../../hooks/useCart'
import { CartItem } from '../CartItem'
import { CheckoutModal } from '../CheckoutModal'

interface CartDrawerProps {
  readonly tenantId: string
  /** Número de WhatsApp del restaurante. */
  readonly whatsappPhone: string
  /** Número de SINPE Móvil del restaurante (o null si no lo configuró). */
  readonly sinpeNumber: string | null
  readonly tableId: string | null
  readonly tableLabel: string | null
  readonly accentColor: string
}

export function CartDrawer({
  tenantId,
  whatsappPhone,
  sinpeNumber,
  tableId,
  tableLabel,
  accentColor,
}: CartDrawerProps) {
  const cart = useCart()
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  return (
    <>
      <Dialog.Root open={cart.state.isOpen} onOpenChange={(open) => { if (!open) cart.close() }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-md animate-fade-in" />
          <Dialog.Content
            className="fixed inset-y-0 right-0 z-[1000] flex w-full max-w-sm flex-col border-l border-white/[0.08] bg-zinc-950/95 text-neutral-100 shadow-2xl backdrop-blur-2xl focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <Dialog.Title className="flex items-center gap-2 text-base font-black text-white">
                <ShoppingBag size={17} style={{ color: accentColor }} />
                {COPY.cart.title}
                {cart.itemCount > 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-black"
                    style={{ background: `${accentColor}22`, color: accentColor }}
                  >
                    {cart.itemCount}
                  </span>
                )}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Cerrar pedido"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={15} />
                </button>
              </Dialog.Close>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.state.lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
                    <ShoppingBag size={22} className="text-neutral-500" />
                  </div>
                  <p className="text-sm font-bold text-neutral-300">{COPY.cart.empty}</p>
                  <p className="max-w-[200px] text-xs text-neutral-500">{COPY.cart.emptyHint}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {cart.state.lines.map((line) => (
                    <CartItem
                      key={line.lineId}
                      line={line}
                      accentColor={accentColor}
                      onSetQuantity={cart.setQuantity}
                      onRemove={cart.remove}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.state.lines.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-white/[0.06] px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {COPY.cart.subtotal}
                  </span>
                  <span className="text-lg font-black text-white">
                    {formatCurrency(cart.subtotal, cart.currency)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    cart.close()
                    setIsCheckoutOpen(true)
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white shadow-lg transition-all active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
                    boxShadow: `0 4px 18px ${accentColor}33`,
                  }}
                >
                  <MessageCircle size={16} />
                  {COPY.cart.orderViaWhatsApp}
                </button>

                <button
                  type="button"
                  disabled
                  title={COPY.cart.payHereSoon}
                  className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-neutral-500"
                >
                  <CreditCard size={15} />
                  {COPY.cart.payHere}
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                    {COPY.cart.payHereSoon}
                  </span>
                </button>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        tenantId={tenantId}
        whatsappPhone={whatsappPhone}
        sinpeNumber={sinpeNumber}
        tableId={tableId}
        tableLabel={tableLabel}
        accentColor={accentColor}
      />
    </>
  )
}
