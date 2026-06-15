import { useMemo, useState } from 'react'
import { ArrowLeft, Lock, Info, MonitorSpeaker } from 'lucide-react'

import type { Order } from '@core/domain/entities/Order'
import type { Dish } from '@core/domain/entities/Dish'
import type { Table } from '@core/domain/entities/Table'
import type { NewOrder } from '@core/domain/entities/Order'
import { ORDER_STATUS } from '@core/domain/entities/Order'
import type { PaymentMethod } from '@core/domain/entities/Payment'
import { useTenantContext } from '@app/providers/TenantProvider'
import {
  usePOSSession,
  usePOSOrders,
  useCloseCheck,
  EmployeePINModal,
  POSCart,
  CheckCloser,
} from '@features/pos'
import type { POSCartLine } from '@features/pos'
import { TableGrid } from '@features/pos/components/TableGrid'
import { DigitalOrderGrid } from '@features/pos/components/DigitalOrderGrid'
import { POSMenu } from '@features/pos/components/POSMenu'
import { TerminalLockButton } from '@shared/ui/components/TerminalLockButton'
import { useCreateOrder } from '@features/cart'
import { useTables } from '@features/qr'
import { useAdminMenus, useAdminDishes, useAdminCategories } from '@features/dishes'
import { UpgradeGate } from '@features/billing'
import { COPY } from '@shared/copy/ui.copy'

// ─── Page (gated) ─────────────────────────────────────────────────────────────

