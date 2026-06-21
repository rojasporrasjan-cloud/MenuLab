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
    const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    const term = normalize(search.trim())
    
    return dishes.filter((dish) => {
      if (dish.status !== 'available') return false
      if (categoryId !== ALL_CATEGORIES && dish.categoryId !== categoryId) return false
      if (term && !normalize(dish.name).includes(term)) return false
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
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <p
            className="rounded-2xl border border-dashed px-4 py-10 text-center text-[13px]"
            style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}
          >
            {COPY.empty.search}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((dish) => {
              const image = dish.assets?.thumbnailUrl || dish.assets?.imageUrl
              return (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => onAdd(dish)}
                  className="group relative flex flex-col items-stretch overflow-hidden rounded-2xl text-left transition-all active:scale-95 shadow-sm"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {/* Aspect ratio container for the image */}
                  <div className="relative aspect-square w-full overflow-hidden bg-neutral-800/50">
                    {image ? (
                      <img 
                        src={image} 
                        alt={dish.name} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-neutral-800/80">
                        <span className="text-[32px] opacity-20">🍽️</span>
                      </div>
                    )}
                    {/* Dark gradient overlay for contrast if we want text on top, but we put text below */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  
                  {/* Text area */}
                  <div className="flex flex-1 flex-col justify-between p-3">
                    <span className="line-clamp-2 text-[13px] font-bold leading-snug text-white/90">
                      {dish.name}
                    </span>
                    <span className="mt-1.5 text-[14px] font-black tracking-tight" style={{ color: '#f5b520' }}>
                      {formatCurrency(dish.price.amount, dish.price.currency)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
