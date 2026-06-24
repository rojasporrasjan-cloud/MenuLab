interface StampGridProps {
  readonly stamps: number
  readonly stampsForReward: number
  /** Emoji del sello lleno (config del tenant), ej: ⭐ o ☕. */
  readonly stampLabel: string
  readonly textColor: 'light' | 'dark'
}

const EMPTY_STAMP = '⭕'
const DEFAULT_FILLED_STAMP = '✅'

export function StampGrid({ stamps, stampsForReward, stampLabel, textColor }: StampGridProps) {
  const filled = stampLabel.trim() || DEFAULT_FILLED_STAMP
  const cells = Array.from({ length: stampsForReward }, (_, i) => i < stamps)

  const isDark = textColor === 'dark'
  const emptyBg = isDark ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.1)'
  const emptyBorder = isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'
  const filledBg = isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.25)'
  const filledBorder = isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)'

  return (
    <div className="grid grid-cols-5 gap-3" role="img" aria-label={`${stamps} de ${stampsForReward} sellos`}>
      {cells.map((isFilled, i) => (
        <div
          key={i}
          className={`flex aspect-square items-center justify-center rounded-full text-xl transition-all ${
            isFilled ? 'scale-100 shadow-sm' : 'opacity-60 scale-95'
          }`}
          style={{
            background: isFilled ? filledBg : emptyBg,
            border: isFilled ? `1.5px solid ${filledBorder}` : `1.5px dashed ${emptyBorder}`,
            boxShadow: isFilled ? (isDark ? 'inset 0 2px 4px rgba(255,255,255,0.5)' : 'inset 0 2px 4px rgba(255,255,255,0.2)') : 'inset 0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          {isFilled ? <span className="drop-shadow-md">{filled}</span> : null}
        </div>
      ))}
    </div>
  )
}
