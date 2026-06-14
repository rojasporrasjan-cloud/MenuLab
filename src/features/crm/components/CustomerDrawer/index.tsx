import { useState } from 'react';
import { X, Phone, ShoppingBag, Wallet, Receipt, CalendarDays } from 'lucide-react';

import type { Customer } from '@core/domain/entities/Customer';
import { OrderStatusBadge } from '@features/cart';
import { formatCurrency } from '@shared/utils/formatCurrency';
import { COPY } from '@shared/copy/ui.copy';
import { Z } from '@shared/design-tokens';

import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import { useUpdateCustomerNote } from '../../hooks/useUpdateCustomerNote';
import { CustomerTags } from '../CustomerTags';

interface CustomerDrawerProps {
  readonly tenantId: string;
  readonly customer: Customer;
  readonly onClose: () => void;
}

function formatDate(date: Date | null): string {
  if (!date) return COPY.crm.neverOrdered;
  return date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Drawer lateral con perfil del cliente, historial de pedidos y nota interna. */
export function CustomerDrawer({ tenantId, customer, onClose }: CustomerDrawerProps) {
  const { data: orders = [], isLoading: isLoadingOrders } = useCustomerOrders(
    tenantId,
    customer.phone
  );
  const updateNote = useUpdateCustomerNote();
  const [note, setNote] = useState(customer.note ?? '');

  // Al cambiar de cliente, recargar su nota (ajustar estado durante el render,
  // sin useEffect — patrón recomendado por React para sincronizar con props).
  const [trackedCustomerId, setTrackedCustomerId] = useState(customer.id);
  if (customer.id !== trackedCustomerId) {
    setTrackedCustomerId(customer.id);
    setNote(customer.note ?? '');
  }

  const stats = [
  { icon: ShoppingBag, label: COPY.crm.table.orders, value: String(customer.totalOrders) },
  {
    icon: Wallet,
    label: COPY.crm.table.spent,
    value: formatCurrency(customer.totalSpent, customer.currency)
  },
  {
    icon: Receipt,
    label: COPY.crm.table.avgTicket,
    value: formatCurrency(customer.averageTicket, customer.currency)
  }];


  function handleSaveNote() {
    updateNote.mutate({ tenantId, customerId: customer.id, note });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        style={{ zIndex: Z.overlay }}
        onClick={onClose}
        aria-hidden="true" />
      

      {/* Panel */}
      <aside
        role="dialog"
        aria-label={customer.name || customer.phone}
        className="fixed inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
        style={{ zIndex: Z.modal }}>
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-neutral-900">
              {customer.name || customer.phone}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-neutral-500">
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline">
                
                <Phone size={11} /> {customer.phone}
              </a>
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={11} /> {COPY.crm.drawer.memberSince}{' '}
                {formatDate(customer.firstOrderAt)}
              </span>
            </div>
            <div className="mt-2">
              <CustomerTags customer={customer} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={COPY.crm.drawer.close}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700">
            
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            {stats.map((s) =>
            <div key={s.label} className="rounded-xl border border-black/[0.06] bg-neutral-50 p-3">
                <s.icon size={13} className="text-neutral-400" />
                <p className="mt-1 truncate text-[13px] font-black text-neutral-900">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  {s.label}
                </p>
              </div>
            )}
          </div>

          {/* Nota interna */}
          <div className="mt-5">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
              {COPY.crm.drawer.noteTitle}
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={COPY.crm.drawer.notePlaceholder}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-[13px] text-neutral-800 outline-none transition-colors focus:border-neutral-400" />
            
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={updateNote.isPending || note === (customer.note ?? '')}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-[12px] font-black text-white transition-all hover:bg-neutral-700 active:scale-95 disabled:opacity-40">
                
                {COPY.crm.drawer.noteSave}
              </button>
              {updateNote.isSuccess && note === (customer.note ?? '') &&
              <span className="text-[11px] font-bold text-emerald-600">
                  {COPY.crm.drawer.noteSaved}
                </span>
              }
            </div>
          </div>

          {/* Historial */}
          <div className="mt-6">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
              {COPY.crm.drawer.ordersTitle}
            </h3>

            {isLoadingOrders ?
            <div className="mt-3 flex flex-col gap-2">
                {[1, 2, 3].map((i) =>
              <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100" />
              )}
              </div> :
            orders.length === 0 ?
            <p className="mt-3 rounded-xl border border-dashed border-black/[0.1] px-4 py-6 text-center text-[12px] text-neutral-400">
                {COPY.crm.drawer.ordersEmpty}
              </p> :

            <div className="mt-3 flex flex-col gap-2">
                {orders.map((order) =>
              <div key={order.id} className="rounded-xl border border-black/[0.06] bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-neutral-500">
                        {formatDate(order.createdAt)}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1.5 truncate text-[12.5px] text-neutral-600">
                      {order.items.map((i) => `${i.quantity}x ${i.dishName}`).join(', ')}
                    </p>
                    <p className="mt-1 text-[13px] font-black text-neutral-900">
                      {formatCurrency(order.subtotal, order.currency)}
                    </p>
                  </div>
              )}
              </div>
            }
          </div>
        </div>
      </aside>
    </>);

}