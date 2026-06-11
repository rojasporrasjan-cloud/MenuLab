import { useRef } from 'react'
import { Leaf, Flame, Wheat, Milk, Fish, Nut } from 'lucide-react'
import type {
  DataLayer,
  DataLayerBinding,
  DataLayerTextStyle,
  CanvaTemplateRef,
} from '@features/editor/types/blocks.types'

// ─── Resolved data context ────────────────────────────────────────────────────

export interface ResolvedDish {
  readonly name: string
  readonly price: string
  readonly description: string | null
  readonly imageUrl: string | null
  readonly tags: readonly string[]
}

export interface ResolvedCategory {
  readonly name: string
}

export interface ResolvedTenant {
  readonly name: string
  readonly logoUrl: string | null
  readonly tagline: string | null
  readonly phone: string | null
  readonly address: string | null
}

export interface DataLayerContext {
  readonly dishes: Readonly<Record<string, ResolvedDish>>
  readonly categories: Readonly<Record<string, ResolvedCategory>>
  readonly tenant: ResolvedTenant | null
}

// ─── Layer position patch ─────────────────────────────────────────────────────

export interface LayerPositionPatch {
  readonly x?: number
  readonly y?: number
  readonly width?: number
  readonly height?: number
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DataLayerRendererProps {
  readonly canvaTemplate: CanvaTemplateRef | null
  readonly layers: readonly DataLayer[]
  readonly context: DataLayerContext
  readonly selectedLayerId?: string | null
  readonly onSelectLayer?: (layerId: string | null) => void
  readonly interactive?: boolean
  readonly onMoveLayer?: (layerId: string, x: number, y: number) => void
  readonly onResizeLayer?: (layerId: string, patch: LayerPositionPatch) => void
}

// ─── Text style → inline CSS ──────────────────────────────────────────────────

function textStyleToCSS(style: DataLayerTextStyle | null): React.CSSProperties {
  if (!style) return {}
  return {
    fontFamily:  style.fontFamily ?? undefined,
    fontSize:    style.fontSize != null ? `${style.fontSize}px` : undefined,
    fontWeight:  style.fontWeight,
    color:       style.color,
    textAlign:   style.align,
    lineHeight:  style.lineHeight,
    padding:     (style.paddingX || style.paddingY)
      ? `${style.paddingY}px ${style.paddingX}px`
      : undefined,
  }
}

// ─── Binding resolvers ────────────────────────────────────────────────────────

interface BindingRenderResult {
  readonly content: React.ReactNode
  readonly isImage: boolean
}

function resolveBinding(
  binding: DataLayerBinding,
  context: DataLayerContext,
): BindingRenderResult {
  switch (binding.type) {

    case 'static':
      return { content: binding.content, isImage: false }

    case 'tenant-field': {
      const t = context.tenant
      if (!t) return { content: <Placeholder label={`tenant.${binding.field}`} />, isImage: false }
      if (binding.field === 'logoUrl') {
        return t.logoUrl
          ? { content: <img src={t.logoUrl} alt="Logo" className="h-full w-full object-contain" loading="lazy" />, isImage: true }
          : { content: <Placeholder label="logo" />, isImage: true }
      }
      const fieldValue: string | null =
        binding.field === 'name'    ? t.name    :
        binding.field === 'tagline' ? t.tagline :
        binding.field === 'phone'   ? t.phone   :
        binding.field === 'address' ? t.address : null
      return { content: fieldValue ?? <Placeholder label={binding.field} />, isImage: false }
    }

    case 'category-name': {
      const cat = context.categories[binding.categoryId]
      return cat
        ? { content: cat.name, isImage: false }
        : { content: <Placeholder label="categoría" />, isImage: false }
    }

    case 'dish-field': {
      const dish = context.dishes[binding.dishId]
      if (!dish) return { content: <Placeholder label={binding.field} />, isImage: binding.field === 'imageUrl' }

      if (binding.field === 'imageUrl') {
        return dish.imageUrl
          ? { content: <img src={dish.imageUrl} alt={dish.name} className="h-full w-full object-cover" loading="lazy" />, isImage: true }
          : { content: <Placeholder label="imagen" />, isImage: true }
      }

      const fieldValue: string | null =
        binding.field === 'name'        ? dish.name        :
        binding.field === 'price'       ? dish.price       :
        binding.field === 'description' ? dish.description : null

      return { content: fieldValue ?? <Placeholder label={binding.field} />, isImage: false }
    }

    case 'dish-list': {
      const matchingDishes = Object.values(context.dishes).slice(0, binding.maxItems)

      if (matchingDishes.length === 0) {
        return { content: <DishListPlaceholder layout={binding.layout} maxItems={binding.maxItems} />, isImage: false }
      }

      if (binding.layout === 'grid') {
        return {
          isImage: false,
          content: (
            <div className="h-full w-full overflow-hidden grid grid-cols-2 gap-1">
              {matchingDishes.map((d, i) => (
                <div key={i} className="flex items-center justify-between gap-0.5 text-[0.55em] leading-snug px-0.5">
                  <span className="truncate">{d.name}</span>
                  <span className="shrink-0 tabular-nums opacity-75">{d.price}</span>
                </div>
              ))}
            </div>
          ),
        }
      }

      return {
        isImage: false,
        content: (
          <div className="h-full w-full overflow-hidden flex flex-col justify-evenly">
            {matchingDishes.map((d, i) => (
              <div key={i} className="flex items-baseline gap-1 text-[0.6em] leading-tight px-0.5">
                <span className="truncate shrink-0" style={{ maxWidth: '60%' }}>{d.name}</span>
                <span
                  className="flex-1"
                  style={{ borderBottom: '1px dotted currentColor', opacity: 0.25, marginBottom: '2px' }}
                />
                <span className="shrink-0 tabular-nums opacity-70">{d.price}</span>
              </div>
            ))}
          </div>
        ),
      }
    }
  }
}

// ─── Allergen / tag badges ────────────────────────────────────────────────────

type LucideIcon = React.ComponentType<{ size?: number; className?: string }>

interface TagDescriptor {
  readonly icon: LucideIcon
  readonly label: string
  readonly colorClass: string
}

const TAG_MAP: Readonly<Record<string, TagDescriptor>> = {
  'vegan':       { icon: Leaf,  label: 'Vegano',      colorClass: 'bg-green-500/80  text-white' },
  'vegetarian':  { icon: Leaf,  label: 'Vegetariano', colorClass: 'bg-green-400/80  text-white' },
  'spicy':       { icon: Flame, label: 'Picante',     colorClass: 'bg-red-500/80    text-white' },
  'gluten-free': { icon: Wheat, label: 'Sin Gluten',  colorClass: 'bg-amber-500/80  text-white' },
  'dairy':       { icon: Milk,  label: 'Lácteos',     colorClass: 'bg-blue-400/80   text-white' },
  'seafood':     { icon: Fish,  label: 'Mariscos',    colorClass: 'bg-cyan-500/80   text-white' },
  'nuts':        { icon: Nut,   label: 'Nueces',      colorClass: 'bg-orange-500/80 text-white' },
}

function TagBadges({ tags }: { readonly tags: readonly string[] }) {
  const known = tags
    .map((t) => TAG_MAP[t.toLowerCase()])
    .filter((d): d is TagDescriptor => d !== undefined)

  if (known.length === 0) return null

  return (
    <div className="absolute bottom-0.5 left-0.5 flex flex-wrap gap-0.5">
      {known.map((descriptor) => {
        const Icon = descriptor.icon
        return (
          <span
            key={descriptor.label}
            title={descriptor.label}
            className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[0.5em] font-semibold leading-none ${descriptor.colorClass}`}
          >
            <Icon size={8} />
            {descriptor.label}
          </span>
        )
      })}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Placeholder({ label }: { readonly label: string }) {
  return (
    <span className="inline-flex items-center rounded border border-dashed border-white/40 px-1 py-0.5 text-[0.7em] font-medium text-white/60">
      {label}
    </span>
  )
}

function DishListPlaceholder({ layout, maxItems }: { readonly layout: string; readonly maxItems: number }) {
  const rows = Math.min(maxItems, 5)
  return (
    <div className={[
      'flex h-full w-full gap-1',
      layout === 'grid' ? 'flex-wrap' : 'flex-col',
    ].join(' ')}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-1 animate-pulse items-center justify-between gap-2 rounded bg-white/10 px-2 py-1" />
      ))}
    </div>
  )
}

// ─── No-canvas placeholder ────────────────────────────────────────────────────

function NoCanvasPlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-zinc-950">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-zinc-700">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
      <div className="text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Sin plantilla</p>
        <p className="mt-1 text-[9px] text-zinc-700">Selecciona una en el panel lateral</p>
      </div>
    </div>
  )
}

// ─── Resize handle ────────────────────────────────────────────────────────────

type ResizeDir = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'

interface DragRefState {
  startCX: number
  startCY: number
  startLX: number
  startLY: number
  startLW: number
  startLH: number
  cW: number
  cH: number
}

interface ResizeHandleProps {
  readonly dir: ResizeDir
  readonly layer: DataLayer
  readonly containerRef: React.RefObject<HTMLDivElement | null>
  readonly onResize: (layerId: string, patch: LayerPositionPatch) => void
}

const HANDLE_STYLE: Record<ResizeDir, React.CSSProperties> = {
  nw: { top: -5,  left: -5,  cursor: 'nwse-resize' },
  ne: { top: -5,  right: -5, cursor: 'nesw-resize' },
  se: { bottom: -5, right: -5, cursor: 'nwse-resize' },
  sw: { bottom: -5, left: -5, cursor: 'nesw-resize' },
  n:  { top: -5,  left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
  s:  { bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
  e:  { right: -5, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' },
  w:  { left: -5,  top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' },
}

function ResizeHandle({ dir, layer, containerRef, onResize }: ResizeHandleProps) {
  const startRef = useRef<DragRefState>({ startCX: 0, startCY: 0, startLX: 0, startLY: 0, startLW: 0, startLH: 0, cW: 0, cH: 0 })

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    startRef.current = {
      startCX: e.clientX,
      startCY: e.clientY,
      startLX: layer.position.x,
      startLY: layer.position.y,
      startLW: layer.position.width,
      startLH: layer.position.height,
      cW: rect.width,
      cH: rect.height,
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!(e.buttons & 1)) return
    const s = startRef.current
    if (!s.cW) return
    const rawDx = ((e.clientX - s.startCX) / s.cW) * 100
    const rawDy = ((e.clientY - s.startCY) / s.cH) * 100

    let patch: LayerPositionPatch

    if (dir === 'nw') {
      patch = {
        x: Math.max(0, s.startLX + rawDx),
        y: Math.max(0, s.startLY + rawDy),
        width: Math.max(4, s.startLW - rawDx),
        height: Math.max(4, s.startLH - rawDy),
      }
    } else if (dir === 'n') {
      patch = {
        y: Math.max(0, s.startLY + rawDy),
        height: Math.max(4, s.startLH - rawDy),
      }
    } else if (dir === 'ne') {
      patch = {
        y: Math.max(0, s.startLY + rawDy),
        width: Math.max(4, s.startLW + rawDx),
        height: Math.max(4, s.startLH - rawDy),
      }
    } else if (dir === 'e') {
      patch = { width: Math.max(4, s.startLW + rawDx) }
    } else if (dir === 'se') {
      patch = {
        width: Math.max(4, s.startLW + rawDx),
        height: Math.max(4, s.startLH + rawDy),
      }
    } else if (dir === 's') {
      patch = { height: Math.max(4, s.startLH + rawDy) }
    } else if (dir === 'sw') {
      patch = {
        x: Math.max(0, s.startLX + rawDx),
        width: Math.max(4, s.startLW - rawDx),
        height: Math.max(4, s.startLH + rawDy),
      }
    } else {
      patch = {
        x: Math.max(0, s.startLX + rawDx),
        width: Math.max(4, s.startLW - rawDx),
      }
    }

    onResize(layer.id, patch)
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 2,
        background: '#ffffff',
        border: '1.5px solid rgba(0,0,0,0.45)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
        zIndex: 1000,
        touchAction: 'none',
        ...HANDLE_STYLE[dir],
      }}
    />
  )
}

// ─── Individual layer ─────────────────────────────────────────────────────────

interface LayerNodeProps {
  readonly layer: DataLayer
  readonly context: DataLayerContext
  readonly isSelected: boolean
  readonly interactive: boolean
  readonly containerRef: React.RefObject<HTMLDivElement | null>
  readonly onSelect?: (id: string | null) => void
  readonly onMove?: (layerId: string, x: number, y: number) => void
  readonly onResize?: (layerId: string, patch: LayerPositionPatch) => void
}

function LayerNode({ layer, context, isSelected, interactive, containerRef, onSelect, onMove, onResize }: LayerNodeProps) {
  // ── Drag refs — los hooks van SIEMPRE antes de cualquier early return ──
  const hasMoved    = useRef(false)
  const dragRef     = useRef<DragRefState>({ startCX: 0, startCY: 0, startLX: 0, startLY: 0, startLW: 0, startLH: 0, cW: 0, cH: 0 })

  if (!layer.visible) return null

  const { content, isImage } = resolveBinding(layer.binding, context)

  const dishTags: readonly string[] | null =
    layer.binding.type === 'dish-field' && layer.binding.field === 'name'
      ? (context.dishes[layer.binding.dishId]?.tags ?? null)
      : null

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!interactive) return
    // Ignore clicks on resize handles (they stop propagation themselves)
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    hasMoved.current = false
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    dragRef.current = {
      startCX: e.clientX,
      startCY: e.clientY,
      startLX: layer.position.x,
      startLY: layer.position.y,
      startLW: layer.position.width,
      startLH: layer.position.height,
      cW: rect.width,
      cH: rect.height,
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!(e.buttons & 1) || !interactive || !onMove) return
    const s = dragRef.current
    if (!s.cW) return
    const dx = ((e.clientX - s.startCX) / s.cW) * 100
    const dy = ((e.clientY - s.startCY) / s.cH) * 100
    if (!hasMoved.current && Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) return
    hasMoved.current = true
    const newX = Math.max(0, Math.min(90, s.startLX + dx))
    const newY = Math.max(0, Math.min(95, s.startLY + dy))
    onMove(layer.id, newX, newY)
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (!hasMoved.current) {
      onSelect?.(layer.id)
    }
  }

  const bgColor = layer.textStyle?.backgroundColor
  const posStyle: React.CSSProperties = {
    position:        'absolute',
    left:            `${layer.position.x}%`,
    top:             `${layer.position.y}%`,
    width:           `${layer.position.width}%`,
    height:          `${layer.position.height}%`,
    zIndex:          layer.position.zIndex,
    transform:       layer.position.rotation !== 0 ? `rotate(${layer.position.rotation}deg)` : undefined,
    opacity:         layer.opacity,
    borderRadius:    layer.borderRadius > 0 ? `${layer.borderRadius}px` : undefined,
    overflow:        'hidden',
    cursor:          interactive ? 'grab' : 'default',
    touchAction:     'none',
    backgroundColor: bgColor ?? undefined,
    ...(isImage ? {} : textStyleToCSS(layer.textStyle)),
  }

  const selectionStyle: React.CSSProperties = isSelected ? {
    outline:       '2px solid rgba(255,255,255,0.9)',
    outlineOffset: '2px',
    boxShadow:     '0 0 0 1px rgba(0,0,0,0.6), 0 0 0 5px rgba(255,255,255,0.12)',
  } : {}

  const RESIZE_DIRS: readonly ResizeDir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

  return (
    <div
      style={{ ...posStyle, ...selectionStyle }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      title={interactive ? (layer.label ?? layer.id) : undefined}
    >
      {isImage
        ? content
        : <span style={{ display: 'block', width: '100%', height: '100%', overflow: 'hidden' }}>{content}</span>
      }

      {dishTags && dishTags.length > 0 && <TagBadges tags={dishTags} />}

      {isSelected && (
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" />
      )}

      {isSelected && interactive && onResize && RESIZE_DIRS.map((dir) => (
        <ResizeHandle
          key={dir}
          dir={dir}
          layer={layer}
          containerRef={containerRef}
          onResize={onResize}
        />
      ))}
    </div>
  )
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export function DataLayerRenderer({
  canvaTemplate,
  layers,
  context,
  selectedLayerId = null,
  onSelectLayer,
  interactive = false,
  onMoveLayer,
  onResizeLayer,
}: DataLayerRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const aspectRatio  = canvaTemplate
    ? canvaTemplate.widthPx / canvaTemplate.heightPx
    : 9 / 16

  const sortedLayers = [...layers].sort((a, b) => a.position.zIndex - b.position.zIndex)

  return (
    <div
      ref={containerRef}
      id="menu-canvas-container"
      className="relative w-full overflow-hidden rounded-xl bg-black shadow-lg"
      style={{ aspectRatio }}
      onClick={() => interactive && onSelectLayer?.(null)}
    >
      {canvaTemplate
        ? (
          <img
            src={canvaTemplate.exportUrl}
            alt="Plantilla de fondo"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none"
            draggable={false}
            loading="lazy"
          />
        )
        : <NoCanvasPlaceholder />
      }

      {sortedLayers.map((layer) => (
        <LayerNode
          key={layer.id}
          layer={layer}
          context={context}
          isSelected={selectedLayerId === layer.id}
          interactive={interactive}
          containerRef={containerRef}
          onSelect={onSelectLayer}
          onMove={onMoveLayer}
          onResize={onResizeLayer}
        />
      ))}
    </div>
  )
}
