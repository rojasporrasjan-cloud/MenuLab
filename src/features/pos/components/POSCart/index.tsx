import { useState, useEffect } from 'react'
import { Minus, Plus, Send, Receipt, Smartphone, User, MapPin } from 'lucide-react'

import type { Order } from '@core/domain/entities/Order'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { COPY } from '@shared/copy/ui.copy'
import { cn } from '@shared/utils/cn'

import type { POSCartLine } from '../../types/pos.types'
import { useCustomerByPhone } from '@features/crm'
import { useTenantContext } from '@app/providers/TenantProvider'

interface POSCartProps {
  readonly lines: readonly POSCartLine[]
  /** Pedidos ya enviados de la mesa (cuenta acumulada). */
  readonly tableOrders: readonly Order[]
  readonly isSending: boolean
  readonly onQuantityChange: (dishId: string, quantity: number) => void
  readonly onSend: (deliveryData?: {
    type: 'delivery' | 'pickup' | 'table',
    customerPhone: string,
    customerName: string,
    deliveryAddress: string
  }) => void
  readonly onCloseCheck: () => void
  /** Opcional: forzar modo (p. ej. si está en una mesa, no mostrar express) */
  readonly forceTableMode?: boolean
  /** Opcional: modo express manual (no mostrar opción de mesa) */
  readonly isExpressMode?: boolean
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
  forceTableMode = false,
  isExpressMode = false,
}: POSCartProps) {
  const { tenantId } = useTenantContext()
  const currency = lines[0]?.currency ?? tableOrders[0]?.currency ?? DEFAULT_CURRENCY
  const cartTotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
  const unpaidOrders = tableOrders.filter((o) => o.paymentStatus !== 'paid')
  const accountTotal = unpaidOrders.reduce((sum, o) => sum + o.subtotal, 0)

  const [orderType, setOrderType] = useState<'table' | 'delivery' | 'pickup'>('table')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  const { customer } = useCustomerByPhone(tenantId, phone)

  // Autocompletado CRM: aplicamos el nombre encontrado (si el campo está vacío) 
  // usando un timeout para no interrumpir el render.
  useEffect(() => {
    if (customer && !name) {
      const timeout = setTimeout(() => setName(customer.name), 0)
      return () => clearTimeout(timeout)
    }
  }, [customer, name])

  // Reset al cambiar modo o forzar modo mesa
  if (forceTableMode && orderType !== 'table') {
    setOrderType('table')
  } else if (isExpressMode && orderType === 'table') {
    setOrderType('delivery')
  }

  function handleSend() {
    onSend({
      type: orderType,
      customerPhone: phone.trim(),
      customerName: name.trim(),
      deliveryAddress: address.trim(),
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between mb-3">
        <h2
          className="text-[11px] font-black uppercase tracking-[0.18em]"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {COPY.pos.cart.title}
        </h2>
        {!forceTableMode && (
          <div className="flex items-center rounded-full bg-white/5 p-1 ring-1 ring-white/10">
            {!isExpressMode && (
              <button
                type="button"
                onClick={() => setOrderType('table')}
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-bold transition-all",
                  orderType === 'table' ? "bg-indigo-500 text-white" : "text-white/40 hover:text-white"
                )}
              >
                Mesa
              </button>
            )}
            <button
              type="button"
              onClick={() => setOrderType('delivery')}
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold transition-all",
                orderType === 'delivery' ? "bg-amber-500 text-black" : "text-white/40 hover:text-white"
              )}
            >
              Express
            </button>
            <button
              type="button"
              onClick={() => setOrderType('pickup')}
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold transition-all",
                orderType === 'pickup' ? "bg-emerald-500 text-black" : "text-white/40 hover:text-white"
              )}
            >
              Llevar
            </button>
          </div>
        )}
      </div>

      {orderType !== 'table' && (
        <div className="shrink-0 flex flex-col gap-2 mb-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="relative">
            <Smartphone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="tel"
              placeholder="Teléfono del cliente"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl bg-black/20 py-2 pl-8 pr-3 text-[12px] text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>
          <div className="relative">
            <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-black/20 py-2 pl-8 pr-3 text-[12px] text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>
          {orderType === 'delivery' && (
            <div className="relative">
              <MapPin size={13} className="absolute left-3 top-3 text-white/40" />
              <textarea
                placeholder="Dirección de entrega"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl bg-black/20 py-2 pl-8 pr-3 text-[12px] text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>
          )}
        </div>
      )}

      {/* Líneas de la comanda */}
      <div className="min-h-0 flex-1 overflow-y-auto">
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
            onClick={handleSend}
            disabled={isSending || (orderType === 'delivery' && (!name || !phone || !address)) || (orderType === 'pickup' && (!name || !phone))}
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
              {tableOrders.flatMap(o => o.items.map(item => ({ item, isPaid: o.paymentStatus === 'paid' }))).map(({ item, isPaid }, idx) => (
                <div key={idx} className="flex items-start justify-between text-[11px] leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <span className={cn("min-w-0 flex-1 truncate pr-2", isPaid && "opacity-50 line-through")}>
                    <span className="font-bold text-white/60">{item.quantity}x</span> {item.dishName}
                    {item.variantLabel && <span className="ml-1 text-white/30">({item.variantLabel})</span>}
                  </span>
                  <span className={cn("shrink-0 tabular-nums", isPaid && "opacity-50 line-through")}>{formatCurrency(item.unitPrice * item.quantity, currency)}</span>
                </div>
              ))}
            </div>

            {unpaidOrders.length > 0 && (
              <button
                type="button"
                onClick={onCloseCheck}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[13.5px] font-black text-white transition-all active:scale-[0.98]"
                style={{ background: 'rgba(16,185,129,0.85)' }}
              >
                <Receipt size={14} /> {COPY.pos.cart.closeCheck}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

