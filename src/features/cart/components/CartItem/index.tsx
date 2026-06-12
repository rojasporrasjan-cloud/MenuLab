import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { COPY } from '@shared/copy/ui.copy'
import type { CartLine } from '../../types/cart.types'

interface CartItemProps {
  readonly line: CartLine
  readonly accentColor: string
  readonly onSetQuantity: (lineId: string, quantity: number) => void
  readonly onRemove: (lineId: string) => void
}

export function CartItem({ line, accentColor, onSetQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-white">{line.dishName}</p>
        {line.variantLabel && (
          <p className="truncate text-[11px] text-neutral-400">{line.variantLabel}</p>
        )}
        <p className="mt-0.5 text-[12px] font-semibold" style={{ color: accentColor }}>
          {formatCurrency(line.unitPrice * line.quantity, line.currency)}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Reducir cantidad"
          onClick={() => onSetQuantity(line.lineId, line.quantity - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 transition-colors hover:bg-white/10"
        >
          <Minus size={13} />
        </button>
        <span className="w-6 text-center text-[13px] font-black text-white">{line.quantity}</span>
        <button
          type="button"
          aria-label="Aumentar cantidad"
          onClick={() => onSetQuantity(line.lineId, line.quantity + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-300 transition-colors hover:bg-white/10"
        >
          <Plus size={13} />
        </button>
      </div>

      <button
        type="button"
        aria-label={COPY.cart.remove}
        title={COPY.cart.remove}
        onClick={() => onRemove(line.lineId)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
