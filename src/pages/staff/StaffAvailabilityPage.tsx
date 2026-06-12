import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
import { useAdminMenus, useAdminDishes, useToggleDishStatus, useUpdateDishPrice } from '@features/dishes'
import { Spinner } from '@shared/ui/components/Spinner'
import { matchesQuery } from '@shared/utils/menuSearch'
import type { Dish } from '@core/domain/entities/Dish'

function currencySymbol(currency: string): string {
  if (currency === 'CRC') return '₡'
  if (currency === 'USD') return '$'
  return `${currency} `
}

interface DishRowProps {
  readonly dish: Dish
  readonly menuId: string
  readonly isToggling: boolean
  readonly isSaving: boolean
  readonly onToggle: (menuId: string, dishId: string, next: Dish['status']) => void
  readonly onSavePrice: (menuId: string, dishId: string, amount: number) => void
}

function DishRow({ dish, menuId, isToggling, isSaving, onToggle, onSavePrice }: DishRowProps) {
  const [price, setPrice] = useState(String(dish.price.amount))
  const unavailable = dish.status === 'unavailable'
  const dirty = price.trim() !== String(dish.price.amount)

  function savePrice(): void {
    const amount = Number(price)
    if (dirty && Number.isFinite(amount) && amount >= 0) {
      onSavePrice(menuId, dish.id, amount)
    } else {
      setPrice(String(dish.price.amount))
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-bold ${unavailable ? 'text-surface-400 line-through' : 'text-surface-900'}`}>
          {dish.name}
        </p>
        {unavailable && <span className="text-[11px] font-bold text-red-600">Agotado</span>}
      </div>

      {/* Precio editable */}
      <div className="flex items-center rounded-xl border border-surface-200 bg-surface-50 px-2.5 py-1.5">
        <span className="text-sm font-semibold text-surface-400">{currencySymbol(dish.price.currency)}</span>
        <input
          type="text"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))}
          onBlur={savePrice}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          className="w-20 bg-transparent text-right text-sm font-bold text-surface-900 outline-none"
        />
        {isSaving && <Spinner size="sm" />}
      </div>

      {/* Toggle agotado / disponible */}
      <button
        type="button"
        disabled={isToggling}
        onClick={() => onToggle(menuId, dish.id, unavailable ? 'available' : 'unavailable')}
        className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold transition-colors disabled:opacity-50 ${
          unavailable
            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'bg-red-50 text-red-700 hover:bg-red-100'
        }`}
      >
        {isToggling ? '…' : unavailable ? 'Marcar disponible' : 'Marcar agotado'}
      </button>
    </div>
  )
}

export default function StaffAvailabilityPage() {
  const { tenantId } = useTenantContext()
  const { data: menus } = useAdminMenus(tenantId)
  const menuId = menus?.[0]?.id ?? null
  const { data: dishes, isLoading } = useAdminDishes(tenantId, menuId)
  const { toggleStatus, togglingId } = useToggleDishStatus(tenantId)
  const { updatePrice, savingId } = useUpdateDishPrice(tenantId)
  const [query, setQuery] = useState('')

  const filtered = (dishes ?? []).filter((d) => matchesQuery([d.name], query))

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-black text-surface-900">Disponibilidad y precios</h1>
        <p className="text-sm text-surface-500">Marca platos como agotados o disponibles y ajusta precios.</p>
      </header>

      <div className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-3.5 py-2.5">
        <Search size={15} className="text-surface-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar platillo…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-surface-400"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : !menuId || filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-white p-10 text-center text-sm text-surface-500">
          {query ? 'Sin resultados.' : 'No hay platos en el menú.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((dish) => (
            <DishRow
              key={dish.id}
              dish={dish}
              menuId={menuId}
              isToggling={togglingId === dish.id}
              isSaving={savingId === dish.id}
              onToggle={(m, d, next) => { void toggleStatus(m, d, next) }}
              onSavePrice={(m, d, amount) => { void updatePrice(m, d, amount) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
