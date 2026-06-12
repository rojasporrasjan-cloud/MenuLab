import type { HourlyHeatmapMatrix } from '../../types/analytics.types'
import { WEEKDAY_LABELS } from '../../types/analytics.types'

interface HourlyHeatmapProps {
  readonly matrix: HourlyHeatmapMatrix
  readonly maxCount: number
  readonly isLoading: boolean
}

const HEAT_COLOR = '232, 93, 4' // rgb del color de marca (#e85d04)
const HOUR_TICKS = [0, 6, 12, 18, 23] as const

function cellBackground(count: number, max: number): string {
  if (count === 0 || max === 0) return 'rgba(0,0,0,0.04)'
  const intensity = 0.15 + (count / max) * 0.85
  return `rgba(${HEAT_COLOR}, ${intensity.toFixed(2)})`
}

/** Heatmap 7 días × 24 horas de pedidos (divs puros, sin librerías). */
export function HourlyHeatmap({ matrix, maxCount, isLoading }: HourlyHeatmapProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-zinc-100" />
        <div className="h-48 animate-pulse rounded-xl bg-zinc-50" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-[13px] font-bold text-zinc-900">Horas pico</h3>
      <p className="text-[11.5px] text-zinc-400">Pedidos por día y hora en el rango</p>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[560px]">
          {matrix.map((row, dayIdx) => (
            <div key={WEEKDAY_LABELS[dayIdx] ?? dayIdx} className="mb-1 flex items-center gap-1">
              <span className="w-8 shrink-0 text-[10px] font-bold text-zinc-400">
                {WEEKDAY_LABELS[dayIdx]}
              </span>
              {row.map((count, hour) => (
                <div
                  key={hour}
                  title={`${WEEKDAY_LABELS[dayIdx]} ${hour}:00 — ${count} pedido${count !== 1 ? 's' : ''}`}
                  className="h-5 flex-1 rounded-[4px]"
                  style={{ background: cellBackground(count, maxCount) }}
                />
              ))}
            </div>
          ))}

          {/* Eje de horas */}
          <div className="mt-1 flex items-center gap-1">
            <span className="w-8 shrink-0" />
            {Array.from({ length: 24 }, (_, hour) => (
              <span key={hour} className="flex-1 text-center text-[9px] font-bold text-zinc-300">
                {(HOUR_TICKS as readonly number[]).includes(hour) ? `${hour}h` : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
