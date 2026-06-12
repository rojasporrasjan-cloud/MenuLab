import { useState, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Check } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { COPY } from '@shared/copy/ui.copy'
import type { Dish, DishVariantGroup } from '@core/domain/entities/Dish'
import type { TenantBranding } from '@core/domain/entities/Tenant'
import { getThemeColors } from '@shared/utils/colorScale'

export interface DishCartSelection {
  readonly dishId: string
  readonly dishName: string
  readonly unitPrice: number
  readonly currency: string
  readonly variantLabel: string | null
}

interface DishSelectionModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly dish: Dish
  readonly branding: TenantBranding
  /** Si está presente, el CTA agrega el plato al carrito (pedidos en línea). */
  readonly onAddToCart?: (selection: DishCartSelection) => void
}

export function DishSelectionModal({ isOpen, onClose, dish, branding, onAddToCart }: DishSelectionModalProps) {
  const tc = getThemeColors(branding)

  // Customizer styling variables
  const cardStyle = branding.detailsCardStyle ?? 'glass'
  const optionStyle = branding.detailsCardOptionStyle ?? 'list'
  const showImage = (branding.detailsCardShowImage ?? true) && Boolean(dish.assets.imageUrl)

  // Theme-derived surfaces — el modal hereda el fondo y los colores de la
  // plantilla/logo en lugar de un negro fijo. `color-mix` da el efecto vidrio
  // sin perder el tinte del tema (funciona sobre fondos claros y oscuros).
  const sheetBg = cardStyle === 'glass' ? `color-mix(in srgb, ${tc.bg} 86%, transparent)` : tc.bg
  const footerBg = cardStyle === 'glass' ? `color-mix(in srgb, ${tc.bg} 92%, transparent)` : tc.bg

  // Selections: Record<groupId, array of optionIds>
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    // Pre-select first option for required single-select groups to improve UX
    dish.variantGroups.forEach((group) => {
      if (group.required && !group.multiSelect && group.options.length > 0) {
        const firstAvailable = group.options.find(o => o.available)
        if (firstAvailable) {
          initial[group.id] = [firstAvailable.id]
        }
      }
    })
    return initial
  })

  // Format currency helper
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: dish.price.currency,
      minimumFractionDigits: 0,
    }).format(n)

  // Toggle selection handler
  const handleToggleOption = (group: DishVariantGroup, optionId: string) => {
    setSelections((prev) => {
      const current = prev[group.id] ?? []
      if (group.multiSelect) {
        if (current.includes(optionId)) {
          return { ...prev, [group.id]: current.filter((id) => id !== optionId) }
        } else {
          return { ...prev, [group.id]: [...current, optionId] }
        }
      } else {
        // Single select
        if (current.includes(optionId)) {
          // If required, do not allow deselecting
          if (group.required) return prev
          return { ...prev, [group.id]: [] }
        } else {
          return { ...prev, [group.id]: [optionId] }
        }
      }
    })
  }

  // Calculate total price delta of selected options
  const totalDelta = useMemo(() => {
    let delta = 0
    dish.variantGroups.forEach((group) => {
      const selectedIds = selections[group.id] ?? []
      selectedIds.forEach((optId) => {
        const option = group.options.find((o) => o.id === optId)
        if (option) {
          delta += option.priceDelta
        }
      })
    })
    return delta
  }, [selections, dish])

  const totalPrice = dish.price.amount + totalDelta

  // Check if all required groups have at least one selection
  const canSubmit = useMemo(() => {
    return dish.variantGroups.every((group) => {
      if (!group.required) return true
      const selected = selections[group.id] ?? []
      return selected.length > 0
    })
  }, [selections, dish])

  // Human-readable label of the chosen variants (for the cart line)
  const variantLabel = useMemo(() => {
    const names: string[] = []
    dish.variantGroups.forEach((group) => {
      const selectedIds = selections[group.id] ?? []
      selectedIds.forEach((optId) => {
        const option = group.options.find((o) => o.id === optId)
        if (option) names.push(option.name)
      })
    })
    return names.length > 0 ? names.join(', ') : null
  }, [selections, dish])

  const handleSubmit = () => {
    if (onAddToCart) {
      onAddToCart({
        dishId: dish.id,
        dishName: dish.name,
        unitPrice: totalPrice,
        currency: dish.price.currency,
        variantLabel,
      })
    }
    onClose()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        {/* Backdrop blur overlay */}
        <Dialog.Overlay
          className="fixed inset-0 z-[999] bg-black/55 backdrop-blur-md animate-fade-in"
        />

        {/* Bottom sheet content — hereda el tema de la plantilla */}
        <Dialog.Content
          className={cn(
            "fixed bottom-0 left-[50%] translate-x-[-50%] z-[1000] w-full max-w-md flex flex-col focus:outline-none",
            "rounded-t-[2.5rem] max-h-[88vh] border-t shadow-2xl animate-slide-up",
          )}
          style={{
            fontFamily: tc.font,
            background: sheetBg,
            color: tc.text,
            borderColor: tc.border,
            backdropFilter: cardStyle === 'glass' ? 'blur(22px)' : undefined,
          }}
        >
          {/* Top pill bar (design indicator for bottom sheet) */}
          <div className="flex justify-center py-3 shrink-0">
            <div className="w-12 h-1 rounded-full" style={{ background: tc.border }} />
          </div>

          <div className="overflow-y-auto px-6 pb-28 pt-1 flex flex-col gap-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-xl font-black leading-tight tracking-tight" style={{ color: tc.text }}>
                  {dish.name}
                </Dialog.Title>
                <p className="mt-1 text-xs font-semibold" style={{ color: tc.primary }}>
                  Precio base: {fmt(dish.price.amount)}
                </p>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Cerrar modal"
                  className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
                  style={{ background: tc.surface, borderColor: tc.border, color: tc.textMuted }}
                >
                  <X size={15} />
                </button>
              </Dialog.Close>
            </div>

            {/* Product image (optional customizer display) */}
            {showImage && (
              <div className="relative h-44 w-full overflow-hidden rounded-2xl border shrink-0" style={{ borderColor: tc.border, background: tc.surface }}>
                <img
                  src={dish.assets.imageUrl ?? ''}
                  alt={dish.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Description */}
            {dish.description && (
              <p className="text-xs leading-relaxed font-medium p-3 rounded-xl border" style={{ color: tc.textMuted, background: tc.surface, borderColor: tc.border }}>
                {dish.description}
              </p>
            )}

            {/* Variant configuration choices */}
            {dish.variantGroups.length > 0 ? (
              <div className="flex flex-col gap-4 mt-1">
                {dish.variantGroups.map((group) => {
                  const selectedIds = selections[group.id] ?? []
                  return (
                    <div key={group.id} className="rounded-2xl border p-4 flex flex-col gap-3" style={{ borderColor: tc.border, background: tc.surface }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tc.textMuted }}>
                          {group.name}
                          {group.required && <span className="ml-1 font-black" style={{ color: tc.primary }}>*</span>}
                        </span>
                        <span className="rounded-full px-2.5 py-0.5 text-[8.5px] font-bold border" style={{ color: tc.textMuted, background: tc.surface, borderColor: tc.border }}>
                          {group.required ? 'Obligatorio' : 'Opcional'}
                        </span>
                      </div>

                      {/* Display as Pills */}
                      {optionStyle === 'pills' ? (
                        <div className="flex flex-wrap gap-2">
                          {group.options.filter((o) => o.available).map((opt) => {
                            const isSelected = selectedIds.includes(opt.id)
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleToggleOption(group, opt.id)}
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all border"
                                style={
                                  isSelected
                                    ? { background: tc.primary, borderColor: tc.primary, color: '#ffffff' }
                                    : { background: tc.surface, borderColor: tc.border, color: tc.textMuted }
                                }
                              >
                                {isSelected && <Check size={11} className="stroke-[3]" />}
                                {opt.name}
                                {opt.priceDelta > 0 && (
                                  <span className="text-[10px] font-extrabold" style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : tc.primary }}>
                                    (+{fmt(opt.priceDelta)})
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        /* Display as classic List Row selection */
                        <div className="flex flex-col gap-2">
                          {group.options.filter((o) => o.available).map((opt) => {
                            const isSelected = selectedIds.includes(opt.id)
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleToggleOption(group, opt.id)}
                                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all border"
                                style={{
                                  background: tc.surface,
                                  borderColor: isSelected ? tc.primary : tc.border,
                                }}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {/* Radio/Checkbox circle indicator */}
                                  <div
                                    className={cn(
                                      "flex h-4.5 w-4.5 shrink-0 items-center justify-center border transition-all",
                                      group.multiSelect ? "rounded" : "rounded-full",
                                    )}
                                    style={{
                                      backgroundColor: isSelected ? tc.primary : 'transparent',
                                      borderColor: isSelected ? tc.primary : tc.border,
                                    }}
                                  >
                                    {isSelected && <Check size={10} className="text-white stroke-[3.5]" />}
                                  </div>
                                  <span className="text-xs font-semibold truncate" style={{ color: isSelected ? tc.text : tc.textMuted }}>
                                    {opt.name}
                                  </span>
                                </div>
                                <span className="text-xs font-bold shrink-0" style={{ color: opt.priceDelta === 0 ? tc.textMuted : tc.primary }}>
                                  {opt.priceDelta === 0 ? 'Incluido' : `+${fmt(opt.priceDelta)}`}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-center py-6" style={{ color: tc.textMuted }}>
                Este plato no requiere personalización adicional.
              </p>
            )}
          </div>

          {/* Sticky checkout/add button panel */}
          <div
            className="absolute bottom-0 left-0 right-0 p-5 border-t flex flex-col shrink-0 rounded-b-[2.5rem]"
            style={{
              background: footerBg,
              borderColor: tc.border,
              backdropFilter: cardStyle === 'glass' ? 'blur(20px)' : undefined,
            }}
          >
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className={cn(
                "w-full rounded-2xl py-3.5 text-sm font-black text-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2",
                canSubmit
                  ? "hover:scale-[1.01]"
                  : "opacity-40 cursor-not-allowed"
              )}
              style={{
                background: canSubmit ? `linear-gradient(135deg, ${tc.primary} 0%, ${tc.primary}cc 100%)` : tc.surface,
                color: canSubmit ? '#ffffff' : tc.textMuted,
                boxShadow: canSubmit ? `0 4px 18px ${tc.primary}33` : 'none'
              }}
            >
              {onAddToCart ? `${COPY.cart.addToCart} • ${fmt(totalPrice)}` : `Listo • ${fmt(totalPrice)}`}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
