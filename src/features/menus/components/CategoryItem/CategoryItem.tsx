import { Pencil, Trash2, ChevronUp, ChevronDown, Folder } from 'lucide-react'
import { Spinner } from '@shared/ui/components/Spinner'
import type { Category } from '@core/domain/entities/Category'

interface CategoryItemProps {
  category: Category
  index: number
  total: number
  isDeleting: boolean
  isMoving: boolean
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export function CategoryItem({
  category,
  index,
  total,
  isDeleting,
  isMoving,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: CategoryItemProps) {
  const isBusy = isDeleting || isMoving

  return (
    <div
      className={`group flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl p-3 transition-all duration-300 ${
        isBusy ? 'opacity-50 pointer-events-none' : 'bg-white border border-zinc-200 hover:border-amber-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center justify-center shrink-0 h-10 w-10 bg-amber-50 text-amber-600 rounded-xl">
          <Folder size={18} strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <p className="truncate text-[14px] font-bold text-zinc-800">
            {category.name}
          </p>
          {category.description ? (
            <p className="truncate text-[12px] text-zinc-500">
              {category.description}
            </p>
          ) : (
            <p className="text-[12px] text-zinc-400 italic">Sin descripción</p>
          )}
        </div>
      </div>

      {isBusy && (
        <div className="flex shrink-0 items-center justify-center pr-4">
          <Spinner size="sm" />
        </div>
      )}

      {!isBusy && (
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-1 bg-zinc-50 sm:bg-transparent p-1.5 sm:p-0 rounded-xl sm:rounded-none">
          
          {/* Controles de orden siempre visibles */}
          <div className="flex items-center gap-0.5 mr-2 bg-white sm:bg-zinc-50 border border-zinc-200/60 rounded-lg p-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Mover arriba"
            >
              <ChevronUp size={16} />
            </button>

            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Mover abajo"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="w-[1px] h-6 bg-zinc-200 mx-1 hidden sm:block" />

          {/* Acciones principales */}
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-bold text-zinc-600 bg-white sm:bg-transparent hover:bg-amber-100 hover:text-amber-800 transition-colors border border-zinc-200 sm:border-transparent"
          >
            <Pencil size={13} />
            <span className="hidden sm:inline">Editar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm(`¿Eliminar la categoría "${category.name}"? Los platos dentro de ella no se eliminarán.`)) onDelete()
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 bg-white sm:bg-transparent hover:bg-red-100 hover:text-red-600 transition-colors border border-zinc-200 sm:border-transparent"
            title="Eliminar categoría"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
