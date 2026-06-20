import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/** Ancho lógico de un teléfono; el contenido se renderiza a este ancho y se escala. */
const LOGICAL_PHONE_WIDTH = 390

interface PhonePreviewFrameProps {
  readonly backgroundColor: string
  readonly children: ReactNode
}

/**
 * Marco de teléfono que escala el menú para que SIEMPRE se vea proporcional.
 *
 * El contenido se renderiza a un ancho fijo (390px, como un teléfono real) y se
 * reduce con `transform: scale` para encajar en el marco disponible. Así, cuando
 * el sheet de controles achica el marco, el menú no se reacomoda "enorme": se ve
 * como un celular visto de lejos. `scale` también contiene los elementos
 * `position: fixed` del template dentro del marco.
 */
export function PhonePreviewFrame({ backgroundColor, children }: PhonePreviewFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) setSize({ width: rect.width, height: rect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scale = size.width > 0 ? size.width / LOGICAL_PHONE_WIDTH : 0

  return (
    <div
      ref={frameRef}
      className="transform-gpu relative aspect-[10/19] h-full max-h-full w-auto overflow-hidden rounded-[2.3rem] border-2 border-white/10 bg-black shadow-2xl ring-1 ring-white/5"
    >
      {scale > 0 && (
        <div
          className="scrollbar-hide absolute left-0 top-0 origin-top-left overflow-y-auto"
          style={{
            width: LOGICAL_PHONE_WIDTH,
            height: size.height / scale,
            transform: `scale(${scale})`,
            backgroundColor,
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
