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
  readonly tenant?: {
    name: string
    branding: {
      logoUrl: string | null
      infoFooter: {
        phone: string | null
        address: string | null
      }
    }
  } | null
}

export function DigitalOrderInvoice({
  order,
  onSendToKitchen,
  onPay,
  onClose,
  isUpdating,
  tenant,
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
        
        {/* Encabezado del Ticket Térmico 80mm */}
        <div className="flex flex-col items-center border-b border-dashed border-white/20 pb-6 text-center print:border-black/30">
          {tenant?.branding.logoUrl && (
            <img 
              src={tenant.branding.logoUrl} 
              alt={tenant.name}
              className="mb-3 h-16 w-16 object-contain grayscale print:h-20 print:w-20"
            />
          )}
          {tenant?.name && (
            <h1 className="text-xl font-black uppercase tracking-widest text-white print:text-black print:text-2xl">
              {tenant.name}
            </h1>
          )}
          {(tenant?.branding.infoFooter.address || tenant?.branding.infoFooter.phone) && (
            <div className="mt-1 flex flex-col items-center text-xs text-neutral-400 print:text-black/80 print:text-[13px]">
              {tenant.branding.infoFooter.address && <p className="max-w-[200px]">{tenant.branding.infoFooter.address}</p>}
              {tenant.branding.infoFooter.phone && <p>Tel: {tenant.branding.infoFooter.phone}</p>}
            </div>
          )}

          <div className="mt-4 mb-2 flex flex-col items-center gap-1">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 print:text-black/60">
              Ticket #{order.id.slice(-5).toUpperCase()}
            </p>
            <h2 className="text-2xl font-black text-white print:text-black print:text-3xl">
              {isDelivery ? 'EXPRESS' : (order.type === 'pickup' ? 'PARA LLEVAR' : 'EN MESA')}
            </h2>
            <p className="text-sm font-medium text-neutral-400 print:text-black/70 print:text-[13px]">
              {new Intl.DateTimeFormat('es-CR', {
                dateStyle: 'short',
                timeStyle: 'short'
              }).format(order.createdAt)}
            </p>
          </div>

          <div className="mt-4 w-full rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 print:bg-transparent print:border print:border-dashed print:border-black/30 print:ring-0 text-left">
            <span className="text-base font-black text-white print:text-black">
              Cliente: {order.customerName || 'Anónimo'}
            </span>
            {order.customerPhone && (
              <p className="mt-0.5 text-sm text-neutral-300 print:text-black/80 font-bold">Tel: {order.customerPhone}</p>
            )}
            {isDelivery && order.deliveryAddress && (
              <p className="mt-2 text-sm leading-relaxed text-neutral-300 print:text-black/80">
                <span className="font-bold block text-xs uppercase text-neutral-500 print:text-black/60">Dirección</span> 
                {order.deliveryAddress}
              </p>
            )}
          </div>
          {order.note && (
            <div className="mt-3 w-full rounded-xl bg-amber-500/10 p-3 ring-1 ring-amber-500/20 print:border print:border-dashed print:border-black/30 print:bg-transparent print:ring-0 text-left">
              <span className="font-bold block text-xs uppercase text-amber-500/80 print:text-black/60 mb-0.5">Nota del Pedido</span>
              <p className="text-sm font-bold text-amber-400 print:text-black">{order.note}</p>
            </div>
          )}
        </div>

        {/* Lista de Items */}
        <div className="py-6">
          <table className="w-full text-left text-sm print:text-black">
            <thead>
              <tr className="border-b border-dashed border-white/20 text-neutral-400 print:border-black/30 print:text-black/60">
                <th className="pb-2 font-bold uppercase tracking-wider text-xs">Cant</th>
                <th className="pb-2 font-bold uppercase tracking-wider text-xs">Descripción</th>
                <th className="pb-2 text-right font-bold uppercase tracking-wider text-xs">Total</th>
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
        <div className="flex flex-col gap-1.5 border-t border-dashed border-white/20 pt-4 text-right print:border-black/30">
          {(order.taxAmount > 0 || order.deliveryCost > 0) && (
            <div className="flex justify-between text-[13px] font-bold text-neutral-400 print:text-black/70">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal, order.currency)}</span>
            </div>
          )}
          {order.deliveryCost > 0 && (
            <div className="flex justify-between text-[13px] font-bold text-neutral-400 print:text-black/70">
              <span>Envío (Express)</span>
              <span>{formatCurrency(order.deliveryCost, order.currency)}</span>
            </div>
          )}
          {order.taxAmount > 0 && (
            <div className="flex justify-between text-[13px] font-bold text-neutral-400 print:text-black/70">
              <span>IVA (13%)</span>
              <span>{formatCurrency(order.taxAmount, order.currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-black text-white print:text-black mt-2 print:text-3xl">
            <span>TOTAL</span>
            <span>{formatCurrency(order.total, order.currency)}</span>
          </div>
        </div>

        {/* Mensaje final Ticket */}
        <div className="mt-8 text-center text-xs font-bold text-neutral-500 print:text-black/60 uppercase tracking-widest hidden print:block">
          <p>¡Gracias por su compra!</p>
          <p className="mt-1">Powered by Menu Rustica</p>
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
