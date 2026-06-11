import { useState, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Check } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import type { Dish, DishVariantGroup } from '@core/domain/entities/Dish'
import type { TenantBranding } from '@core/domain/entities/Tenant'
import { getThemeColors } from '@shared/utils/colorScale'

interface DishSelectionModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly dish: Dish
  readonly branding: TenantBranding
}

export function DishSelectionModal({ isOpen, onClose, dish, branding }: DishSelectionModalProps) {
  const tc = getThemeColors(branding)
  
  // Customizer styling variables
  const cardStyle = branding.detailsCardStyle ?? 'glass'
  const optionStyle = branding.detailsCardOptionStyle ?? 'list'
  const showImage = (branding.detailsCardShowImage ?? true) && Boolean(dish.assets.imageUrl)

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

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        {/* Backdrop blur overlay */}
        <Dialog.Overlay 
          className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in" 
        />
        
        {/* Bottom sheet content */}
        <Dialog.Content 
          className={cn(
            "fixed bottom-0 left-[50%] translate-x-[-50%] z-[1000] w-full max-w-md flex flex-col focus:outline-none",
            "transition-all duration-300 transform rounded-t-[2.5rem]",
            "max-h-[88vh] border-t border-white/[0.08] shadow-2xl animate-slide-up",
            cardStyle === 'glass' 
              ? "bg-zinc-950/85 backdrop-blur-2xl shadow-brand-500/5 text-neutral-100" 
              : "bg-zinc-950 text-neutral-100"
          )}
          style={{ 
            fontFamily: tc.font,
            borderColor: tc.border
          }}
        >
          {/* Top pill bar (design indicator for bottom sheet) */}
          <div className="flex justify-center py-3 shrink-0">
            <div className="w-12 h-1 rounded-full bg-white/15" />
          </div>

          <div className="overflow-y-auto px-6 pb-28 pt-1 flex flex-col gap-5">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-xl font-black text-white leading-tight tracking-tight">
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
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={15} />
                </button>
              </Dialog.Close>
            </div>

            {/* Product image (optional customizer display) */}
            {showImage && (
              <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-neutral-900 shrink-0">
                <img
                  src={dish.assets.imageUrl ?? ''}
                  alt={dish.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Description */}
            {dish.description && (
              <p className="text-xs leading-relaxed text-neutral-300 font-medium bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                {dish.description}
              </p>
            )}

            {/* Variant configuration choices */}
            {dish.variantGroups.length > 0 ? (
              <div className="flex flex-col gap-4 mt-1">
                {dish.variantGroups.map((group) => {
                  const selectedIds = selections[group.id] ?? []
                  return (
                    <div key={group.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          {group.name}
                          {group.required && <span className="text-brand-400 ml-1 font-black">*</span>}
                        </span>
                        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[8.5px] font-bold text-neutral-400 border border-white/10">
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
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all border",
                                  isSelected
                                    ? "bg-white text-zinc-950 font-black shadow-md border-white"
                                    : "bg-white/[0.03] border-white/[0.08] text-neutral-300 hover:bg-white/[0.06]"
                                )}
                              >
                                {isSelected && <Check size={11} className="stroke-[3]" />}
                                {opt.name}
                                {opt.priceDelta > 0 && (
                                  <span className={cn("text-[10px] font-extrabold", isSelected ? "text-neutral-500" : "text-brand-400")}>
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
                                className={cn(
                                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all border",
                                  isSelected
                                    ? "bg-white/[0.04] border-white/15 shadow-sm"
                                    : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]"
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {/* Radio/Checkbox circle indicator */}
                                  <div
                                    className={cn(
                                      "flex h-4.5 w-4.5 shrink-0 items-center justify-center border transition-all",
                                      group.multiSelect ? "rounded" : "rounded-full",
                                      isSelected
                                        ? "bg-brand-500 border-brand-500"
                                        : "border-white/20 bg-transparent"
                                    )}
                                    style={{
                                      backgroundColor: isSelected ? tc.primary : undefined,
                                      borderColor: isSelected ? tc.primary : undefined
                                    }}
                                  >
                                    {isSelected && <Check size={10} className="text-white stroke-[3.5]" />}
                                  </div>
                                  <span className={cn("text-xs font-semibold truncate", isSelected ? "text-white" : "text-neutral-300")}>
                                    {opt.name}
                                  </span>
                                </div>
                                <span className={cn(
                                  'text-xs font-bold shrink-0',
                                  opt.priceDelta === 0 ? 'text-neutral-500' : 'text-brand-450'
                                )}>
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
              <p className="text-xs text-neutral-450 text-center py-6">
                Este plato no requiere personalización adicional.
              </p>
            )}
          </div>

          {/* Sticky checkout/add button panel */}
          <div 
            className="absolute bottom-0 left-0 right-0 p-5 border-t border-white/[0.08] flex flex-col shrink-0 rounded-b-[2.5rem]"
            style={{ 
              background: cardStyle === 'glass' ? "rgba(9,9,11,0.95)" : "#09090b",
              backdropFilter: cardStyle === 'glass' ? "blur(20px)" : "none"
            }}
          >
            <button
              type="button"
              disabled={!canSubmit}
              onClick={onClose}
              className={cn(
                "w-full rounded-2xl py-3.5 text-sm font-black text-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2",
                canSubmit
                  ? "hover:scale-[1.01]"
                  : "opacity-40 cursor-not-allowed"
              )}
              style={{
                background: canSubmit ? `linear-gradient(135deg, ${tc.primary} 0%, ${tc.primary}cc 100%)` : 'rgba(255,255,255,0.05)',
                boxShadow: canSubmit ? `0 4px 18px ${tc.primary}33` : 'none'
              }}
            >
              Listo • {fmt(totalPrice)}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