export default function POSPage() {
  return (
    <UpgradeGate feature="pos" dark>
      <POSPageContent />
    </UpgradeGate>
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────

function POSPageContent() {
  const { tenant, tenantId } = useTenantContext()
  const { session, isValidating, error, unlock, lock } = usePOSSession(tenant)

  if (!session) {
    return (
      <EmployeePINModal
        isValidating={isValidating}
        error={error}
        onSubmit={(pin) => {
          void unlock(pin)
        }}
      />
    )
  }

  return (
    <POSWorkspace
      tenantId={tenantId}
      employeeName={session.employeeName}
      createdBy={session.employeeId ?? session.employeeName}
      onLock={lock}
    />
  )
}

// ─── Workspace (desbloqueado) ─────────────────────────────────────────────────

interface POSWorkspaceProps {
  readonly tenantId: string
  readonly employeeName: string
  readonly createdBy: string
  readonly onLock: () => void
}

function POSWorkspace({ tenantId, employeeName, createdBy, onLock }: POSWorkspaceProps) {
  const { data: tables = [] } = useTables(tenantId)
  const { ordersByTable, digitalOrders, tableState } = usePOSOrders(tenantId)

  const { data: menus = [] } = useAdminMenus(tenantId)
  const menuId = menus[0]?.id ?? null
  const { data: dishes = [] } = useAdminDishes(tenantId, menuId)
  const { data: categories = [] } = useAdminCategories(tenantId, menuId)

  const [viewMode, setViewMode] = useState<'tables' | 'digital'>('tables')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedDigitalOrder, setSelectedDigitalOrder] = useState<Order | null>(null)
  const [cartLines, setCartLines] = useState<POSCartLine[]>([])
  const [isClosingCheck, setIsClosingCheck] = useState(false)

  const createOrder = useCreateOrder()
  const closeCheck = useCloseCheck()

  const tableOrders = useMemo(() => {
    if (selectedDigitalOrder) return [selectedDigitalOrder]
    if (selectedTable) return ordersByTable.get(selectedTable.id) ?? []
    return []
  }, [selectedTable, selectedDigitalOrder, ordersByTable])

  function handleAddDish(dish: Dish) {
    setCartLines((prev) => {
      const existing = prev.find((l) => l.dishId === dish.id)
      if (existing) {
        return prev.map((l) =>
          l.dishId === dish.id ? { ...l, quantity: l.quantity + 1 } : l,
        )
      }
      return [
        ...prev,
        {
          dishId: dish.id,
          dishName: dish.name,
          unitPrice: dish.price.amount,
          currency: dish.price.currency,
          quantity: 1,
        },
      ]
    })
  }

  function handleQuantityChange(dishId: string, quantity: number) {
    setCartLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.dishId !== dishId)
        : prev.map((l) => (l.dishId === dishId ? { ...l, quantity } : l)),
    )
  }

  function handleSendToKitchen() {
    if (!selectedTable || cartLines.length === 0) return
    const firstLine = cartLines[0]
    if (!firstLine) return

    const order: NewOrder = {
      tenantId,
      tableId: selectedTable.id,
      tableLabel: selectedTable.label ?? selectedTable.number,
      type: 'table',
      items: cartLines.map((l) => ({
        dishId: l.dishId,
        dishName: l.dishName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        variantLabel: null,
        note: null,
      })),
      subtotal: cartLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
      currency: firstLine.currency,
      customerName: employeeName,
      customerPhone: null,
      deliveryAddress: null,
      note: null,
      // Comandero: el pedido nace confirmado (lo tomó un empleado en sala).
      status: ORDER_STATUS.confirmed,
    }

    createOrder.mutate(order, { onSuccess: () => setCartLines([]) })
  }

  function handleConfirmPayment(input: {
    method: PaymentMethod
    reference: string | null
    cashGiven: number | null
  }) {
    closeCheck.mutate({
      tenantId,
      orders: tableOrders,
      method: input.method,
      reference: input.reference,
      cashGiven: input.cashGiven,
      createdBy,
    })
  }

  function handleCloseCheckModal() {
    setIsClosingCheck(false)
    closeCheck.reset()
    if (closeCheck.isSuccess) {
      setSelectedTable(null)
      setSelectedDigitalOrder(null)
    }
  }

  // ── Vista: grid de mesas o digital ──
  if (!selectedTable && !selectedDigitalOrder) {
    return (
      <div className="flex h-full flex-col gap-6 overflow-y-auto pb-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-neutral-900/50 p-6 ring-1 ring-white/5 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 shadow-inner ring-1 ring-indigo-500/30">
              <MonitorSpeaker size={28} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">{COPY.pos.tables.title}</h1>
              <div className="mt-1 flex items-center rounded-full bg-neutral-950/50 p-1 ring-1 ring-white/10 w-fit">
                <button
                  type="button"
                  onClick={() => setViewMode('tables')}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[12px] font-bold transition-all",
                    viewMode === 'tables' ? "bg-indigo-500 text-white shadow-md" : "text-neutral-400 hover:text-white"
                  )}
                >
                  🍽️ Salón
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('digital')}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-bold transition-all",
                    viewMode === 'digital' ? "bg-indigo-500 text-white shadow-md" : "text-neutral-400 hover:text-white"
                  )}
                >
                  🛵 Mostrador / Delivery
                  {digitalOrders.length > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
                      {digitalOrders.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex items-center gap-3">
              <TerminalLockButton modeToSet="pos" />
              <button
                type="button"
                onClick={onLock}
                className="group inline-flex w-fit items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-white/10 ring-1 ring-white/10 hover:ring-white/20"
              >
                <Lock size={14} className="text-neutral-400 group-hover:text-white transition-colors" />
                <span>{COPY.pos.pin.lock}</span>
                <span className="text-neutral-500">·</span>
                <span className="text-indigo-300">{employeeName}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-neutral-400">
              <Info size={14} className="text-indigo-400/70" />
              <p>Selecciona una mesa para tomar la orden o cobrarla.</p>
            </div>
          </div>
        </header>

        {viewMode === 'tables' ? (
          <TableGrid
            tables={tables}
            stateOf={tableState}
            accountSizeOf={(tableId) => ordersByTable.get(tableId)?.length ?? 0}
            onSelect={setSelectedTable}
          />
        ) : (
          <DigitalOrderGrid
            orders={digitalOrders}
            onSelect={setSelectedDigitalOrder}
          />
        )}
      </div>
    )
  }

  // ── Vista: menú + comanda de la mesa / pedido ──
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 items-center justify-between rounded-2xl bg-neutral-900/40 p-4 ring-1 ring-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setSelectedTable(null)
              setSelectedDigitalOrder(null)
              setCartLines([])
            }}
            className="group flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-all hover:bg-white/10 ring-1 ring-white/10"
          >
            <ArrowLeft size={18} className="text-neutral-300 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {selectedTable 
                ? (selectedTable.label ?? COPY.table.label(selectedTable.number))
                : selectedDigitalOrder?.customerName 
                  ? `Delivery: ${selectedDigitalOrder.customerName}`
                  : 'Pedido de Mostrador'
              }
            </h1>
            <p className="text-[12px] font-medium text-neutral-400">Atendido por <span className="text-indigo-300">{employeeName}</span></p>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="min-h-0 overflow-hidden rounded-3xl bg-neutral-900/20 ring-1 ring-white/5">
          <POSMenu dishes={dishes} categories={categories} onAdd={handleAddDish} />
        </div>
        <div
          className="flex min-h-0 flex-col rounded-3xl p-4 shadow-xl"
          style={{ background: 'rgba(20,20,20,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <POSCart
            lines={cartLines}
            tableOrders={tableOrders}
            isSending={createOrder.isPending}
            onQuantityChange={handleQuantityChange}
            onSend={handleSendToKitchen}
            onCloseCheck={() => setIsClosingCheck(true)}
          />
        </div>
      </div>

      {isClosingCheck && (
        <CheckCloser
          orders={tableOrders}
          isProcessing={closeCheck.isPending}
          isDone={closeCheck.isSuccess}
          onConfirm={handleConfirmPayment}
          onClose={handleCloseCheckModal}
        />
      )}
    </div>
  )
}
