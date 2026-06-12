interface StampGridProps {
  readonly stamps: number
  readonly stampsForReward: number
  /** Emoji del sello lleno (config del tenant), ej: ⭐ o ☕. */
  readonly stampLabel: string
}

const EMPTY_STAMP = '⭕'
const DEFAULT_FILLED_STAMP = '✅'

export function StampGrid({ stamps, stampsForReward, stampLabel }: StampGridProps) {
  const filled = stampLabel.trim() || DEFAULT_FILLED_STAMP
  const cells = Array.from({ length: stampsForReward }, (_, i) => i < stamps)

  return (
    <div className="grid grid-cols-5 gap-2" role="img" aria-label={`${stamps} de ${stampsForReward} sellos`}>
      {cells.map((isFilled, i) => (
        <div
          key={i}
          className={`flex aspect-square items-center justify-center rounded-2xl text-xl transition-all ${
            isFilled ? 'scale-100' : 'opacity-50'
          }`}
          style={{
            background: isFilled ? 'rgba(233,154,14,0.1)' : 'rgba(0,0,0,0.03)',
            border: isFilled ? '1.5px solid rgba(233,154,14,0.35)' : '1.5px dashed rgba(0,0,0,0.1)',
          }}
        >
          {isFilled ? filled : EMPTY_STAMP}
        </div>
      ))}
    </div>
  )
}
