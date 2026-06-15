import type { Order } from '@core/domain/entities/Order'
import { ORDER_STATUS } from '@core/domain/entities/Order'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { cn } from '@shared/utils/cn'
import { Clock, Smartphone, MapPin, CheckCircle2 } from 'lucide-react'

interface DigitalOrderGridProps {
  readonly orders: readonly Order[]
  readonly onSelect: (order: Order) => void
}

export function DigitalOrderGrid({ orders, onSelect }: DigitalOrderGridProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-60">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-800">
          <CheckCircle2 size={32} className="text-neutral-500" />
        </div>
        <p className="mt-4 text-[13px] font-bold text-neutral-400">No hay pedidos pendientes de Mostrador/WhatsApp</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {orders.map((order) => {
        const isDelivery = order.type === 'delivery'
        const Icon = isDelivery ? MapPin : Smartphone
        const isReady = order.status === ORDER_STATUS.ready
        const isPreparing = order.status === ORDER_STATUS.preparing

        return (
          <button
            key={order.id}
            type="button"
            onClick={() => onSelect(order)}
            className="group relative flex flex-col items-start gap-4 rounded-3xl bg-neutral-900/40 p-5 text-left ring-1 ring-white/5 backdrop-blur-sm transition-all hover:bg-neutral-800/60 hover:ring-white/20 active:scale-95"
          >
            {/* Status indicator */}
            <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-950/50 ring-1 ring-white/5">
              {isReady && <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
              {isPreparing && <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />}
              {!isReady && !isPreparing && <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />}
            </div>

            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl ring-1",
                isDelivery ? "bg-amber-500/10 text-amber-400 ring-amber-500/20" : "bg-blue-500/10 text-blue-400 ring-blue-500/20"
              )}>
                <Icon size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  {isDelivery ? 'Delivery' : 'Para Llevar'}
                </span>
                <span className="text-[14px] font-bold text-neutral-200 line-clamp-1">
                  {order.customerName || 'Cliente anónimo'}
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-1.5 border-t border-white/5 pt-3">
              <div className="flex items-center justify-between text-[12px] text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-neutral-500" />
                  <span>
                    {new Intl.DateTimeFormat('es-CR', { hour: 'numeric', minute: '2-digit' }).format(order.createdAt)}
                  </span>
                </div>
                <span className="font-bold text-white">
                  {formatCurrency(order.subtotal, order.currency)}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 line-clamp-1">
                {order.items.map(i => `${i.quantity}x ${i.dishName}`).join(', ')}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
