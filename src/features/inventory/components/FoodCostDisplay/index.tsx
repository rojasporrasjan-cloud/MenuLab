import { LIMITS } from '@shared/constants/limits'

interface FoodCostDisplayProps {
  readonly percent: number
}

/** Chip con el food cost %: verde sano, ámbar alto, rojo crítico. */
export function FoodCostDisplay({ percent }: FoodCostDisplayProps) {
  const style =
    percent >= LIMITS.inventory.foodCostDangerPercent
      ? { color: '#dc2626', background: 'rgba(220,38,38,0.10)' }
      : percent >= LIMITS.inventory.foodCostWarnPercent
        ? { color: '#b45309', background: 'rgba(180,83,9,0.10)' }
        : { color: '#059669', background: 'rgba(5,150,105,0.10)' }

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums"
      style={style}
    >
      {percent.toFixed(1)}%
    </span>
  )
}
