import { Printer, ChefHat, Receipt } from 'lucide-react'
import { formatCurrency } from '@shared/utils/formatCurrency'
import type { Order } from '@core/domain/entities/Order'
import { ORDER_STATUS } from '@core/domain/entities/Order'

interface DigitalOrderInvoiceProps {
  readonly order: Order
  readonly onSendToKitchen: () => void
  readonly onPay: () => void
  readonly onClose: () => void
  readonly isUpdating: boolean
}

export function DigitalOrderInvoice({
  order,
  onSendToKitchen,
  onPay,
  onClose,
  isUpdating
}: DigitalOrderInvoiceProps) {
  const isPending = order.status === ORDER_STATUS.pending
  
  const canSendToKitchen = isPending
  const isDelivery = order.type === 'delivery'

  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-lg rounded-3xl bg-neutral-900/50 p-8 shadow-xl ring-1 ring-white/10 backdrop-blur-sm print:m-0 print:max-w-none print:rounded-none print:bg-white print:p-0 print:shadow-none print:ring-0">
        
        {/* Encabezado del Ticket */}
        <div className="flex flex-col items-center border-b border-white/10 pb-6 text-center print:border-black/20">
          <h2 className="text-2xl font-black text-white print:text-black">
            {isDelivery ? 'Delivery' : 'Para Llevar'}
          </h2>
          <p className="mt-1 text-sm font-medium text-neutral-400 print:text-black/70">
            {new Intl.DateTimeFormat('es-CR', {
              dateStyle: 'short',
              timeStyle: 'short'
            }).format(order.createdAt)}
          </p>
          <div className="mt-4 rounded-xl bg-white/5 px-4 py-2 ring-1 ring-white/10 print:bg-transparent print:ring-0">
            <span className="text-lg font-black text-white print:text-black">
              {order.customerName || 'Cliente Anónimo'}
            </span>
            {order.customerPhone && (
              <p className="mt-1 text-sm text-neutral-300 print:text-black/80">{order.customerPhone}</p>
            )}
          </div>
          {isDelivery && order.deliveryAddress && (
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-300 print:text-black/80">
              <span className="font-bold">Dirección:</span> {order.deliveryAddress}
            </p>
          )}
          {order.note && (
            <div className="mt-4 rounded-xl bg-amber-500/10 p-3 ring-1 ring-amber-500/20 print:border print:border-dashed print:border-black/30 print:bg-transparent print:ring-0">
              <p className="text-sm font-bold text-amber-400 print:text-black">Nota: {order.note}</p>
            </div>
          )}
        </div>

        {/* Lista de Items */}
        <div className="py-6">
          <table className="w-full text-left text-sm print:text-black">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400 print:border-black/20 print:text-black/60">
                <th className="pb-3 font-bold">Cant</th>
                <th className="pb-3 font-bold">Descripción</th>
                <th className="pb-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 print:divide-black/10">
              {order.items.map((item, idx) => (
                <tr key={idx} className="text-neutral-200 print:text-black">
                  <td className="py-3 font-bold tabular-nums">{item.quantity}</td>
                  <td className="py-3">
                    <span className="font-bold">{item.dishName}</span>
                    {item.variantLabel && (
                      <span className="ml-1 text-xs text-neutral-500 print:text-black/60">({item.variantLabel})</span>
                    )}
                    {item.note && (
                      <p className="mt-0.5 text-xs text-amber-400/80 print:text-black/80">Nota: {item.note}</p>
                    )}
                  </td>
                  <td className="py-3 text-right font-black tabular-nums">
                    {formatCurrency(item.unitPrice * item.quantity, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="flex flex-col gap-2 border-t border-white/10 pt-6 text-right print:border-black/20">
          <div className="flex justify-between text-sm font-bold text-neutral-400 print:text-black/70">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal, order.currency)}</span>
          </div>
          <div className="flex justify-between text-xl font-black text-white print:text-black">
            <span>Total</span>
            <span>{formatCurrency(order.subtotal, order.currency)}</span>
          </div>
        </div>

        {/* Botones de Acción (Ocultos en impresión) */}
        <div className="mt-8 flex flex-col gap-3 print:hidden">
          {canSendToKitchen && (
            <button
              type="button"
              onClick={onSendToKitchen}
              disabled={isUpdating}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 py-3.5 text-[14px] font-black text-white transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:opacity-50"
            >
              <ChefHat size={18} />
              Aceptar y Enviar a Cocina
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-3 text-[13px] font-bold text-white transition-all hover:bg-white/15 active:scale-95"
            >
              <Printer size={16} />
              Imprimir Ticket
            </button>
            <button
              type="button"
              onClick={onPay}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 py-3 text-[13px] font-black text-white transition-all hover:bg-emerald-600 active:scale-95"
            >
              <Receipt size={16} />
              Cobrar
            </button>
          </div>
          
          <button
             type="button"
             onClick={onClose}
             className="mt-2 text-center text-xs font-bold text-neutral-500 hover:text-white"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}
