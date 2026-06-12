import { useMemo, useState } from 'react'

import type { MenuEngineeringPoint, MenuQuadrant } from '../../types/analytics.types'
import { MENU_QUADRANT_META } from '../../types/analytics.types'

interface MenuEngineeringMatrixProps {
  readonly points: readonly MenuEngineeringPoint[]
  readonly popularityCut: number
  readonly profitabilityCut: number
  readonly isLoading: boolean
}

const QUADRANT_COLOR: Record<MenuQuadrant, string> = {
  star: '#f59e0b',
  cow: '#3b82f6',
  question: '#8b5cf6',
  dog: '#9ca3af',
}

const PLOT_PAD_PERCENT = 8

function toPercent(value: number, max: number): number {
  if (max <= 0) return PLOT_PAD_PERCENT
  const ratio = value / max
  return PLOT_PAD_PERCENT + ratio * (100 - PLOT_PAD_PERCENT * 2)
}

/** Scatter 2×2 Popularidad × Rentabilidad con recomendaciones por cuadrante. */
export function MenuEngineeringMatrix({
  points,
  popularityCut,
  profitabilityCut,
  isLoading,
}: MenuEngineeringMatrixProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const { maxPopularity, maxProfitability } = useMemo(
    () => ({
      maxPopularity: Math.max(...points.map((p) => p.popularity), 1),
      maxProfitability: Math.max(...points.map((p) => p.profitability), 1),
    }),
    [points],
  )

  const quadrantCounts = useMemo(() => {
    const counts: Record<MenuQuadrant, number> = { star: 0, cow: 0, question: 0, dog: 0 }
    for (const p of points) counts[p.quadrant] += 1
    return counts
  }, [points])

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 h-4 w-44 animate-pulse rounded bg-zinc-100" />
        <div className="h-72 animate-pulse rounded-xl bg-zinc-50" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-[13px] font-bold text-zinc-900">Menu engineering</h3>
      <p className="text-[11.5px] text-zinc-400">
        Popularidad (pedidos) vs. rentabilidad (margen por unidad)
      </p>

      {points.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-zinc-200 px-4 py-10 text-center text-[12px] text-zinc-400">
          Aún no hay pedidos en el rango para construir la matriz.
        </p>
      ) : (
        <>
          {/* Plot */}
          <div className="relative mt-4 h-72 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50/60">
            {/* Líneas de corte (medianas) */}
            <div
              className="absolute inset-y-0 w-px bg-zinc-300/80"
              style={{ left: `${toPercent(popularityCut, maxPopularity)}%` }}
            />
            <div
              className="absolute inset-x-0 h-px bg-zinc-300/80"
              style={{ bottom: `${toPercent(profitabilityCut, maxProfitability)}%` }}
            />

            {/* Etiquetas de cuadrante */}
            <span className="absolute right-2 top-2 text-[11px] font-bold text-amber-500">
              {MENU_QUADRANT_META.star.emoji} {MENU_QUADRANT_META.star.label}
            </span>
            <span className="absolute bottom-2 right-2 text-[11px] font-bold text-blue-500">
              {MENU_QUADRANT_META.cow.emoji} {MENU_QUADRANT_META.cow.label}
            </span>
            <span className="absolute left-2 top-2 text-[11px] font-bold text-violet-500">
              {MENU_QUADRANT_META.question.emoji} {MENU_QUADRANT_META.question.label}
            </span>
            <span className="absolute bottom-2 left-2 text-[11px] font-bold text-zinc-400">
              {MENU_QUADRANT_META.dog.emoji} {MENU_QUADRANT_META.dog.label}
            </span>

            {/* Puntos */}
            {points.map((p) => (
              <button
                key={p.dishId}
                type="button"
                aria-label={p.dishName}
                onMouseEnter={() => setHovered(p.dishId)}
                onMouseLeave={() => setHovered(null)}
                className="absolute h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full ring-2 ring-white transition-transform hover:scale-150"
                style={{
                  left: `${toPercent(p.popularity, maxPopularity)}%`,
                  bottom: `${toPercent(p.profitability, maxProfitability)}%`,
                  background: QUADRANT_COLOR[p.quadrant],
                }}
              >
                {hovered === p.dishId && (
                  <span className="absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-[10.5px] font-bold text-white">
                    {p.dishName} · {p.popularity} pedidos
                  </span>
                )}
              </button>
            ))}

            {/* Ejes */}
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9.5px] font-bold uppercase tracking-wider text-zinc-300">
              Popularidad →
            </span>
            <span className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9.5px] font-bold uppercase tracking-wider text-zinc-300">
              Rentabilidad →
            </span>
          </div>

          {/* Recomendaciones */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(Object.keys(MENU_QUADRANT_META) as MenuQuadrant[]).map((q) => ( // safe: keys de un Record<MenuQuadrant, …> definido con todas las claves
              <div key={q} className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
                <p className="text-[12px] font-black text-zinc-700">
                  {MENU_QUADRANT_META[q].emoji} {MENU_QUADRANT_META[q].label}{' '}
                  <span className="font-bold text-zinc-400">({quadrantCounts[q]})</span>
                </p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-zinc-500">
                  {MENU_QUADRANT_META[q].recommendation}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
