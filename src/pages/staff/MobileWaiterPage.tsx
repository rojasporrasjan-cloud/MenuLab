import { useState, useMemo } from 'react'
import { Search, Plus, Minus, ArrowLeft, ShoppingBag, Send, TabletSmartphone } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { useTenantContext } from '@app/providers/TenantProvider'
import { useAuthContext } from '@app/providers/AuthProvider'
import { useAdminMenus } from '@features/dishes'
import { useActiveDishes } from '@features/menu'
import { useTables } from '@features/qr'
import { useActiveOrders, useCreateOrder } from '@features/cart'
import { Spinner } from '@shared/ui/components/Spinner'
import { formatCurrency } from '@shared/utils/formatCurrency'
import type { Dish } from '@core/domain/entities/Dish'
import type { Table } from '@core/domain/entities/Table'
import type { OrderItem, NewOrder } from '@core/domain/entities/Order'
import { ORDER_STATUS } from '@core/domain/entities/Order'

type Step = 'table' | 'menu' | 'cart'

export default function MobileWaiterPage() {
  const { tenant, tenantId } = useTenantContext()
  const { firebaseUser } = useAuthContext()
  const { data: tables = [], isLoading: loadingTables } = useTables(tenantId)
  const { data: menus = [], isLoading: loadingMenus } = useAdminMenus(tenantId)
  const { orders = [], isLoading: loadingOrders } = useActiveOrders(tenantId)
  
  const menuId = menus[0]?.id ?? null
  const { groups = [], isLoading: loadingDishes } = useActiveDishes(tenantId, menuId ?? '', [])
  
  const createOrder = useCreateOrder(tenantId ?? '')

  const occupiedTableIds = useMemo(() => {
    const ids = new Set<string>()
    for (const order of orders) {
      if (order.type === 'table' && order.tableId) {
        ids.add(order.tableId)
      }
    }
    return ids
  }, [orders])

  const [step, setStep] = useState<Step>('table')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [cart, setCart] = useState<Map<string, { dish: Dish; quantity: number }>>(new Map())
  const [note, setNote] = useState('')

  const categories = useMemo(() => groups.map((g) => g.category), [groups])
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  const cartItems = Array.from(cart.values())
  const cartTotal = cartItems.reduce((acc, item) => acc + item.dish.price.amount * item.quantity, 0)
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  const currency = tenant?.currency ?? 'CRC'

  function updateQuantity(dish: Dish, delta: number) {
    setCart((prev) => {
      const next = new Map(prev)
      const existing = next.get(dish.id)
      const qty = (existing?.quantity ?? 0) + delta
      if (qty <= 0) {
        next.delete(dish.id)
      } else {
        next.set(dish.id, { dish, quantity: qty })
      }
      return next
    })
  }

  async function handleSendOrder() {
    if (!tenantId || cartItems.length === 0) return

    const items: OrderItem[] = cartItems.map(({ dish, quantity }) => ({
      dishId: dish.id,
      dishName: dish.name,
      quantity,
      unitPrice: dish.price.amount,
      variantLabel: null,
      note: null,
    }))

    const order: NewOrder = {
      tenantId,
      type: selectedTable ? 'table' : 'pickup',
      tableId: selectedTable?.id || null,
      tableLabel: selectedTable ? (selectedTable.label || `Mesa ${selectedTable.number}`) : null,
      items,
      subtotal: cartTotal,
      deliveryCost: 0,
      taxAmount: 0,
      total: cartTotal,
      currency,
      customerName: firebaseUser?.email ? `Staff (${firebaseUser.email.split('@')[0]})` : 'Staff',
      customerPhone: null,
      deliveryAddress: null,
      note: note.trim() || null,
      status: ORDER_STATUS.confirmed, // Va directo a cocina
      paymentStatus: 'pending',
    }

    try {
      await createOrder.mutateAsync(order)
      // Reset after success
      setCart(new Map())
      setNote('')
      setSelectedTable(null)
      setStep('table')
    } catch (error) {
      console.error('Error enviando orden:', error)
      alert('Error al enviar el pedido. Por favor intenta de nuevo.')
    }
  }

  if (loadingTables || loadingMenus || loadingDishes) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  // ─── Step 1: Mesas ──────────────────────────────────────────────────────────
  if (step === 'table') {
    return (
      <div className="flex flex-col gap-4">
        <header>
          <h1 className="text-xl font-black text-surface-900">Tomar Pedido</h1>
          <p className="text-sm text-surface-500">Selecciona una mesa o tipo de pedido.</p>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => { setSelectedTable(null); setStep('menu') }}
            className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-4 transition-colors hover:bg-brand-100"
          >
            <ShoppingBag className="text-brand-600 shrink-0" />
            <span className="text-sm font-bold text-brand-800">Para Llevar</span>
          </button>
          {tables.map(table => {
            const isOccupied = occupiedTableIds.has(table.id)
            return (
              <button
                key={table.id}
                type="button"
                onClick={() => { setSelectedTable(table); setStep('menu') }}
                className={`flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all shadow-sm ${
                  isOccupied 
                    ? 'border-rose-200 bg-rose-50 hover:border-rose-300' 
                    : 'border-surface-200 bg-white hover:border-surface-300 hover:shadow-md'
                }`}
              >
                <TabletSmartphone className={cn('shrink-0', isOccupied ? 'text-rose-500' : 'text-surface-400')} />
                <span className={`text-sm font-bold ${isOccupied ? 'text-rose-900' : 'text-surface-800'}`}>
                  {table.label || `Mesa ${table.number}`}
                </span>
                
                {isOccupied && (
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">Ocupada</span>
                    {(() => {
                      const tableOrders = orders.filter(o => o.tableId === table.id)
                      const allItems = tableOrders.flatMap(o => o.items)
                      if (allItems.length === 0) return null
                      const summary = allItems.slice(0, 2).map(i => `${i.quantity}x ${i.dishName}`).join(', ')
                      const hasMore = allItems.length > 2
                      return (
                        <span className="text-[10px] text-rose-700 text-center leading-tight line-clamp-2 px-1">
                          {summary}{hasMore ? '...' : ''}
                        </span>
                      )
                    })()}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── Step 2: Menú ───────────────────────────────────────────────────────────
  if (step === 'menu') {
    return (
      <div className="flex h-full flex-col relative pb-20">
        <header className="flex items-center gap-3 border-b border-surface-100 pb-3 mb-3">
          <button type="button" onClick={() => setStep('table')} className="rounded-xl p-2 bg-surface-100 hover:bg-surface-200 text-surface-600">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-black text-surface-900">
              {selectedTable ? (selectedTable.label || `Mesa ${selectedTable.number}`) : 'Para Llevar'}
            </h1>
          </div>
        </header>

        {/* Categories Tabs */}
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <button
            onClick={() => setActiveCategoryId(null)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors ${
              activeCategoryId === null ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-100 text-surface-600'
            }`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors ${
                activeCategoryId === cat.id ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-100 text-surface-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Dishes List */}
        <div className="flex flex-col gap-2 overflow-y-auto min-h-0 flex-1 mt-2">
          {groups
            .filter(g => activeCategoryId === null || g.category.id === activeCategoryId)
            .flatMap(g => g.dishes)
            .filter(d => d.status === 'available')
            .map(dish => {
              const qty = cart.get(dish.id)?.quantity ?? 0
              return (
                <div key={dish.id} className="flex items-center gap-3 rounded-2xl border border-surface-100 bg-white p-3 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-surface-900 leading-tight">{dish.name}</p>
                    <p className="text-[13px] font-black text-brand-600 mt-0.5">{formatCurrency(dish.price.amount, dish.price.currency)}</p>
                  </div>
                  {/* Stepper */}
                  <div className="shrink-0 flex items-center rounded-xl bg-surface-50 border border-surface-200">
                    <button
                      type="button"
                      onClick={() => updateQuantity(dish, -1)}
                      className="p-2 text-surface-500 hover:text-surface-800 disabled:opacity-30"
                      disabled={qty === 0}
                    >
                      <Minus size={16} strokeWidth={3} />
                    </button>
                    <span className="w-6 text-center text-[13px] font-black text-surface-900">{qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(dish, 1)}
                      className="p-2 text-brand-600 hover:text-brand-800"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Sticky Cart Footer */}
        {cartCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-surface-200 bg-white p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] lg:absolute">
            <button
              onClick={() => setStep('cart')}
              className="flex w-full items-center justify-between rounded-2xl bg-brand-500 px-5 py-4 text-white shadow-lg shadow-brand-500/30 transition-transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[12px] font-black">
                  {cartCount}
                </div>
                <span className="font-bold">Ver Pedido</span>
              </div>
              <span className="font-black">{formatCurrency(cartTotal, currency)}</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── Step 3: Cart Review ────────────────────────────────────────────────────
  if (step === 'cart') {
    return (
      <div className="flex h-full flex-col relative pb-24">
        <header className="flex items-center gap-3 border-b border-surface-100 pb-3 mb-3">
          <button type="button" onClick={() => setStep('menu')} className="rounded-xl p-2 bg-surface-100 hover:bg-surface-200 text-surface-600">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-black text-surface-900">Resumen del Pedido</h1>
            <p className="text-sm font-semibold text-brand-600">{selectedTable ? (selectedTable.label || `Mesa ${selectedTable.number}`) : 'Para Llevar'}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0">
          <div className="rounded-2xl border border-surface-100 bg-white p-2 shadow-sm flex flex-col gap-1">
            {cartItems.map(({ dish, quantity }) => (
              <div key={dish.id} className="flex items-start justify-between p-2">
                <div className="flex items-start gap-2">
                  <span className="font-black text-surface-900">{quantity}x</span>
                  <p className="text-sm font-semibold text-surface-800">{dish.name}</p>
                </div>
                <span className="text-sm font-bold text-surface-600">
                  {formatCurrency(dish.price.amount * quantity, dish.price.currency)}
                </span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-surface-100 pt-3 px-2 pb-1">
              <span className="font-bold text-surface-900">Total</span>
              <span className="text-lg font-black text-brand-600">{formatCurrency(cartTotal, currency)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs font-bold text-surface-600 uppercase tracking-wider pl-1">Notas de cocina</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Sin cebolla, bien cocido..."
              rows={3}
              className="w-full resize-none rounded-2xl border border-surface-200 bg-white p-3 text-[13px] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
        </div>

        {/* Sticky Send Button */}
        <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-surface-200 bg-white p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] lg:absolute">
          <button
            disabled={createOrder.isPending}
            onClick={() => void handleSendOrder()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-900 px-5 py-4 text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {createOrder.isPending ? <Spinner size="sm" /> : <Send size={18} />}
            <span className="font-bold text-[15px]">Enviar a Cocina</span>
          </button>
        </div>
      </div>
    )
  }

  return null
}
