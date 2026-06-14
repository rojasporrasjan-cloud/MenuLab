import { useEffect, useRef } from 'react'

interface MarqueeItem {
  readonly emoji: string
  readonly label: string
}

/** Cocinas del marquee — espejo de las plantillas reales del producto. */
const MARQUEE_ITEMS: readonly MarqueeItem[] = [
  { emoji: '🍕', label: 'Pizza Rústica' },
  { emoji: '🍔', label: 'Burger Joint' },
  { emoji: '🍣', label: 'Sushi Zen' },
  { emoji: '🌮', label: 'Taquería Viva' },
  { emoji: '🍜', label: 'Neon Ramen' },
  { emoji: '☕', label: 'Artisan Coffee' },
  { emoji: '🥗', label: 'Vegan Garden' },
  { emoji: '🍝', label: 'La Trattoria' },
  { emoji: '🦐', label: 'Marisquería' },
  { emoji: '🍦', label: 'Heladería' },
  { emoji: '🥖', label: 'Panadería' },
  { emoji: '🥩', label: 'Steakhouse' },
] as const

/** Inclinación máxima del marquee según velocidad de scroll. */
const MAX_SKEW_DEG = 9

/**
 * Cinta infinita de cocinas que reacciona al scroll: la velocidad con la que
 * el visitante baja inclina (skew) la cinta y decae suavemente al detenerse.
 * El loop es perfecto (track duplicado + translateX(-50%)). Decorativa.
 */
export function FoodMarquee() {
  const skewRef = useRef<HTMLDivElement>(null)
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let lastY = window.scrollY
    let skew = 0

    const tick = (): void => {
      const y = window.scrollY
      const velocity = y - lastY
      lastY = y
      const target = Math.max(-MAX_SKEW_DEG, Math.min(MAX_SKEW_DEG, velocity * 0.4))
      skew += (target - skew) * 0.12
      skewRef.current?.style.setProperty('--mk-skew', `${skew.toFixed(2)}deg`)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="mk-marquee relative overflow-hidden border-y border-white/[0.06] bg-[#0b0907] py-5"
    >
      {/* Desvanecidos laterales para que la cinta "emerja" de los bordes */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-[#0b0907] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-[#0b0907] to-transparent" />

      <div ref={skewRef} className="mk-skew-wrap">
        <div className="mk-marquee-track">
          {doubled.map((item, index) => (
            <span
              key={`${item.label}-${index}`}
              className="mx-6 flex shrink-0 items-center gap-3 text-[13px] font-bold uppercase tracking-[0.22em] text-white/35"
            >
              <span className="text-2xl">{item.emoji}</span>
              {item.label}
              <span className="ml-6 h-1.5 w-1.5 rounded-full bg-[#e99a0e]/50" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
