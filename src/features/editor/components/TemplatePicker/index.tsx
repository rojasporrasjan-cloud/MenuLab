import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Sparkles, LayoutTemplate, X, Search } from 'lucide-react'

import { useEditorStore } from '@features/editor/store/useEditorStore'
import { useTenantContext } from '@app/providers/TenantProvider'
import { useAdminMenus } from '@features/dishes'
import { useMenuCategories } from '@features/menus'
import { TEMPLATE_LIST } from '@features/editor/templates/templateRegistry'
import type { TemplateDefinition, TemplateCategory } from '@features/editor/templates/templateRegistry'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Array<{ value: TemplateCategory | 'all'; label: string }> = [
  { value: 'all',     label: 'Todas'   },
  { value: 'luxury',  label: 'Luxury'  },
  { value: 'rustico', label: 'Rústico' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'moderno', label: 'Moderno' },
  { value: 'latam',   label: 'LATAM'   },
]

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  luxury:  'bg-amber-500/20  text-amber-400',
  rustico: 'bg-orange-500/20 text-orange-400',
  minimal: 'bg-zinc-500/20   text-zinc-300',
  moderno: 'bg-blue-500/20   text-blue-400',
  latam:   'bg-green-500/20  text-green-400',
}

// ─── Shared card (used in modal grid) ─────────────────────────────────────────

interface TemplateCardProps {
  readonly def:        TemplateDefinition
  readonly isActive:   boolean
  readonly isApplying: boolean
  readonly onApply:    (def: TemplateDefinition) => void
}

