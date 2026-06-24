import { useMemo, useEffect, useRef } from 'react'
import { Info, Truck } from 'lucide-react'
import { playNotificationBeep, speakNewOrder } from '@shared/utils/beep'
import { useTenantContext } from '@app/providers/TenantProvider'
import { useActiveOrders, useUpdateOrderStatus } from '@features/cart'
import { UpgradeGate } from '@features/billing'
import type { Order } from '@core/domain/entities/Order'
import { ORDER_STATUS } from '@core/domain/entities/Order'
import { useNow } from '@shared/hooks/useNow'
import { COPY } from '@shared/copy/ui.copy'
import { TerminalLockButton } from '@shared/ui/components/TerminalLockButton'
import { KitchenTicket, KDSColumn } from '@features/kds'

const COLUMN_ACCENTS = {
  preparing: '#f59e0b', // amber-500
  ready: '#10b981', // emerald-500
  dispatching: '#3b82f6', // blue-500
} as const

export default function DispatcherPage() {
  return (
    <UpgradeGate feature="pos" dark>
      <DispatcherPageContent />
    </UpgradeGate>
  )
}

function DispatcherPageContent() {
  const { tenantId } = useTenantContext()
  const { orders, isLoading, error } = useActiveOrders(tenantId)
  const updateStatus = useUpdateOrderStatus()
  const now = useNow()

  const { preparing, ready } = useMemo(() => {
    // Solo pedidos que NO son de mesa (delivery o pickup)
    const expressOrders = orders.filter((o) => o.type !== 'table')
    
    return {
      preparing: expressOrders.filter(
        (o) => o.status === ORDER_STATUS.confirmed || o.status === ORDER_STATUS.preparing
      ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      ready: expressOrders.filter(
        (o) => o.status === ORDER_STATUS.ready
      ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    }
  }, [orders])

  const knownReadyIds = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (isLoading) return
    const currentReadyIds = new Set(ready.map(o => o.id))

    if (knownReadyIds.current !== null) {
      const previous = knownReadyIds.current
      const hasNewReady = ready.some(o => !previous.has(o.id))
      
      if (hasNewReady) {
        playNotificationBeep()
        speakNewOrder('Pedido listo para despachar')
      }
    }
    
    knownReadyIds.current = currentReadyIds
  }, [ready, isLoading])

  function handleDispatch(order: Order): void {
    const next = order.paymentStatus === 'paid' ? ORDER_STATUS.completed : ORDER_STATUS.delivered
    updateStatus.mutate({ tenantId, orderId: order.id, status: next })
  }

  function renderTickets(ticketList: Order[], action?: (order: Order) => void, actionLabel?: string) {
    return ticketList.map((order) => (
      <KitchenTicket
        key={order.id}
        order={order}
        now={now}
        onAdvance={action ? () => action(order) : undefined}
        customAdvanceLabel={actionLabel}
        isUpdating={updateStatus.isPending}
      />
    ))
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="grid h-full grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-3xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-[14px] font-bold text-red-400">
          {COPY.errors.generic}
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col gap-6 pb-4 pt-2 md:h-full">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 shadow-inner">
            <Truck size={24} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Despachos</h1>
            <p className="text-[14px] font-medium text-neutral-400">Envíos y Para Llevar</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <TerminalLockButton modeToSet="kds" />
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 sm:items-center">
            <Info size={18} className="mt-0.5 shrink-0 text-amber-400 sm:mt-0" />
            <p className="text-[13px] font-medium leading-tight text-amber-100">
              <strong className="font-bold text-white">Despacho:</strong> Marca los pedidos como 'Despachado' una vez entregados al repartidor o cliente.
            </p>
          </div>
        </div>
      </header>

      <div className="flex md:grid min-h-0 flex-1 flex-row md:flex-col lg:grid-cols-2 gap-5 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-4">
        <div className="w-[85vw] shrink-0 snap-center md:w-auto md:flex-1 flex flex-col min-h-0">
          <KDSColumn
            title="Preparando en Cocina"
            count={preparing.length}
            accentColor={COLUMN_ACCENTS.preparing}
          >
            {/* No permitimos avanzar desde aquí, lo hace cocina. Solo es para visualizar. */}
            {renderTickets(preparing)}
          </KDSColumn>
        </div>
        <div className="w-[85vw] shrink-0 snap-center md:w-auto md:flex-1 flex flex-col min-h-0">
          <KDSColumn
            title="Listo para Despachar"
            count={ready.length}
            accentColor={COLUMN_ACCENTS.ready}
          >
            {/* Aquí el botón dirá "Despachar" y pasará a delivered */}
            {renderTickets(ready, handleDispatch, "Despachar / Entregado")}
          </KDSColumn>
        </div>
      </div>
    </div>
  )
}
