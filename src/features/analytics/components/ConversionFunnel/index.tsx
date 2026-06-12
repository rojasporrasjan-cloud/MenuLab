import type { FunnelStage } from '../../types/analytics.types'

interface ConversionFunnelProps {
  readonly stages: readonly FunnelStage[]
  readonly isLoading: boolean
}

const BAR_COLOR = '#e85d04'
const MIN_BAR_PERCENT = 2

/** Funnel horizontal: Visitas → Vistas plato → AR → Cart adds → Pedidos. */
export function ConversionFunnel({ stages, isLoading }: ConversionFunnelProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-zinc-100" />
        <div className="h-44 animate-pulse rounded-xl bg-zinc-50" />
      </div>
    )
  }

  const max = Math.max(...stages.map((s) => s.count), 1)

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-[13px] font-bold text-zinc-900">Funnel de conversión</h3>
      <p className="text-[11.5px] text-zinc-400">Del escaneo al pedido en el rango seleccionado</p>

      <div className="mt-4 flex flex-col gap-2.5">
        {stages.map((stage, i) => {
          const widthPercent = Math.max((stage.count / max) * 100, MIN_BAR_PERCENT)
          return (
            <div key={stage.key} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-right text-[12px] font-bold text-zinc-500">
                {stage.label}
              </span>
              <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-zinc-50">
                <div
                  className="flex h-full items-center rounded-lg px-2 transition-all"
                  style={{
                    width: `${widthPercent}%`,
                    background: BAR_COLOR,
                    opacity: 1 - i * 0.13,
                  }}
                >
                  <span className="text-[11.5px] font-black tabular-nums text-white">
                    {stage.count.toLocaleString()}
                  </span>
                </div>
              </div>
              <span className="w-14 shrink-0 text-[11.5px] font-bold tabular-nums text-zinc-400">
                {i === 0 ? '100%' : `${stage.conversionFromPrevious.toFixed(1)}%`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