function TemplateCard({ def, isActive, isApplying, onApply }: TemplateCardProps) {
  return (
    <div
      className={[
        'group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200',
        isActive
          ? 'border-brand-500 shadow-[0_0_0_1px_theme(colors.brand.500/40%)]'
          : 'border-zinc-800 hover:border-zinc-600',
      ].join(' ')}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
        <img
          src={def.thumbnailUrl}
          alt={def.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const img = e.currentTarget
            img.style.display = 'none'
            const parent = img.parentElement
            if (parent && !parent.querySelector('[data-placeholder]')) {
              const ph = document.createElement('div')
              ph.setAttribute('data-placeholder', '1')
              ph.style.cssText = [
                'position:absolute;inset:0;',
                'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;',
                `background:${def.suggestedTheme.backgroundColor}`,
              ].join('')
              const label = document.createElement('span')
              label.style.cssText = [
                `color:${def.suggestedTheme.primaryColor};`,
                'font-size:10px;font-weight:700;text-align:center;padding:0 8px;',
              ].join('')
              label.textContent = def.name
              ph.appendChild(label)
              parent.appendChild(ph)
            }
          }}
        />

        {/* Active badge */}
        {isActive && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
            <CheckCircle2 size={10} />
            <span>Activa</span>
          </div>
        )}

        {/* Category pill */}
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[def.category]}`}>
          {def.category}
        </span>
      </div>

      {/* Info + Apply */}
      <div className="flex flex-col gap-2 p-2.5">
        <div>
          <p className="text-[11px] font-bold leading-tight text-zinc-100">{def.name}</p>
          <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-zinc-500">{def.description}</p>
        </div>

        <button
          onClick={() => onApply(def)}
          disabled={isActive || isApplying}
          className={[
            'flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-bold transition-colors',
            isActive
              ? 'bg-brand-500/20 text-brand-400 cursor-default'
              : isApplying
              ? 'bg-zinc-800 text-zinc-500 cursor-wait'
              : 'bg-zinc-800 text-zinc-200 hover:bg-brand-500 hover:text-white',
          ].join(' ')}
        >
          {isActive ? (
            <><CheckCircle2 size={10} /> Aplicada</>
          ) : isApplying ? (
            <><Sparkles size={10} className="animate-spin" /> Aplicando...</>
          ) : (
            <><LayoutTemplate size={10} /> Aplicar</>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Full-screen modal ────────────────────────────────────────────────────────

interface TemplatePickerModalProps {
  readonly currentTemplateId: string | null
  readonly hasDocument:       boolean
  readonly onApply:           (def: TemplateDefinition) => void
  readonly onClose:           () => void
}

function TemplatePickerModal({
  currentTemplateId,
  hasDocument,
  onApply,
  onClose,
}: TemplatePickerModalProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all')
  const [searchQuery, setSearchQuery]       = useState('')
  const [applyingId, setApplyingId]         = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const filtered = TEMPLATE_LIST.filter((t) => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory
    const matchesSearch   =
      searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  function handleApply(def: TemplateDefinition): void {
    if (!hasDocument || applyingId !== null) return
    setApplyingId(def.id)
    onApply(def)
    setTimeout(() => {
      setApplyingId(null)
      onClose()
    }, 700)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'rgba(9,9,11,0.96)', backdropFilter: 'blur(20px) saturate(180%)' }}
    >
      <div className="flex shrink-0 items-center gap-4 border-b border-zinc-800/60 px-6 py-4">
        <div className="flex-1">
          <h2 className="text-sm font-bold text-zinc-100">Elegir plantilla</h2>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            {TEMPLATE_LIST.length} plantillas disponibles
          </p>
        </div>

        <div className="relative flex items-center">
          <Search size={12} className="pointer-events-none absolute left-3 text-zinc-500" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar plantilla..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-56 rounded-lg bg-zinc-800/80 pl-8 pr-3 text-[11px] text-zinc-200 placeholder-zinc-600 outline-none ring-1 ring-zinc-700/50 focus:ring-brand-500/60"
          />
        </div>

        <button
          onClick={onClose}
          title="Cerrar (Esc)"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 border-b border-zinc-800/40 px-6 py-2.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={[
              'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
              activeCategory === cat.value
                ? 'bg-brand-500 text-white'
                : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
            ].join(' ')}
          >
            {cat.label}
          </button>
        ))}
        {searchQuery !== '' && (
          <span className="ml-auto text-[10px] text-zinc-600">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-zinc-700">
            <Search size={28} strokeWidth={1} />
            <p className="text-xs">Sin resultados</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-zinc-600 underline hover:text-zinc-400"
            >
              Limpiar busqueda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((def) => (
              <TemplateCard
                key={def.id}
                def={def}
                isActive={def.id === currentTemplateId}
                isApplying={applyingId === def.id}
                onApply={handleApply}
              />
            ))}
          </div>
        )}
      </div>

      {!hasDocument && (
        <div className="shrink-0 border-t border-zinc-800/50 px-6 py-3">
          <p className="text-center text-[10px] text-zinc-600">
            Carga un documento para activar las plantillas.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Compact panel widget ─────────────────────────────────────────────────────

export function TemplatePicker() {
  const currentTemplateId = useEditorStore((s) => s.state.document?.templateId ?? null)
  const dispatch          = useEditorStore((s) => s.dispatch)
  const hasDocument       = useEditorStore((s) => s.state.document !== null)

  const { tenantId } = useTenantContext()
  const { data: menus } = useAdminMenus(tenantId)
  const resolvedMenuId = menus?.[0]?.id ?? null
  const { data: categories } = useMenuCategories(tenantId, resolvedMenuId)

  const [isModalOpen, setIsModalOpen] = useState(false)

  const currentTemplate = TEMPLATE_LIST.find((t) => t.id === currentTemplateId) ?? null

  function handleApply(def: TemplateDefinition): void {
    const mappedLayers = def.defaultLayers.map(layer => {
      let mappedLayer = { ...layer }
      if (layer.binding.type === 'category-name' || layer.binding.type === 'dish-list') {
        const catIndex = layer.binding.categoryId === '__cat_main__' ? 0 : 
                         layer.binding.categoryId === '__cat_secondary__' ? 1 : -1
                         
        if (catIndex !== -1 && categories && categories.length > 0) {
          // If the requested index doesn't exist, fallback to the last available category
          const realCatId = categories[Math.min(catIndex, categories.length - 1)].id
          mappedLayer = {
            ...layer,
            binding: {
              ...layer.binding,
              categoryId: realCatId
            }
          }
        }
      }
      return mappedLayer
    })

    dispatch({
      type:          'APPLY_TEMPLATE',
      templateId:    def.id,
      canvaTemplate: def.canvaTemplate,
      defaultLayers: mappedLayers,
      theme:         def.suggestedTheme,
    })
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {currentTemplate ? (
          <div className="relative overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-900">
            <div className="relative h-28 w-full overflow-hidden">
              <img
                src={currentTemplate.thumbnailUrl}
                alt={currentTemplate.name}
                loading="lazy"
                className="h-full w-full object-cover object-top"
                onError={(e) => {
                  const img = e.currentTarget
                  img.style.display = 'none'
                }}
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }}
              />
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                <p className="text-[11px] font-bold text-white leading-tight">{currentTemplate.name}</p>
                <p className={`mt-0.5 text-[9px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[currentTemplate.category]}`}>
                  {currentTemplate.category}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-800 py-7 text-zinc-700">
            <LayoutTemplate size={20} strokeWidth={1} />
            <p className="text-[10px]">Sin plantilla activa</p>
          </div>
        )}

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!hasDocument}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700/50 bg-zinc-800/40 py-2.5 text-[11px] font-semibold text-zinc-200 transition-all hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <LayoutTemplate size={12} />
          Cambiar plantilla
        </button>

        <p className="text-center text-[9px] text-zinc-700">
          {TEMPLATE_LIST.length} plantillas disponibles
        </p>
      </div>

      {isModalOpen && (
        <TemplatePickerModal
          currentTemplateId={currentTemplateId}
          hasDocument={hasDocument}
          onApply={handleApply}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}
