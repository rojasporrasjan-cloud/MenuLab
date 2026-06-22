import { Minus, Plus, Send, Receipt } from 'lucide-react'

import type { Order } from '@core/domain/entities/Order'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { COPY } from '@shared/copy/ui.copy'

import type { POSCartLine } from '../../types/pos.types'

interface POSCartProps {
  readonly lines: readonly POSCartLine[]
  /** Pedidos ya enviados de la mesa (cuenta acumulada). */
  readonly tableOrders: readonly Order[]
  readonly isSending: boolean
  readonly onQuantityChange: (dishId: string, quantity: number) => void
  readonly onSend: () => void
  readonly onCloseCheck: () => void
}

const DEFAULT_CURRENCY = 'CRC'

/** Comanda en preparación + cuenta acumulada de la mesa. */
export function POSCart({
  lines,
  tableOrders,
  isSending,
  onQuantityChange,
  onSend,
  onCloseCheck,
}: POSCartProps) {
  const currency = lines[0]?.currency ?? tableOrders[0]?.currency ?? DEFAULT_CURRENCY
  const cartTotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
  const accountTotal = tableOrders.reduce((sum, o) => sum + o.subtotal, 0)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h2
        className="shrink-0 text-[11px] font-black uppercase tracking-[0.18em]"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {COPY.pos.cart.title}
      </h2>

      {/* Líneas de la comanda */}
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
        {lines.length === 0 ? (
          <p className="py-8 text-center text-[12.5px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {COPY.pos.cart.empty}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {lines.map((line) => (
              <div
                key={line.dishId}
                className="flex items-center gap-2 rounded-xl p-2.5"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-white">
                  {line.dishName}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Quitar ${line.dishName}`}
                    onClick={() => onQuantityChange(line.dishId, line.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white active:scale-90"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-[13px] font-black tabular-nums text-white">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Agregar ${line.dishName}`}
                    onClick={() => onQuantityChange(line.dishId, line.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white active:scale-90"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="w-20 shrink-0 text-right text-[12.5px] font-black tabular-nums text-white">
                  {formatCurrency(line.unitPrice * line.quantity, line.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {lines.length > 0 && (
          <button
            type="button"
            onClick={onSend}
            disabled={isSending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[13.5px] font-black transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: '#f5b520', color: '#1a1303' }}
          >
            <Send size={14} />
            {isSending ? COPY.pos.cart.sending : COPY.pos.cart.sendToKitchen}
            <span className="tabular-nums">· {formatCurrency(cartTotal, currency)}</span>
          </button>
        )}

        {tableOrders.length > 0 && (
          <div className="mt-2.5">
            <div
              className="flex items-center justify-between text-[12px] font-bold"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              <span>{COPY.pos.cart.account}</span>
              <span className="tabular-nums text-white">
                {formatCurrency(accountTotal, currency)}
              </span>
            </div>
            
            {/* Desglose de los platos pedidos en la mesa */}
            <div className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto pr-1">
              {tableOrders.flatMap(o => o.items).map((item, idx) => (
                <div key={idx} className="flex items-start justify-between text-[11px] leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <span className="min-w-0 flex-1 truncate pr-2">
                    <span className="font-bold text-white/60">{item.quantity}x</span> {item.dishName}
                    {item.variantLabel && <span className="ml-1 text-white/30">({item.variantLabel})</span>}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatCurrency(item.unitPrice * item.quantity, currency)}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onCloseCheck}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[13.5px] font-black text-white transition-all active:scale-[0.98]"
              style={{ background: 'rgba(16,185,129,0.85)' }}
            >
              <Receipt size={14} /> {COPY.pos.cart.closeCheck}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
