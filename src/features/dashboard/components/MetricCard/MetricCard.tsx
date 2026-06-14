import { TrendingUp, TrendingDown } from 'lucide-react'
import type { MetricCardData }      from '../../types/dashboard.types'

interface MetricCardProps {
  readonly data:       MetricCardData
  readonly isLoading?: boolean
}

// Acento por categoría: solo tiñe el chip del ícono + un glow de esquina sutil.
// Nada de franjas duras multicolor — la variedad viene del ícono, el conjunto
// se mantiene editorial y cálido (estilo landing).
const ACCENT = {
  brand:  { chip: 'bg-brand-50 text-brand-600',     glow: 'rgba(233,154,14,0.12)' },
  green:  { chip: 'bg-emerald-50 text-emerald-600', glow: 'rgba(16,185,129,0.10)' },
  blue:   { chip: 'bg-blue-50 text-blue-600',       glow: 'rgba(59,130,246,0.10)' },
  purple: { chip: 'bg-violet-50 text-violet-600',   glow: 'rgba(139,92,246,0.10)' },
} as const

export function MetricCard({ data, isLoading }: MetricCardProps) {
  const Icon   = data.icon
  const accent = ACCENT[data.color]

  return (
    <div className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-surface-150 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Glow de esquina al color del acento */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: accent.glow }}
      />

      <div className="relative flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent.chip}`}>
          <Icon size={18} strokeWidth={2} />
        </div>

        {data.trend && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              data.trend.isPositive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {data.trend.isPositive
              ? <TrendingUp size={11} />
              : <TrendingDown size={11} />}
            {Math.abs(data.trend.value)}%
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="relative flex flex-col gap-2">
          <div className="h-7 w-16 animate-pulse rounded-lg bg-surface-100" />
          <div className="h-3.5 w-20 animate-pulse rounded-lg bg-surface-100" />
        </div>
      ) : (
        <div className="relative flex flex-col gap-1">
          <span className="text-[28px] font-black tabular-nums leading-none tracking-tight text-surface-900">
            {data.value.toLocaleString()}
          </span>
          <span className="text-[12.5px] font-medium text-surface-400">
            {data.label}
          </span>
        </div>
      )}
    </div>
  )
}
