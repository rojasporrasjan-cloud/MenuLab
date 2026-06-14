import { Link } from 'react-router-dom'
import { Pencil, Trash2, ChefHat, Leaf, Wheat, ChevronUp, ChevronDown, EyeOff, Eye } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { Spinner } from '@shared/ui/components/Spinner'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { ROUTES } from '@shared/constants/routes'
import type { Dish, DishStatus } from '@core/domain/entities/Dish'

interface AdminDishCardProps {
  readonly dish: Dish
  readonly isDeleting: boolean
  readonly isFirst?: boolean
  readonly isLast?: boolean
  readonly isMoving?: boolean
  readonly onDelete: (dishId: string) => void
  readonly onToggleStatus: (dishId: string, newStatus: DishStatus) => void
  readonly onMoveUp?: () => void
  readonly onMoveDown?: () => void
}

const STATUS_LABELS: Record<DishStatus, string> = {
  available:   'DISPONIBLE',
  unavailable: 'PAUSADO',
  seasonal:    'TEMPORADA',
}

const STATUS_STYLES: Record<DishStatus, string> = {
  available:   'bg-emerald-500/90 text-white shadow-emerald-900/20 backdrop-blur-md',
  unavailable: 'bg-zinc-800/90 text-zinc-100 shadow-zinc-900/20 backdrop-blur-md',
  seasonal:    'bg-amber-500/90 text-white shadow-amber-900/20 backdrop-blur-md',
}

const NEXT_STATUS: Record<DishStatus, DishStatus> = {
  available:   'unavailable',
  unavailable: 'available',
  seasonal:    'available',
}

export function AdminDishCard({
  dish,
  isDeleting,
  isFirst = false,
  isLast = false,
  isMoving = false,
  onDelete,
  onToggleStatus,
  onMoveUp,
  onMoveDown,
}: AdminDishCardProps) {
  const editUrl =
    `${ROUTES.admin.dishes.editor.replace(':dishId', dish.id)}?menuId=${dish.menuId}`

  const handleDelete = () => {
    if (confirm(`¿Eliminar "${dish.name}"? Esta acción no se puede deshacer.`)) {
      onDelete(dish.id)
    }
  }

  const isAvailable = dish.status === 'available' || dish.status === 'seasonal'

  return (
    <div
      className={`group relative flex flex-col rounded-[24px] border border-zinc-200/80 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-amber-200 transition-all duration-300 overflow-hidden ${!isAvailable ? 'opacity-85 grayscale-[0.2]' : ''}`}
      style={{
        opacity:     (isDeleting || isMoving) ? 0.5 : undefined,
        pointerEvents: (isDeleting || isMoving) ? 'none' : undefined,
      }}
    >
      {/* Image */}
      <div className="relative h-[180px] w-full overflow-hidden bg-zinc-100">
        {dish.assets.imageUrl ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
            <img
              src={dish.assets.imageUrl}
              alt={dish.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-50 border-b border-zinc-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <ChefHat size={28} className="text-zinc-300" strokeWidth={1.5} />
            </div>
            <p className="mt-3 text-[12px] font-medium text-zinc-400">Sin fotografía</p>
          </div>
        )}

        {/* Status badge */}
        <span
          className={cn(
            "absolute left-3 top-3 z-20 rounded-full px-3 py-1 text-[10px] font-black tracking-widest shadow-md",
            STATUS_STYLES[dish.status]
          )}
        >
          {STATUS_LABELS[dish.status]}
        </span>

        {/* Reorder controls — top-right, always visible now, combined capsule */}
        {(onMoveUp || onMoveDown) && (
          <div className="absolute right-3 top-3 z-20 flex flex-col items-center rounded-full bg-white/90 p-0.5 shadow-lg backdrop-blur-md border border-zinc-200/50">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst || isMoving}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition-all hover:bg-zinc-100 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Mover arriba"
            >
              <ChevronUp size={16} strokeWidth={2.5} />
            </button>
            <div className="h-px w-4 bg-zinc-200/80 my-0.5" />
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast || isMoving}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition-all hover:bg-zinc-100 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Mover abajo"
            >
              <ChevronDown size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Delete spinner */}
        {(isDeleting || isMoving) && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <Spinner size="md" />
          </div>
        )}
        
        {/* Name over image if it has image */}
        {dish.assets.imageUrl && (
          <div className="absolute bottom-3 left-3 right-3 z-20">
            <p className="text-[16px] font-bold leading-tight text-white drop-shadow-md line-clamp-2">
              {dish.name}
            </p>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 pt-3 gap-2">
        {!dish.assets.imageUrl && (
          <p className="text-[15px] font-bold leading-tight text-zinc-800 line-clamp-2">
            {dish.name}
          </p>
        )}
        
        <div className="flex items-center">
          <p className="text-[18px] font-black text-amber-600 tracking-tight">
            {formatCurrency(dish.price.amount, dish.price.currency)}
          </p>
        </div>

        {dish.description && (
          <p className="line-clamp-2 text-[13px] text-zinc-500 leading-relaxed mt-1">
            {dish.description}
          </p>
        )}

        {/* Dietary badges */}
        {(dish.nutrition.isVegetarian || dish.nutrition.isVegan || dish.nutrition.isGlutenFree) && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {dish.nutrition.isVegan && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                <Leaf size={10} /> VEGANO
              </span>
            )}
            {dish.nutrition.isVegetarian && !dish.nutrition.isVegan && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                <Leaf size={10} /> VEGETARIANO
              </span>
            )}
            {dish.nutrition.isGlutenFree && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                <Wheat size={10} /> SIN GLUTEN
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 p-3 bg-zinc-50 border-t border-zinc-100">
        <button
          type="button"
          onClick={() => onToggleStatus(dish.id, NEXT_STATUS[dish.status])}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition-all shadow-sm border ${
            isAvailable 
              ? 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900' 
              : 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600 hover:shadow-md'
          }`}
        >
          {isAvailable ? (
            <>
              <EyeOff size={14} /> Pausar
            </>
          ) : (
            <>
              <Eye size={14} /> Activar
            </>
          )}
        </button>
        <Link
          to={editUrl}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-600 transition-all hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 shadow-sm"
          aria-label="Editar plato"
        >
          <Pencil size={15} />
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-red-200 text-red-500 transition-all hover:bg-red-50 hover:border-red-300 hover:text-red-700 disabled:opacity-50 shadow-sm"
          aria-label="Eliminar plato"
        >
          {isDeleting ? <Spinner size="sm" /> : <Trash2 size={15} />}
        </button>
      </div>
    </div>
  )
}
