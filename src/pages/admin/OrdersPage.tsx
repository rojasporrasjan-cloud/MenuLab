import { useMemo, useState } from 'react'
import { ShoppingBag, ChevronDown, ChevronUp, Phone, StickyNote, TrendingUp, Clock, CheckCircle2, History, AlertCircle } from 'lucide-react'
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
import { PageHeader } from '@shared/ui/components/PageHeader'

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

// ─── Header Info ──────────────────────────────────────────────────────────────
function OrdersHeader() {
  return (
    <div className="mb-6">
      <PageHeader
        eyebrow="Operación"
        title="Pedidos"
        subtitle="Controla el flujo de pedidos (local, express, llevar) y avanza su estado."
      />
    </div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function DayStats({ orders, currency }: { orders: Order[]; currency: string }) {
  const completed = orders.filter((o) => o.status !== 'cancelled')
  const revenue = completed.reduce((sum, o) => sum + o.subtotal, 0)
  const avgTicket = completed.length > 0 ? revenue / completed.length : 0

  const stats = [
    { label: COPY.orders.stats.orders, value: String(completed.length), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: COPY.orders.stats.revenue, value: formatCurrency(revenue, currency), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: COPY.orders.stats.avgTicket, value: formatCurrency(avgTicket, currency), icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-black/[0.04] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[11.5px] font-bold uppercase tracking-wider text-neutral-400">{s.label}</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-neutral-900">{s.value}</p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.bg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              <s.icon size={22} className={s.color} />
            </div>
          </div>
          <div className="absolute -right-6 -top-6 z-0 h-24 w-24 rounded-full bg-gradient-to-br from-black/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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
    <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${isExpanded ? 'border-neutral-300 bg-white shadow-md' : 'border-black/[0.06] bg-white shadow-sm hover:border-neutral-200 hover:shadow'}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors ${isExpanded ? 'bg-neutral-50/50' : 'hover:bg-neutral-50'}`}
      >
        <div className="flex flex-col items-center justify-center shrink-0 w-14 rounded-xl bg-neutral-100 py-1.5">
          <Clock size={12} className="text-neutral-400 mb-0.5" />
          <span className="text-[12px] font-black tabular-nums text-neutral-700">
            {formatTime(order.createdAt)}
          </span>
        </div>
        <div className="w-24 shrink-0">
          <span className="inline-block rounded-lg bg-neutral-100 px-2.5 py-1 text-[11.5px] font-bold text-neutral-600">{origin}</span>
        </div>
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-neutral-600">{itemsSummary}</span>
        <span className="shrink-0 text-[15px] font-black text-neutral-900">
          {formatCurrency(order.subtotal, order.currency)}
        </span>
        <div className="shrink-0 w-28 flex justify-end">
          <OrderStatusBadge status={order.status} />
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${isExpanded ? 'bg-neutral-200 text-neutral-700' : 'bg-neutral-100 text-neutral-400'}`}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-black/[0.05] bg-neutral-50/80 p-5">
          <div className="flex flex-col gap-2">
            {order.items.map((item, idx) => (
              <div key={`${item.dishId}-${idx}`} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm border border-black/[0.03]">
                <span className="text-[13.5px] text-neutral-700">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100 font-black text-neutral-800 mr-2">{item.quantity}</span>
                  <span className="font-semibold">{item.dishName}</span>
                  {item.variantLabel && (
                    <span className="ml-2 text-[12px] font-medium text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full border border-neutral-100">
                      {item.variantLabel}
                    </span>
                  )}
                </span>
                <span className="font-bold tabular-nums text-neutral-800 text-[14px]">
                  {formatCurrency(item.unitPrice * item.quantity, order.currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {order.customerName && (
              <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-[12.5px] text-blue-700">
                <span className="font-bold">{order.customerName}</span>
              </div>
            )}
            {order.customerPhone && (
              <a
                href={`tel:${order.customerPhone}`}
                className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-[12.5px] font-bold text-green-700 hover:bg-green-100 transition-colors"
              >
                <Phone size={13} /> {order.customerPhone}
              </a>
            )}
            {order.deliveryAddress && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-[12.5px] font-bold text-emerald-700">
                📍 {order.deliveryAddress}
              </div>
            )}
            {order.note && (
              <div className="flex w-full mt-2 items-start gap-2 rounded-xl border border-amber-200/50 bg-amber-50 p-3 text-[13px] text-amber-800">
                <StickyNote size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <p className="font-medium">{order.note}</p>
              </div>
            )}
          </div>

          {(next || (order.status !== 'cancelled' && order.status !== 'delivered')) && (
            <div className="mt-5 flex items-center justify-end gap-3 pt-4 border-t border-black/[0.05]">
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={onCancel}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-[13px] font-bold text-red-600 transition-colors hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
                >
                  <AlertCircle size={15} />
                  {COPY.orders.actions.cancel}
                </button>
              )}
              {next && NEXT_ACTION_LABEL[order.status] && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onAdvance(next)}
                  className="group flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-2.5 text-[13px] font-black text-white shadow-md shadow-neutral-900/20 transition-all hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {NEXT_ACTION_LABEL[order.status]} 
                  <ChevronDown size={16} className="rotate-[-90deg] transition-transform group-hover:translate-x-1" />
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
    <div className="mx-auto max-w-5xl pb-12">
      <OrdersHeader />

      <div className="flex flex-col gap-6">
        {/* Tabs + date picker */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-2xl bg-neutral-200/50 p-1.5 shadow-inner">
            {(['today', 'history'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition-all duration-300 ${
                  tab === t 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50'
                }`}
              >
                {t === 'today' ? <Clock size={16} /> : <History size={16} />}
                {t === 'today' ? COPY.orders.today : COPY.orders.history}
              </button>
            ))}
          </div>

          {tab === 'history' && (
            <div className="relative">
              <input
                type="date"
                value={historyDate}
                max={todayISO()}
                onChange={(e) => setHistoryDate(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] font-bold text-neutral-700 shadow-sm outline-none transition-colors hover:border-neutral-300 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
              />
            </div>
          )}
        </div>

        <DayStats orders={displayOrders} currency={currency} />

        {/* Orders list */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-neutral-100" />
            ))}
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-100">
              <ShoppingBag size={28} className="text-neutral-300" />
            </div>
            <div>
              <h3 className="text-lg font-black text-neutral-800">No hay pedidos</h3>
              <p className="mt-1 text-[14px] font-medium text-neutral-500">
                {tab === 'today' ? COPY.orders.emptyActive : COPY.orders.emptyDate}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
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
    </div>
  )
}
