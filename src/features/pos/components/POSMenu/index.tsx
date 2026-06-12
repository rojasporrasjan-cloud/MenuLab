import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import type { Category } from '@core/domain/entities/Category'
import type { Dish } from '@core/domain/entities/Dish'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { COPY } from '@shared/copy/ui.copy'

interface POSMenuProps {
  readonly dishes: readonly Dish[]
  readonly categories: readonly Category[]
  readonly onAdd: (dish: Dish) => void
}

const ALL_CATEGORIES = 'all'

/** Grilla táctil de platos por categoría con búsqueda — pensada para tablet. */
export function POSMenu({ dishes, categories, onAdd }: POSMenuProps) {
  const [categoryId, setCategoryId] = useState<string>(ALL_CATEGORIES)
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return dishes.filter((dish) => {
      if (dish.status !== 'available') return false
      if (categoryId !== ALL_CATEGORIES && dish.categoryId !== categoryId) return false
      if (term && !dish.name.toLowerCase().includes(term)) return false
      return true
    })
  }, [dishes, categoryId, search])

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Search */}
      <div className="relative shrink-0">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={COPY.pos.menu.searchPlaceholder}
          className="w-full rounded-xl py-2.5 pl-9 pr-3 text-[13px] text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>

      {/* Categories */}
      <div className="flex shrink-0 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategoryId(ALL_CATEGORIES)}
          className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors"
          style={
            categoryId === ALL_CATEGORIES
              ? { background: '#f5b520', color: '#1a1303' }
              : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }
          }
        >
          {COPY.pos.menu.all}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryId(cat.id)}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors"
            style={
              categoryId === cat.id
                ? { background: '#f5b520', color: '#1a1303' }
                : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }
            }
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Dishes grid */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <p
            className="rounded-2xl border border-dashed px-4 py-10 text-center text-[13px]"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}
          >
            {COPY.empty.search}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((dish) => (
              <button
                key={dish.id}
                type="button"
                onClick={() => onAdd(dish)}
                className="flex flex-col items-start gap-1 rounded-2xl p-3 text-left transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <span className="line-clamp-2 text-[13px] font-bold leading-snug text-white">
                  {dish.name}
                </span>
                <span className="text-[12.5px] font-black tabular-nums" style={{ color: '#f5b520' }}>
                  {formatCurrency(dish.price.amount, dish.price.currency)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
