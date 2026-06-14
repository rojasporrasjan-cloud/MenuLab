import { Info, ChefHat } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
import { useKitchenOrders, KitchenTicket, KDSColumn } from '@features/kds'
import { useUpdateOrderStatus } from '@features/cart'
import { UpgradeGate } from '@features/billing'
import type { Order } from '@core/domain/entities/Order'
import { nextOrderStatus } from '@core/domain/entities/Order'
import { useNow } from '@shared/hooks/useNow'
import { COPY } from '@shared/copy/ui.copy'

const COLUMN_ACCENTS = {
  incoming: '#3b82f6', // blue-500
  preparing: '#f59e0b', // amber-500
  ready: '#10b981', // emerald-500
} as const

export default function KDSPage() {
  return (
    <UpgradeGate feature="kds" dark>
      <KDSPageContent />
    </UpgradeGate>
  )
}

function KDSPageContent() {
  const { tenantId } = useTenantContext()
  const { board, isLoading, error } = useKitchenOrders(tenantId)
  const updateStatus = useUpdateOrderStatus()
  const now = useNow()

  function handleAdvance(order: Order): void {
    const next = nextOrderStatus(order.status)
    if (!next) return
    updateStatus.mutate({ tenantId, orderId: order.id, status: next })
  }

  function renderTickets(orders: Order[]) {
    return orders.map((order) => (
      <KitchenTicket
        key={order.id}
        order={order}
        now={now}
        onAdvance={() => handleAdvance(order)}
        isUpdating={updateStatus.isPending}
      />
    ))
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="grid h-full grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
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
    <div className="flex h-full flex-col gap-6 pb-4 pt-2">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-inner">
            <ChefHat size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Pantalla KDS</h1>
            <p className="text-[14px] font-medium text-neutral-400">Cocina en tiempo real</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 sm:items-center">
          <Info size={18} className="mt-0.5 shrink-0 text-blue-400 sm:mt-0" />
          <p className="text-[13px] font-medium leading-tight text-blue-100">
            <strong className="font-bold text-white">Tip:</strong> Toca el botón inferior de cada ticket para avanzarlo a la siguiente columna. Los tickets cambian de color según el tiempo de espera.
          </p>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 md:grid-cols-3">
        <KDSColumn
          title={COPY.kds.columns.incoming}
          count={board.incoming.length}
          accentColor={COLUMN_ACCENTS.incoming}
        >
          {renderTickets(board.incoming)}
        </KDSColumn>
        <KDSColumn
          title={COPY.kds.columns.preparing}
          count={board.preparing.length}
          accentColor={COLUMN_ACCENTS.preparing}
        >
          {renderTickets(board.preparing)}
        </KDSColumn>
        <KDSColumn
          title={COPY.kds.columns.ready}
          count={board.ready.length}
          accentColor={COLUMN_ACCENTS.ready}
        >
          {renderTickets(board.ready)}
        </KDSColumn>
      </div>
    </div>
  )
}
