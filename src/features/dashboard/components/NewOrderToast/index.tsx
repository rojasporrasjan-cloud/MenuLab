import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X } from 'lucide-react';

import type { Order } from '@core/domain/entities/Order';
import { useActiveOrders } from '@features/cart';
import { playNewOrderBeep } from '@shared/utils/beep';
import { formatCurrency } from '@shared/utils/formatCurrency';
import { ROUTES } from '@shared/constants/routes';
import { Z } from '@shared/design-tokens';

interface NewOrderToastProps {
  readonly tenantId: string;
}

const TOAST_DISMISS_MS = 8000;

/**
 * Toast con beep al llegar un pedido nuevo (en cualquier página del admin).
 * Click → /admin/pedidos. Se descarta solo tras unos segundos.
 */
export function NewOrderToast({ tenantId }: NewOrderToastProps) {
  const { orders } = useActiveOrders(tenantId);
  const navigate = useNavigate();
  const knownIds = useRef<Set<string> | null>(null);
  const [toast, setToast] = useState<Order | null>(null);

  useEffect(() => {
    // Primer snapshot: registrar lo existente sin sonar.
    if (knownIds.current === null) {
      knownIds.current = new Set(orders.map((o) => o.id));
      return;
    }

    const fresh = orders.find((o) => !(knownIds.current?.has(o.id) ?? false));
    for (const order of orders) knownIds.current.add(order.id);

    if (fresh) {
      playNewOrderBeep();
      setToast(fresh);
      const timer = setTimeout(() => setToast(null), TOAST_DISMISS_MS);
      return () => clearTimeout(timer);
    }
  }, [orders]);

  if (!toast) return null;

  const itemsSummary = toast.items.map((i) => `${i.quantity}x ${i.dishName}`).join(', ');

  return (
    <div
      className="fixed bottom-4 right-4 w-[320px] max-w-[calc(100vw-2rem)]"
      style={{ zIndex: Z.toast }}
      role="status"
      aria-live="polite">
      
      <div className="flex items-start gap-3 rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-xl">
        <button
          type="button"
          onClick={() => {
            setToast(null);
            void navigate(ROUTES.admin.orders);
          }}
          className="flex min-w-0 flex-1 items-start gap-3 text-left">
          
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <ShoppingBag size={15} className="text-emerald-600" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-black text-neutral-900">
              ¡Pedido nuevo!{' '}
              <span className="font-bold text-neutral-500">
                {formatCurrency(toast.subtotal, toast.currency)}
              </span>
            </span>
            <span className="mt-0.5 block truncate text-[12px] text-neutral-500">
              {itemsSummary}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setToast(null)}
          aria-label="Cerrar notificación"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-neutral-300 transition-colors hover:text-neutral-600">
          
          <X size={13} />
        </button>
      </div>
    </div>);

}