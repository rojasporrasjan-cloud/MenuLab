import { QrCode, Eye, Cuboid, AlertCircle, Activity, ShoppingCart, Receipt, Star, MousePointerClick } from 'lucide-react'
import { Spinner }    from '@shared/ui/components/Spinner'
import type { AnalyticsEvent, AnalyticsEventType } from '@core/domain/entities/AnalyticsEvent'

interface ActivityFeedProps {
  events:    AnalyticsEvent[]
  isLoading: boolean
  error:     string | null
}

// Paleta semántica por tipo de evento (categórica, intencionalmente variada).
const EVENT_META: Record<AnalyticsEventType, { label: string; icon: typeof QrCode; iconBg: string; iconColor: string }> = {
  qr_scan:   { label: 'Escaneo de QR',  icon: QrCode,       iconBg: 'rgba(59,130,246,0.1)',   iconColor: '#2563eb' },
  menu_view: { label: 'Vista de menú',  icon: Eye,          iconBg: 'rgba(233,154,14,0.1)',   iconColor: '#cc7809' },
  dish_view: { label: 'Vista de plato', icon: Eye,          iconBg: 'rgba(16,185,129,0.1)',   iconColor: '#059669' },
  ar_launch: { label: 'Lanzamiento AR', icon: Cuboid,       iconBg: 'rgba(139,92,246,0.1)',   iconColor: '#7c3aed' },
  ar_error:  { label: 'Error AR',       icon: AlertCircle,  iconBg: 'rgba(239,68,68,0.08)',   iconColor: '#dc2626' },
  cart_add:       { label: 'Añadido al carrito',  icon: ShoppingCart,      iconBg: 'rgba(232,93,4,0.1)',    iconColor: '#e85d04' },
  order_created:  { label: 'Pedido creado',       icon: Receipt,           iconBg: 'rgba(22,163,74,0.1)',   iconColor: '#16a34a' },
  featured_view:  { label: 'Vista de destacado',  icon: Star,              iconBg: 'rgba(234,179,8,0.12)',  iconColor: '#ca8a04' },
  featured_click: { label: 'Click en destacado',  icon: MousePointerClick, iconBg: 'rgba(14,165,233,0.1)', iconColor: '#0284c7' },
}

function formatRelativeTime(date: Date): string {
  const diffMs  = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60)    return 'ahora'
  if (diffSec < 3600)  return `${Math.floor(diffSec / 60)}min`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`
  return `${Math.floor(diffSec / 86400)}d`
}

function EventRow({ event }: { event: AnalyticsEvent }) {
  const meta = EVENT_META[event.type]
  const Icon = meta.icon

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ background: meta.iconBg }}
      >
        <Icon size={13} strokeWidth={1.8} style={{ color: meta.iconColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-surface-700">
          {meta.label}
        </p>
        {event.tableId && (
          <p className="text-[11px] text-surface-400">
            Mesa {event.tableId}
          </p>
        )}
      </div>
      <span className="shrink-0 text-[11px] tabular-nums text-surface-300">
        {formatRelativeTime(event.timestamp)}
      </span>
    </div>
  )
}

export function ActivityFeed({ events, isLoading, error }: ActivityFeedProps) {
  return (
    <div className="rounded-2xl border border-surface-150 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-600">
          Actividad reciente
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[11px] text-surface-400">En vivo</span>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Spinner size="sm" />
        </div>
      )}

      {error && !isLoading && (
        <p className="py-4 text-center text-[12px] text-surface-400">{error}</p>
      )}

      {!isLoading && !error && events.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-50">
            <Activity size={17} strokeWidth={1.5} className="text-surface-300" />
          </div>
          <p className="text-[13px] font-medium text-surface-400">
            Sin actividad reciente
          </p>
          <p className="text-center text-[11px] text-surface-300">
            Los eventos aparecen aquí en tiempo real.
          </p>
        </div>
      )}

      {!isLoading && !error && events.length > 0 && (
        <div className="divide-y divide-surface-100 border-t border-surface-100">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
