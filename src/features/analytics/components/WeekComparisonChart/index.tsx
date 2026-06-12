import type { WeekComparison } from '../../types/analytics.types'
import { WEEKDAY_LABELS } from '../../types/analytics.types'

interface WeekComparisonChartProps extends WeekComparison {
  readonly isLoading: boolean
}

// Espacio de coordenadas SVG — mismo patrón que EventLineChart.
const W = 700
const H = 180
const PAD = { t: 16, r: 20, b: 28, l: 40 }
const INNER_W = W - PAD.l - PAD.r
const INNER_H = H - PAD.t - PAD.b

const THIS_WEEK_COLOR = '#e85d04'
const LAST_WEEK_COLOR = '#a1a1aa'

function toX(i: number, total: number): number {
  if (total <= 1) return PAD.l
  return PAD.l + (i / (total - 1)) * INNER_W
}

function toY(value: number, maxVal: number): number {
  if (maxVal === 0) return PAD.t + INNER_H
  return PAD.t + (1 - value / maxVal) * INNER_H
}

function buildPath(values: readonly number[], maxVal: number): string {
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, values.length)} ${toY(v, maxVal)}`)
    .join(' ')
}

/** Líneas comparativas: total de eventos esta semana vs. la pasada. */
export function WeekComparisonChart({ thisWeek, lastWeek, isLoading }: WeekComparisonChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-zinc-100" />
        <div className="h-44 animate-pulse rounded-xl bg-zinc-50" />
      </div>
    )
  }

  const maxVal = Math.max(...thisWeek, ...lastWeek, 1)
  // El día 0 de las series es "hace 13/6 días" — etiquetamos por día de la semana real.
  const startDay = new Date()
  startDay.setDate(startDay.getDate() - 6)
  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDay)
    d.setDate(startDay.getDate() + i)
    return WEEKDAY_LABELS[(d.getDay() + 6) % 7] ?? ''
  })

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-bold text-zinc-900">Comparativa semanal</h3>
          <p className="text-[11.5px] text-zinc-400">Actividad total: esta semana vs. la pasada</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-zinc-600">
            <span className="h-1.5 w-4 rounded-full" style={{ background: THIS_WEEK_COLOR }} />
            Esta semana
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-1.5 w-4 rounded-full" style={{ background: LAST_WEEK_COLOR }} />
            Semana pasada
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="Comparativa semanal">
        {/* Grid horizontal */}
        {Array.from({ length: 4 }, (_, i) => {
          const y = PAD.t + (i / 3) * INNER_H
          return (
            <line key={i} x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="#f4f4f5" strokeWidth={1} />
          )
        })}

        {/* Semana pasada (punteada) */}
        <path
          d={buildPath(lastWeek, maxVal)}
          fill="none"
          stroke={LAST_WEEK_COLOR}
          strokeWidth={2}
          strokeDasharray="5 4"
          strokeLinecap="round"
        />
        {/* Esta semana */}
        <path
          d={buildPath(thisWeek, maxVal)}
          fill="none"
          stroke={THIS_WEEK_COLOR}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Puntos de esta semana */}
        {thisWeek.map((v, i) => (
          <circle
            key={i}
            cx={toX(i, thisWeek.length)}
            cy={toY(v, maxVal)}
            r={3}
            fill={THIS_WEEK_COLOR}
            stroke="#fff"
            strokeWidth={1.5}
          />
        ))}

        {/* Etiquetas del eje X */}
        {dayLabels.map((label, i) => (
          <text
            key={i}
            x={toX(i, dayLabels.length)}
            y={H - 8}
            textAnchor="middle"
            className="fill-zinc-400"
            fontSize={10}
            fontWeight={700}
          >
            {label}
          </text>
        ))}

        {/* Etiquetas del eje Y */}
        {[0, maxVal].map((v, i) => (
          <text
            key={i}
            x={PAD.l - 8}
            y={toY(v, maxVal) + 3}
            textAnchor="end"
            className="fill-zinc-300"
            fontSize={10}
            fontWeight={700}
          >
            {v}
          </text>
        ))}
      </svg>
    </div>
  )
}
