import { useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@shared/utils/cn'

interface RevealProps {
  readonly children: ReactNode
  /** Retraso de entrada en ms — para escalonar elementos hermanos. */
  readonly delay?: number
  readonly className?: string
}

/**
 * Revela su contenido con fade + slide-up cuando entra al viewport.
 * IntersectionObserver puro (sin librerías); la animación vive en CSS
 * (.mk-reveal / .mk-reveal-visible) y respeta prefers-reduced-motion.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  // Sin IntersectionObserver (entornos antiguos) el contenido nace visible.
  const [isVisible, setIsVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn('mk-reveal', isVisible && 'mk-reveal-visible', className)}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
