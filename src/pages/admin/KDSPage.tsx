import { useTenantContext } from '@app/providers/TenantProvider'
import { useKitchenOrders, KitchenTicket, KDSColumn } from '@features/kds'
import { useUpdateOrderStatus } from '@features/cart'
import { UpgradeGate } from '@features/billing'
import type { Order } from '@core/domain/entities/Order'
import { nextOrderStatus } from '@core/domain/entities/Order'
import { useNow } from '@shared/hooks/useNow'
import { COPY } from '@shared/copy/ui.copy'

const COLUMN_ACCENTS = {
  incoming: '#60a5fa',
  preparing: '#facc15',
  ready: '#4ade80',
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
      <div className="grid h-full grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {COPY.errors.generic}
        </p>
      </div>
    )
  }

  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
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
  )
}
