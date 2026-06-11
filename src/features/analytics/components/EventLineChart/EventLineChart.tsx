import { useState } from 'react'
import type { DailySummary, ChartSeries } from '../../types/analytics.types'
import { SERIES_CONFIG } from '../../types/analytics.types'

interface EventLineChartProps {
  summaries: DailySummary[]
  isLoading: boolean
}

// ── Layout constants (SVG coordinate space) ───────────────────────────────────

const W = 700
const H = 200
const PAD = { t: 16, r: 20, b: 36, l: 48 }
const INNER_W = W - PAD.l - PAD.r
const INNER_H = H - PAD.t - PAD.b
const Y_TICKS = 4

// ── Coordinate helpers ────────────────────────────────────────────────────────

function toX(i: number, total: number): number {
  if (total <= 1) return PAD.l
  return PAD.l + (i / (total - 1)) * INNER_W
}

function toY(value: number, maxVal: number): number {
  if (maxVal === 0) return PAD.t + INNER_H
  return PAD.t + (1 - value / maxVal) * INNER_H
}

function buildPath(points: [number, number][]): string {
  const [first] = points
  if (!first) return ''
  if (points.length === 1) return `M ${first[0]} ${first[1]}`
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
}

// ── Format helpers ─────────────────────────────────────────────────────────────

function fmtDate(dateStr: string, compact = false): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  if (compact) return d.toLocaleDateString('es-CR', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('es-CR', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EventLineChart({ summaries, isLoading }: EventLineChartProps) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set())
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; dateIdx: number
  } | null>(null)

  const toggleSeries = (key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-zinc-100" />
        <div className="h-[200px] animate-pulse rounded-xl bg-zinc-50" />
      </div>
    )
  }

  // Build series data
  const series: ChartSeries[] = SERIES_CONFIG.filter((s) => !hiddenKeys.has(s.key)).map((s) => ({
    ...s,
    data: summaries.map((d) => d.counts[s.key] ?? 0),
  }))

  const maxVal = Math.max(
    1,
    ...series.flatMap((s) => s.data),
  )

  // Y-axis tick values
  const yTicks = Array.from({ length: Y_TICKS + 1 }, (_, i) =>
    Math.round((maxVal / Y_TICKS) * (Y_TICKS - i)),
  )

  // X-axis: show label every N days to avoid crowding
  const labelStep = summaries.length <= 14 ? 2 : summaries.length <= 31 ? 7 : 14

  const tooltipData = tooltip !== null ? summaries[tooltip.dateIdx] : null

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-[13px] font-bold text-zinc-800">
        Eventos por día
      </h3>

      {/* Series toggle legend */}
      <div className="mb-4 flex flex-wrap gap-3">
        {SERIES_CONFIG.map((s) => {
          const isHidden = hiddenKeys.has(s.key)
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleSeries(s.key)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm transition-all cursor-pointer ${isHidden ? 'opacity-40' : ''}`}
              style={{ borderColor: s.color, color: isHidden ? undefined : s.color }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full animate-pulse"
                style={{ background: s.color }}
              />
              {s.label}
            </button>
          )
        })}
      </div>

      {/* SVG chart */}
      <div
        className="relative"
        onMouseLeave={() => setTooltip(null)}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 200 }}
          aria-label="Gráfico de eventos por día"
        >
          {/* Horizontal grid lines */}
          {yTicks.map((tick, i) => {
            const y = toY(tick, maxVal)
            return (
              <g key={i}>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={y}
                  y2={y}
                  stroke="#f4f4f5"
                  strokeWidth={1}
                />
                <text
                  x={PAD.l - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="#a1a1aa"
                  className="font-medium"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* X-axis labels */}
          {summaries.map((s, i) => {
            if (i % labelStep !== 0 && i !== summaries.length - 1) return null
            return (
              <text
                key={s.date}
                x={toX(i, summaries.length)}
                y={H - 6}
                textAnchor="middle"
                fontSize={9}
                fill="#a1a1aa"
                className="font-medium"
              >
                {fmtDate(s.date, true)}
              </text>
            )
          })}

          {/* Series lines */}
          {series.map((s) => {
            const points: [number, number][] = s.data.map((v, i) => [
              toX(i, s.data.length),
              toY(v, maxVal),
            ])
            return (
              <path
                key={s.key}
                d={buildPath(points)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )
          })}

          {/* Series dots on hover column */}
          {tooltip !== null &&
            series.map((s) => {
              const v = s.data[tooltip.dateIdx] ?? 0
              return (
                <circle
                  key={s.key}
                  cx={toX(tooltip.dateIdx, s.data.length)}
                  cy={toY(v, maxVal)}
                  r={3.5}
                  fill={s.color}
                  stroke="white"
                  strokeWidth={1.5}
                />
              )
            })}

          {/* Invisible hover hit areas — one per day */}
          {summaries.map((_, i) => {
            const x = toX(i, summaries.length)
            const colW = summaries.length > 1 ? INNER_W / (summaries.length - 1) : INNER_W
            return (
              <rect
                key={i}
                x={x - colW / 2}
                y={PAD.t}
                width={colW}
                height={INNER_H}
                fill="transparent"
                onMouseEnter={() =>
                  setTooltip({ x, y: PAD.t, dateIdx: i })
                }
              />
            )
          })}

          {/* Vertical highlight on hover */}
          {tooltip !== null && (
            <line
              x1={toX(tooltip.dateIdx, summaries.length)}
              x2={toX(tooltip.dateIdx, summaries.length)}
              y1={PAD.t}
              y2={PAD.t + INNER_H}
              stroke="#e4e4e7"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}
        </svg>

        {/* Floating tooltip */}
        {tooltip !== null && tooltipData && (
          <div
            className="pointer-events-none absolute z-10 min-w-[140px] rounded-xl border border-zinc-200/85 bg-white p-3.5 text-xs shadow-md"
            style={{
              left: `${(toX(tooltip.dateIdx, summaries.length) / W) * 100}%`,
              top: 0,
              transform: tooltip.dateIdx > summaries.length * 0.6
                ? 'translateX(-110%)'
                : 'translateX(8px)',
            }}
          >
            <p className="mb-2 font-bold text-zinc-700">
              {fmtDate(tooltipData.date)}
            </p>
            {SERIES_CONFIG.map((s) => {
              if (hiddenKeys.has(s.key)) return null
              const v = tooltipData.counts[s.key] ?? 0
              return (
                <div key={s.key} className="flex items-center justify-between gap-4 py-0.5">
                  <span className="flex items-center gap-1.5 font-medium" style={{ color: s.color }}>
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="font-extrabold text-zinc-800">{v}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
