import { useMemo, useState } from 'react'
import { ShoppingBag, ChevronDown, ChevronUp, Phone, StickyNote } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
import {
  useActiveOrders,
  useOrdersByDate,
  useUpdateOrderStatus,
  OrderStatusBadge,
} from '@features/cart'
import type { Order, OrderStatus } from '@core/domain/entities/Order'
import { nextOrderStatus } from '@core/domain/entities/Order'
import { UpgradeGate } from '@features/billing'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { COPY } from '@shared/copy/ui.copy'

type OrdersTab = 'today' | 'history'

const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: COPY.orders.actions.confirm,
  confirmed: COPY.orders.actions.prepare,
  preparing: COPY.orders.actions.ready,
  ready: COPY.orders.actions.deliver,
}

function todayISO(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function DayStats({ orders, currency }: { orders: Order[]; currency: string }) {
  const completed = orders.filter((o) => o.status !== 'cancelled')
  const revenue = completed.reduce((sum, o) => sum + o.subtotal, 0)
  const avgTicket = completed.length > 0 ? revenue / completed.length : 0

  const stats = [
    { label: COPY.orders.stats.orders, value: String(completed.length) },
    { label: COPY.orders.stats.revenue, value: formatCurrency(revenue, currency) },
    { label: COPY.orders.stats.avgTicket, value: formatCurrency(avgTicket, currency) },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{s.label}</p>
          <p className="mt-1 truncate text-xl font-black text-neutral-900">{s.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Order row ────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  isExpanded,
  onToggle,
  onAdvance,
  onCancel,
  isUpdating,
}: {
  order: Order
  isExpanded: boolean
  onToggle: () => void
  onAdvance: (status: OrderStatus) => void
  onCancel: () => void
  isUpdating: boolean
}) {
  const next = nextOrderStatus(order.status)
  const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.dishName}`).join(', ')
  const origin = order.type === 'delivery'
    ? COPY.cart.delivery.delivery
    : order.tableLabel
      ? COPY.cart.forTable(order.tableLabel)
      : order.type === 'table'
        ? COPY.cart.delivery.dineIn
        : COPY.cart.pickup

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50"
      >
        <span className="w-12 shrink-0 text-[13px] font-black tabular-nums text-neutral-700">
          {formatTime(order.createdAt)}
        </span>
        <span className="w-24 shrink-0 truncate text-[12px] font-bold text-neutral-600">{origin}</span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-500">{itemsSummary}</span>
        <span className="shrink-0 text-[13px] font-black text-neutral-900">
          {formatCurrency(order.subtotal, order.currency)}
        </span>
        <OrderStatusBadge status={order.status} />
        {isExpanded ? (
          <ChevronUp size={15} className="shrink-0 text-neutral-400" />
        ) : (
          <ChevronDown size={15} className="shrink-0 text-neutral-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-black/[0.05] bg-neutral-50/60 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            {order.items.map((item, idx) => (
              <div key={`${item.dishId}-${idx}`} className="flex items-center justify-between text-[13px]">
                <span className="text-neutral-700">
                  <strong className="font-black">{item.quantity}x</strong> {item.dishName}
                  {item.variantLabel && (
                    <span className="ml-1.5 text-[11px] text-neutral-400">({item.variantLabel})</span>
                  )}
                </span>
                <span className="font-bold tabular-nums text-neutral-700">
                  {formatCurrency(item.unitPrice * item.quantity, order.currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-neutral-500">
            {order.customerName && <span className="font-semibold">👤 {order.customerName}</span>}
            {order.customerPhone && (
              <a
                href={`tel:${order.customerPhone}`}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
              >
                <Phone size={11} /> {order.customerPhone}
              </a>
            )}
            {order.deliveryAddress && (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                📍 {order.deliveryAddress}
              </span>
            )}
            {order.note && (
              <span className="inline-flex items-center gap-1">
                <StickyNote size={11} /> {order.note}
              </span>
            )}
          </div>

          {(next || (order.status !== 'cancelled' && order.status !== 'delivered')) && (
            <div className="mt-4 flex items-center gap-2">
              {next && NEXT_ACTION_LABEL[order.status] && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onAdvance(next)}
                  className="rounded-xl bg-neutral-900 px-4 py-2 text-[12px] font-black text-white transition-all hover:bg-neutral-700 active:scale-95 disabled:opacity-50"
                >
                  {NEXT_ACTION_LABEL[order.status]} →
                </button>
              )}
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={onCancel}
                  className="rounded-xl border border-red-200 px-4 py-2 text-[12px] font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  {COPY.orders.actions.cancel}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  return (
    <UpgradeGate feature="ordering">
      <OrdersPageContent />
    </UpgradeGate>
  )
}

function OrdersPageContent() {
  const { tenantId } = useTenantContext()
  const [tab, setTab] = useState<OrdersTab>('today')
  const [historyDate, setHistoryDate] = useState(todayISO())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { orders: activeOrders, isLoading: isLoadingActive } = useActiveOrders(tenantId)
  const { data: todayOrders = [], isLoading: isLoadingToday } = useOrdersByDate(
    tenantId,
    tab === 'today' ? todayISO() : historyDate,
  )
  const updateStatus = useUpdateOrderStatus()

  // "Hoy": activos en tiempo real + completados del día (sin duplicar).
  const displayOrders = useMemo(() => {
    if (tab === 'history') return todayOrders
    const activeIds = new Set(activeOrders.map((o) => o.id))
    const finishedToday = todayOrders.filter((o) => !activeIds.has(o.id))
    return [...activeOrders, ...finishedToday]
  }, [tab, activeOrders, todayOrders])

  const currency = displayOrders[0]?.currency ?? 'CRC'
  const isLoading = tab === 'today' ? isLoadingActive && isLoadingToday : isLoadingToday

  function handleAdvance(order: Order, status: OrderStatus): void {
    updateStatus.mutate({ tenantId, orderId: order.id, status })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tabs + date picker */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-black/[0.07] bg-white p-1 shadow-sm">
          {(['today', 'history'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-[12.5px] font-bold transition-colors ${
                tab === t ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {t === 'today' ? COPY.orders.today : COPY.orders.history}
            </button>
          ))}
        </div>

        {tab === 'history' && (
          <input
            type="date"
            value={historyDate}
            max={todayISO()}
            onChange={(e) => setHistoryDate(e.target.value)}
            className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[13px] font-semibold text-neutral-700 shadow-sm outline-none focus:border-neutral-400"
          />
        )}
      </div>

      <DayStats orders={displayOrders} currency={currency} />

      {/* Orders list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-neutral-200/60" />
          ))}
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/[0.1] py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <ShoppingBag size={22} className="text-neutral-400" />
          </div>
          <p className="text-sm font-bold text-neutral-500">
            {tab === 'today' ? COPY.orders.emptyActive : COPY.orders.emptyDate}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {displayOrders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              isExpanded={expandedId === order.id}
              onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
              onAdvance={(status) => handleAdvance(order, status)}
              onCancel={() => handleAdvance(order, 'cancelled')}
              isUpdating={updateStatus.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
