import { useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'

import type { Dish } from '@core/domain/entities/Dish'

interface FeaturedCarouselProps {
  readonly dishes: readonly Dish[]
  readonly accentColor: string
  readonly orderingEnabled: boolean
  readonly showPrices: boolean
  readonly onSelect: (dish: Dish) => void
  readonly onAdd: (dish: Dish) => void
  /** Tracking: el carrusel entró en pantalla (una vez por sesión de página). */
  readonly onView: () => void
}

const CAROUSEL_COPY = {
  title: 'Recomendados',
  recommended: '⭐ Recomendado',
  arBadge: '📱 Ver en AR',
} as const

function formatPrice(amount: number, currency: string): string {
  if (currency === 'CRC') return `₡${amount.toLocaleString()}`
  if (currency === 'USD') return `$${amount}`
  return `${currency} ${amount}`
}

export function FeaturedCarousel({
  dishes,
  accentColor,
  orderingEnabled,
  showPrices,
  onSelect,
  onAdd,
  onView,
}: FeaturedCarouselProps) {
  const hasTrackedView = useRef(false)

  useEffect(() => {
    if (dishes.length > 0 && !hasTrackedView.current) {
      hasTrackedView.current = true
      onView()
    }
  }, [dishes.length, onView])

  if (dishes.length === 0) return null

  return (
    <section className="px-4 pt-4" aria-label={CAROUSEL_COPY.title}>
      <h2
        className="mb-2.5 text-[12px] font-black uppercase tracking-[0.18em]"
        style={{ color: accentColor }}
      >
        {CAROUSEL_COPY.title}
      </h2>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {dishes.map((dish) => (
          <article
            key={dish.id}
            className="relative w-[240px] shrink-0 snap-start overflow-hidden rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(dish)}
              className="block w-full text-left"
            >
              {/* Imagen 16:9 */}
              <div className="relative aspect-video w-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.25)' }}>
                {dish.assets.imageUrl && (
                  <img
                    loading="lazy"
                    src={dish.assets.imageUrl}
                    alt={dish.name}
                    className="h-full w-full object-cover"
                  />
                )}
                <span
                  className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                >
                  {CAROUSEL_COPY.recommended}
                </span>
                {dish.assets.hasAR && (
                  <span
                    className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-black text-white"
                    style={{ background: `${accentColor}cc`, backdropFilter: 'blur(4px)' }}
                  >
                    {CAROUSEL_COPY.arBadge}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-white">{dish.name}</p>
                  {showPrices && (
                    <p className="text-[12.5px] font-black tabular-nums" style={{ color: accentColor }}>
                      {formatPrice(dish.price.amount, dish.price.currency)}
                    </p>
                  )}
                </div>
              </div>
            </button>

            {orderingEnabled && (
              <button
                type="button"
                aria-label={`Agregar ${dish.name}`}
                onClick={() => onAdd(dish)}
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-lg transition-transform active:scale-90"
                style={{ background: accentColor }}
              >
                <Plus size={15} strokeWidth={2.6} />
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
