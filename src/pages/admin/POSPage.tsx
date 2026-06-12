import { useMemo, useState } from 'react'
import { ArrowLeft, Lock } from 'lucide-react'

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
  TableGrid,
  POSMenu,
  POSCart,
  CheckCloser,
} from '@features/pos'
import type { POSCartLine } from '@features/pos'
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
  const { ordersByTable, tableState } = usePOSOrders(tenantId)

  const { data: menus = [] } = useAdminMenus(tenantId)
  const menuId = menus[0]?.id ?? null
  const { data: dishes = [] } = useAdminDishes(tenantId, menuId)
  const { data: categories = [] } = useAdminCategories(tenantId, menuId)

  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [cartLines, setCartLines] = useState<POSCartLine[]>([])
  const [isClosingCheck, setIsClosingCheck] = useState(false)

  const createOrder = useCreateOrder()
  const closeCheck = useCloseCheck()

  const tableOrders = useMemo(
    () => (selectedTable ? ordersByTable.get(selectedTable.id) ?? [] : []),
    [selectedTable, ordersByTable],
  )

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
    if (closeCheck.isSuccess) setSelectedTable(null)
  }

  // ── Vista: grid de mesas ──
  if (!selectedTable) {
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-[15px] font-black text-white">{COPY.pos.tables.title}</h1>
          <button
            type="button"
            onClick={onLock}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Lock size={12} /> {COPY.pos.pin.lock} · {employeeName}
          </button>
        </div>
        <TableGrid
          tables={tables}
          stateOf={tableState}
          accountSizeOf={(tableId) => ordersByTable.get(tableId)?.length ?? 0}
          onSelect={setSelectedTable}
        />
      </div>
    )
  }

  // ── Vista: menú + comanda de la mesa ──
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setSelectedTable(null)
            setCartLines([])
          }}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition-colors"
          style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <ArrowLeft size={13} /> {COPY.pos.menu.backToTables}
        </button>
        <h1 className="text-[15px] font-black text-white">
          {selectedTable.label ?? COPY.table.label(selectedTable.number)}
        </h1>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_320px]">
        <div className="min-h-0 overflow-hidden">
          <POSMenu dishes={dishes} categories={categories} onAdd={handleAddDish} />
        </div>
        <div
          className="flex min-h-0 flex-col rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
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
