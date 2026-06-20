import { useEffect, useRef, useState } from 'react'

/** Ancho lógico de un teléfono; el iframe se renderiza a este ancho y se escala. */
const LOGICAL_PHONE_WIDTH = 390

interface PhonePreviewFrameProps {
  /** URL del menú en modo preview (ej. `/{tenant}/menu?preview=true`). */
  readonly src: string
  readonly backgroundColor: string
}

/**
 * Marco de teléfono que muestra el menú real dentro de un iframe escalado.
 *
 * Usar un iframe (en vez de escalar un div) es clave: dentro del iframe los
 * elementos `position: fixed` del template (ej. el botón "Ordenar ahora") se
 * posicionan respecto al viewport del iframe → quedan bien pegados abajo. El
 * iframe se renderiza a 390px de ancho y se reduce con `transform: scale` para
 * encajar en el marco disponible, así el menú siempre se ve proporcional.
 */
export function PhonePreviewFrame({ src, backgroundColor }: PhonePreviewFrameProps) {
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
      className="relative aspect-[10/19] h-full max-h-full w-auto overflow-hidden rounded-[2.3rem] border-2 border-black bg-black shadow-2xl ring-1 ring-white/10"
    >
      {scale > 0 && (
        <iframe
          src={src}
          title="Vista previa del menú"
          className="phone-preview-scroll absolute left-0 top-0 border-0"
          style={{
            width: LOGICAL_PHONE_WIDTH,
            height: size.height / scale,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            background: backgroundColor,
          }}
        />
      )}
    </div>
  )
}
