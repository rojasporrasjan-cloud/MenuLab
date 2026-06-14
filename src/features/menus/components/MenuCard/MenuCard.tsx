import { BookOpen, ChevronRight, Archive, Clock } from 'lucide-react'
import type { Menu } from '@core/domain/entities/Menu'

interface MenuCardProps {
  menu: Menu
  categoryCount: number
  dishCount?: number
  isSelected: boolean
  isArchiving: boolean
  onSelect: () => void
  onEdit: () => void
  onArchive: () => void
}

export function MenuCard({
  menu,
  categoryCount,
  isSelected,
  isArchiving,
  onSelect,
  onEdit,
  onArchive,
}: MenuCardProps) {
  const isArchived = menu.status === 'archived'
  const isActive = menu.status === 'active'

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col gap-3 rounded-[20px] p-4 transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? 'bg-gradient-to-b from-amber-50/50 to-white border-2 border-amber-400 shadow-[0_8px_24px_-10px_rgba(245,158,11,0.2)]'
          : 'bg-white border border-zinc-200 hover:border-amber-300 hover:shadow-md'
      } ${isArchived ? 'opacity-60 grayscale' : ''}`}
    >
      {/* Glow background if selected */}
      {isSelected && (
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
      )}

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${
              isSelected ? 'bg-amber-100 text-amber-600 shadow-inner' : 'bg-zinc-50 border border-zinc-100 text-zinc-400'
            }`}
          >
            <BookOpen size={20} strokeWidth={isSelected ? 2.5 : 1.5} />
          </div>

          <div className="flex flex-col">
            <h3 className="text-[15px] font-bold text-zinc-800 leading-tight">
              {menu.name}
            </h3>
            
            <div className="flex items-center gap-1.5 mt-1">
              {isActive ? (
                <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  ACTIVO
                </div>
              ) : isArchived ? (
                <div className="flex items-center gap-1 text-zinc-500 text-[11px] font-bold">
                  <Archive size={10} />
                  ARCHIVADO
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-600 text-[11px] font-bold">
                  <Clock size={10} />
                  BORRADOR
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-50/50 group-hover:bg-white transition-colors">
          <ChevronRight
            size={18}
            className={`transition-all duration-300 ${
              isSelected ? 'text-amber-500 translate-x-0.5' : 'text-zinc-300'
            }`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-1 relative z-10 pl-14">
        {menu.description && (
          <p className="truncate text-[13px] text-zinc-500">{menu.description}</p>
        )}
        <p className="text-[12px] font-medium text-zinc-400">
          {categoryCount} {categoryCount === 1 ? 'categoría' : 'categorías'}
        </p>
      </div>

      {/* Acciones Inline */}
      <div
        className={`mt-2 flex gap-2 transition-all duration-300 pl-14 ${
          isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onEdit}
          className={`flex-1 rounded-xl py-2 text-[12px] font-bold transition-all active:scale-95 ${
            isSelected 
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Modificar
        </button>

        {!isArchived && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`¿Archivar "${menu.name}"? Dejará de ser visible en el menú público.`)) {
                onArchive()
              }
            }}
            disabled={isArchiving}
            className="flex items-center justify-center w-10 rounded-xl bg-zinc-50 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 disabled:opacity-50"
            aria-label="Archivar menú"
          >
            <Archive size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
