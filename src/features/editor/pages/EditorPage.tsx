import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Sparkles,
  Layers,
  LayoutTemplate,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Undo2,
  Redo2,
  Save,
  Globe,
  HelpCircle,
  Smartphone,
  Monitor,
  Type,
  Square,
  Trash2,
  Image as ImageIcon,
  LayoutList,
  Building2,
} from 'lucide-react'

import { useTenantContext }    from '@app/providers/TenantProvider'
import { useAuth }             from '@features/auth'
import { ROUTES }              from '@shared/constants/routes'

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'

import { useEditorStore }                        from '@features/editor/store/useEditorStore'
import {
  selectDocument,
  selectTheme,
  selectStatus,
  selectIsDirty,
  selectCanUndo,
  selectCanRedo,
  selectSelectedId,
}                                                from '@features/editor/store/useEditorStore'
import { useEditorAutosave }                     from '@features/editor/hooks/useEditorAutosave'
import { FirebaseEditorPersistenceService }      from '@infrastructure/editor/FirebaseEditorPersistenceService'

import { useAdminMenus }     from '@features/dishes'
import { useAdminDishes }    from '@features/dishes'
import { useMenuCategories } from '@features/menus'

import { DataLayerRenderer }  from '../components/DataLayerRenderer'
import { ExportPDFButton }    from '../components/ExportPDFButton'
import { TemplatePicker }     from '../components/TemplatePicker'
import { SortableLayerItem }  from '../components/SortableLayerItem'

const DigitalizarModal = lazy(() =>
  import('../components/DigitalizarModal').then((m) => ({ default: m.DigitalizarModal })),
)

import { Button } from '@shared/ui/components/Button'

import type { EditorDocument }                   from '../types/editor.types'
import type { DataLayerContext, ResolvedDish, ResolvedCategory } from '../components/DataLayerRenderer'
import { defaultDataLayer, defaultTextStyle }     from '../types/blocks.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createBlankDocument(tenantId: string): EditorDocument {
  return {
    version:      2,
    tenantId,
    templateId:   'dark-modern',
    canvaTemplate: null,
    theme: {
      primaryColor:     '#3b82f6',
      backgroundColor:  '#ffffff',
      fontFamily:       'Inter',
      textScale:        '1',
      imgRadius:        '8',
    },
    dataLayers:  [],
    updatedAt:   new Date().toISOString(),
    publishedAt: null,
  }
}

function formatPrice(amount: number, currency: string): string {
  if (currency === 'CRC') return `₡${amount.toLocaleString()}`
  if (currency === 'USD') return `$${amount}`
  return `${currency} ${amount}`
}

// Narrowing de valores de <select> a los unions del textStyle
const FONT_WEIGHT_VALUES = [400, 600, 700, 800, 900] as const
type FontWeightValue = (typeof FONT_WEIGHT_VALUES)[number]

function parseFontWeight(raw: string): FontWeightValue {
  const parsed = Number(raw)
  return FONT_WEIGHT_VALUES.find((w) => w === parsed) ?? 700
}

const TEXT_ALIGN_VALUES = ['left', 'center', 'right'] as const
type TextAlignValue = (typeof TEXT_ALIGN_VALUES)[number]

function parseTextAlign(raw: string): TextAlignValue {
  return TEXT_ALIGN_VALUES.find((a) => a === raw) ?? 'center'
}

// ─── Panel types ──────────────────────────────────────────────────────────────

type LeftPanelId = 'templates' | 'layers' | 'config'
type ViewMode    = 'full' | 'mobile'

// ─── Font catalog ─────────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  { value: 'Inter, system-ui',                 label: 'Inter',            category: 'Sans-serif'  },
  { value: '"Helvetica Neue", sans-serif',      label: 'Helvetica Neue',   category: 'Sans-serif'  },
  { value: 'Georgia, serif',                   label: 'Georgia',          category: 'Serif'       },
  { value: '"Palatino Linotype", serif',        label: 'Palatino',         category: 'Serif'       },
  { value: 'Garamond, serif',                  label: 'Garamond',         category: 'Serif'       },
  { value: '"Times New Roman", Times, serif',   label: 'Times New Roman',  category: 'Serif'       },
  { value: 'Verdana, sans-serif',              label: 'Verdana',          category: 'Sans-serif'  },
  { value: '"Trebuchet MS", sans-serif',        label: 'Trebuchet MS',     category: 'Sans-serif'  },
] as const

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const { tenantId, tenant } = useTenantContext()
  const { user }             = useAuth()

  // ── Store ──
  const documentState   = useEditorStore(selectDocument)
  const theme           = useEditorStore(selectTheme)
  const status          = useEditorStore(selectStatus)
  const isDirty         = useEditorStore(selectIsDirty)
  const canUndo         = useEditorStore(selectCanUndo)
  const canRedo         = useEditorStore(selectCanRedo)
  const selectedLayerId = useEditorStore(selectSelectedId)
  const loadDocument    = useEditorStore((s) => s.loadDocument)
  const dispatch        = useEditorStore((s) => s.dispatch)

  useEditorAutosave()

  // ── DnD ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !documentState) return
    const ids      = documentState.dataLayers.map((l) => l.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return
    dispatch({ type: 'REORDER_LAYERS', orderedIds: arrayMove(ids, oldIndex, newIndex) })
  }

  async function handleManualSave(): Promise<void> {
    if (!documentState || status === 'saving') return
    dispatch({ type: 'SAVE_START' })
    const persistence = new FirebaseEditorPersistenceService()
    try {
      await persistence.saveDraft(tenantId, {
        id: crypto.randomUUID(),
        document: documentState,
        createdAt: new Date().toISOString(),
        triggeredBy: 'user',
        userId: user?.uid ?? 'unknown',
        label: null,
      })
      dispatch({ type: 'SAVE_SUCCESS' })
    } catch (err) {
      dispatch({ type: 'SAVE_ERROR', message: err instanceof Error ? err.message : 'Error al guardar' })
    }
  }

  async function handlePublish(): Promise<void> {
    if (!documentState || status === 'saving' || status === 'publishing') return
    const persistence = new FirebaseEditorPersistenceService()

    // Auto-guardar borrador si hay cambios sin guardar antes de publicar
    if (isDirty) {
      dispatch({ type: 'SAVE_START' })
      try {
        await persistence.saveDraft(tenantId, {
          id: crypto.randomUUID(),
          document: documentState,
          createdAt: new Date().toISOString(),
          triggeredBy: 'user',
          userId: user?.uid ?? 'unknown',
          label: null,
        })
        dispatch({ type: 'SAVE_SUCCESS' })
      } catch (err) {
        dispatch({ type: 'SAVE_ERROR', message: err instanceof Error ? err.message : 'Error al guardar' })
        return
      }
    }

    dispatch({ type: 'PUBLISH_START' })
    try {
      const publishedAt = new Date().toISOString()
      await persistence.publish(tenantId, { ...documentState, publishedAt })
      dispatch({ type: 'PUBLISH_SUCCESS', publishedAt })
    } catch (err) {
      dispatch({ type: 'PUBLISH_ERROR', message: err instanceof Error ? err.message : 'Error al publicar' })
    }
  }

  // ── Element palette ──
  function handleAddText(): void {
    if (!documentState) return
    const id    = crypto.randomUUID()
    const layer = defaultDataLayer(id, { type: 'static', content: 'Texto' })
    dispatch({
      type: 'ADD_LAYER',
      layer: {
        ...layer,
        label: 'Texto',
        position: { ...layer.position, x: 20, y: 40, width: 60, height: 12, zIndex: documentState.dataLayers.length + 1 },
        textStyle: { ...defaultTextStyle(), fontSize: 24, align: 'center' },
      },
    })
    dispatch({ type: 'SELECT_LAYER', layerId: id })
  }

  function handleAddButton(): void {
    if (!documentState) return
    const id    = crypto.randomUUID()
    const layer = defaultDataLayer(id, { type: 'static', content: 'Botón' })
    dispatch({
      type: 'ADD_LAYER',
      layer: {
        ...layer,
        label: 'Botón',
        borderRadius: 12,
        position: { ...layer.position, x: 25, y: 55, width: 50, height: 10, zIndex: documentState.dataLayers.length + 1 },
        textStyle: {
          ...defaultTextStyle(),
          fontSize: 16,
          align: 'center',
          fontWeight: 700,
          backgroundColor: '#3b82f6',
          paddingX: 16,
          paddingY: 10,
        },
      },
    })
    dispatch({ type: 'SELECT_LAYER', layerId: id })
  }

  function handleAddImageBox(): void {
    if (!documentState) return
    const id    = crypto.randomUUID()
    const layer = defaultDataLayer(id, { type: 'tenant-field', field: 'logoUrl' })
    dispatch({
      type: 'ADD_LAYER',
      layer: {
        ...layer,
        label: 'Imagen',
        position: { ...layer.position, x: 30, y: 30, width: 40, height: 25, zIndex: documentState.dataLayers.length + 1 },
        textStyle: null,
      },
    })
    dispatch({ type: 'SELECT_LAYER', layerId: id })
  }

  function handleDeleteLayer(layerId: string): void {
    dispatch({ type: 'REMOVE_LAYER', layerId })
    dispatch({ type: 'SELECT_LAYER', layerId: null })
  }

  /** Agrega una sección de platos ligada a la primera categoría disponible. */
  function handleAddMenuSection(): void {
    if (!documentState) return
    const firstCategory = categories?.[0]
    if (!firstCategory) return
    const id    = crypto.randomUUID()
    const layer = defaultDataLayer(id, {
      type:       'dish-list',
      categoryId: firstCategory.id,
      layout:     'list',
      maxItems:   6,
    })
    dispatch({
      type: 'ADD_LAYER',
      layer: {
        ...layer,
        label:    `Sección: ${firstCategory.name}`,
        position: { ...layer.position, x: 5, y: 30, width: 90, height: 40, zIndex: documentState.dataLayers.length + 1 },
        textStyle: { ...defaultTextStyle(), fontSize: 16, align: 'left' },
      },
    })
    dispatch({ type: 'SELECT_LAYER', layerId: id })
  }

  /** Agrega el nombre del restaurante como capa de texto ligada al tenant. */
  function handleAddRestaurantName(): void {
    if (!documentState) return
    const id    = crypto.randomUUID()
    const layer = defaultDataLayer(id, { type: 'tenant-field', field: 'name' })
    dispatch({
      type: 'ADD_LAYER',
      layer: {
        ...layer,
        label:    'Nombre del local',
        position: { ...layer.position, x: 10, y: 5, width: 80, height: 12, zIndex: documentState.dataLayers.length + 1 },
        textStyle: { ...defaultTextStyle(), fontSize: 32, fontWeight: 700, align: 'center' },
      },
    })
    dispatch({ type: 'SELECT_LAYER', layerId: id })
  }

  // ── UI state ──
  const [searchParams]                               = useSearchParams()
  const [loadingDoc,         setLoadingDoc]         = useState(true)
  const [loadingError,       setLoadingError]       = useState<string | null>(null)
  const [leftPanel,          setLeftPanel]          = useState<LeftPanelId>('templates')
  const [viewMode,           setViewMode]           = useState<ViewMode>('full')
  const [showDigitalizar,    setShowDigitalizar]    = useState(
    () => searchParams.get('openDigitalize') === '1',
  )

  // ── Document loading ──
  useEffect(() => {
    if (!tenantId) return
    let active = true

    async function fetchDocument() {
      try {
        setLoadingDoc(true)
        setLoadingError(null)
        const persistence = new FirebaseEditorPersistenceService()
        let docPayload    = await persistence.loadLatestDraft(tenantId)
        if (!docPayload) docPayload = await persistence.loadPublished(tenantId)
        if (!docPayload) docPayload = createBlankDocument(tenantId)
        if (active) loadDocument(docPayload)
      } catch (err) {
        if (active) setLoadingError(err instanceof Error ? err.message : 'Error al recuperar el menú')
      } finally {
        if (active) setLoadingDoc(false)
      }
    }

    void fetchDocument()
    return () => { active = false }
  }, [tenantId, loadDocument])

  // ── Data queries ──
  const { data: menus }                                        = useAdminMenus(tenantId)
  const resolvedMenuId                                         = menus?.[0]?.id ?? null
  const { data: dishes,     isLoading: dishesLoading }        = useAdminDishes(tenantId, resolvedMenuId)
  const { data: categories, isLoading: categoriesLoading }    = useMenuCategories(tenantId, resolvedMenuId)

  // ── Context builder ──
  const dataLayerContext = useMemo<DataLayerContext>(() => {
    const recordDishes:     Record<string, ResolvedDish>    = {}
    const recordCategories: Record<string, ResolvedCategory> = {}

    dishes?.forEach((d) => {
      recordDishes[d.id] = {
        name:        d.name,
        price:       d.price ? formatPrice(d.price.amount, d.price.currency) : '₡0',
        description: d.description ?? null,
        imageUrl:    d.assets?.imageUrl ?? null,
        tags:        d.tags ?? [],
        categoryId:  d.categoryId,
      }
    })
    categories?.forEach((c) => {
      recordCategories[c.id] = { name: c.name }
    })

    return {
      dishes:     recordDishes,
      categories: recordCategories,
      tenant:     tenant ? {
        name:     tenant.name,
        logoUrl:  tenant.branding.logoUrl ?? null,
        tagline:  tenant.branding.tagline ?? null,
        phone:    tenant.branding.infoFooter.phone ?? null,
        address:  tenant.branding.infoFooter.address ?? null,
      } : null,
    }
  }, [dishes, categories, tenant])

  const isMetadataLoading = dishesLoading || categoriesLoading
  const isWorkspaceReady  = !loadingDoc && documentState

  // ── Keyboard shortcuts (latest-ref pattern to avoid stale closures) ─────────
  const saveHandlerRef = useRef<() => Promise<void>>(async () => undefined)
  useEffect(() => { saveHandlerRef.current = handleManualSave })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      const mod = e.ctrlKey || e.metaKey
      if (e.key === 'Escape') {
        dispatch({ type: 'SELECT_LAYER', layerId: null })
        return
      }
      if (!mod) return
      if (e.key === 'z' && !e.shiftKey)                       { e.preventDefault(); dispatch({ type: 'UNDO' }) }
      else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)){ e.preventDefault(); dispatch({ type: 'REDO' }) }
      else if (e.key === 's')                                   { e.preventDefault(); void saveHandlerRef.current() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [dispatch])

  const selectedLayer = selectedLayerId
    ? (documentState?.dataLayers.find((l) => l.id === selectedLayerId) ?? null)
    : null

  // ─── Splash: Loading ───────────────────────────────────────────────────────
  if (loadingDoc) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-5 bg-zinc-950">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-brand-500/20" />
          <Loader2 size={28} className="animate-spin text-brand-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-zinc-200">Inicializando espacio de trabajo…</p>
          <p className="mt-1 text-xs text-zinc-600">Sincronizando desde Firestore</p>
        </div>
      </div>
    )
  }

  // ─── Splash: Error ─────────────────────────────────────────────────────────
  if (loadingError) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-5 bg-zinc-950 px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertCircle size={26} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-100">Error de conectividad</h2>
          <p className="mt-1.5 text-xs text-zinc-500 max-w-sm leading-relaxed">{loadingError}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Reintentar conexión</Button>
      </div>
    )
  }

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950 text-zinc-100 overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          TOP BAR
      ═══════════════════════════════════════════════════════════════════════ */}
      <header className="relative z-40 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] bg-zinc-950/90 px-4 backdrop-blur-xl">

        {/* Left — Back + Restaurant name */}
        <div className="flex items-center gap-3 min-w-0 w-[260px]">
          <Link
            to={ROUTES.admin.dashboard}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200"
            title="Volver al panel"
          >
            <ArrowLeft size={14} />
          </Link>
          <div className="h-4 w-px shrink-0 bg-zinc-800" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate text-[13px] font-semibold text-zinc-100">
              {tenant?.name ?? 'Editor'}
            </span>
            <span className="shrink-0 rounded-[4px] border border-amber-500/25 bg-amber-500/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.08em] text-amber-400">
              PRO
            </span>
          </div>
        </div>

        {/* Center — View switcher + save status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
            <button
              onClick={() => setViewMode('full')}
              className={[
                'flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-semibold transition-all',
                viewMode === 'full'
                  ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300',
              ].join(' ')}
            >
              <Monitor size={11} />
              <span>Completo</span>
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={[
                'flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-semibold transition-all',
                viewMode === 'mobile'
                  ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300',
              ].join(' ')}
            >
              <Smartphone size={11} />
              <span>Móvil</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            {status === 'saving' ? (
              <>
                <Loader2 size={10} className="animate-spin text-zinc-500" />
                <span className="text-zinc-600">Guardando…</span>
              </>
            ) : isDirty ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                <span className="text-amber-500/80">Sin guardar</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-zinc-600">Guardado</span>
              </>
            )}
          </div>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-1.5 w-[260px] justify-end">
          {/* Undo / Redo */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
            <button
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={!canUndo}
              title="Deshacer (Ctrl+Z)"
              className={[
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                canUndo ? 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100' : 'cursor-not-allowed text-zinc-700',
              ].join(' ')}
            >
              <Undo2 size={13} />
            </button>
            <button
              onClick={() => dispatch({ type: 'REDO' })}
              disabled={!canRedo}
              title="Rehacer (Ctrl+Y)"
              className={[
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                canRedo ? 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100' : 'cursor-not-allowed text-zinc-700',
              ].join(' ')}
            >
              <Redo2 size={13} />
            </button>
          </div>

          {/* AI Digitizer */}
          <button
            onClick={() => setShowDigitalizar(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-violet-600/90 px-3 text-[12px] font-semibold text-white transition-colors hover:bg-violet-500"
          >
            <Sparkles size={13} />
            <span>IA</span>
          </button>

          <ExportPDFButton compact />

          {/* Guardar */}
          <button
            onClick={() => void handleManualSave()}
            disabled={status === 'saving' || !isDirty}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-white px-3.5 text-[12px] font-bold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={12} />
            <span>Guardar</span>
          </button>

          {/* Publicar */}
          <button
            onClick={() => void handlePublish()}
            disabled={status === 'saving' || status === 'publishing'}
            title="Publicar menú — guarda y publica en un solo clic"
            className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-[12px] font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === 'publishing'
              ? <Loader2 size={12} className="animate-spin" />
              : <Globe size={12} />
            }
            <span>Publicar</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          BODY — three columns
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ───────────────────────────────────────────────────────────────────
            LEFT RAIL (icon nav)
        ─────────────────────────────────────────────────────────────────── */}
        <nav className="z-20 flex w-[52px] shrink-0 flex-col items-center gap-1 border-r border-zinc-800/50 bg-zinc-950/80 py-3">
          {(
            [
              { id: 'templates', icon: LayoutTemplate, label: 'Plant.' },
              { id: 'layers',    icon: Layers,          label: 'Capas'  },
              { id: 'config',    icon: SlidersHorizontal, label: 'Conf.'  },
            ] as { id: LeftPanelId; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string }[]
          ).map(({ id, icon: Icon, label }) => {
            const isActive = leftPanel === id
            const layerCount = id === 'layers' ? (documentState?.dataLayers.length ?? 0) : 0
            return (
              <button
                key={id}
                onClick={() => setLeftPanel(id)}
                title={label}
                className={[
                  'relative flex w-10 flex-col items-center gap-0.5 rounded-xl py-2 transition-all',
                  isActive
                    ? 'bg-zinc-800/80 text-zinc-100'
                    : 'text-zinc-600 hover:bg-zinc-900/60 hover:text-zinc-300',
                ].join(' ')}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[7.5px] font-semibold uppercase tracking-wider">{label}</span>
                {layerCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-500 text-[7px] font-bold text-white">
                    {layerCount > 9 ? '9+' : layerCount}
                  </span>
                )}
              </button>
            )
          })}

          <div className="mt-auto">
            <button
              title="Ayuda"
              className="flex w-10 flex-col items-center gap-0.5 rounded-xl py-2 text-zinc-700 transition-all hover:bg-zinc-900/60 hover:text-zinc-400"
            >
              <HelpCircle size={15} strokeWidth={1.5} />
              <span className="text-[7.5px] font-semibold uppercase tracking-wider">Ayuda</span>
            </button>
          </div>
        </nav>

        {/* ───────────────────────────────────────────────────────────────────
            LEFT PANEL (content)
        ─────────────────────────────────────────────────────────────────── */}
        <aside className="z-10 flex w-64 shrink-0 flex-col overflow-hidden border-r border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl">

          {/* Panel header */}
          <div className="shrink-0 border-b border-zinc-800/50 px-4 pb-3 pt-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              {leftPanel === 'templates' ? 'Plantillas'
               : leftPanel === 'layers'  ? 'Capas del lienzo'
               : 'Configuración'}
            </h2>
            {leftPanel === 'layers' && documentState && (
              <p className="mt-0.5 text-[10px] text-zinc-700">
                {documentState.dataLayers.length} capa{documentState.dataLayers.length !== 1 ? 's' : ''} · arrastra para reordenar
              </p>
            )}
          </div>

          {/* Panel body */}
          <div className="min-h-0 flex-1 overflow-y-auto p-3">

            {/* Plantillas */}
            {leftPanel === 'templates' && <TemplatePicker />}

            {/* Capas */}
            {leftPanel === 'layers' && (
              <>
                {/* Element palette */}
                <div className="mb-3 flex flex-col gap-2">
                  <p className="px-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-600">Agregar elemento</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <ElementPaletteButton icon={<Type size={14} />}       label="Texto"   onClick={handleAddText} />
                    <ElementPaletteButton icon={<Square size={14} />}     label="Botón"   onClick={handleAddButton} />
                    <ElementPaletteButton icon={<ImageIcon size={14} />}  label="Imagen"  onClick={handleAddImageBox} />
                    <ElementPaletteButton
                      icon={<LayoutList size={14} />}
                      label="Sección"
                      onClick={handleAddMenuSection}
                      disabled={!categories?.length}
                      title={!categories?.length ? 'Agrega categorías primero en Menús' : 'Sección de platos de una categoría'}
                    />
                    <ElementPaletteButton
                      icon={<Building2 size={14} />}
                      label="Local"
                      onClick={handleAddRestaurantName}
                      title="Nombre del restaurante"
                    />
                  </div>
                </div>

                {documentState?.dataLayers && documentState.dataLayers.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={documentState.dataLayers.map((l) => l.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-1">
                        {documentState.dataLayers.map((layer) => (
                          <SortableLayerItem
                            key={layer.id}
                            layer={layer}
                            isSelected={layer.id === selectedLayerId}
                            onSelect={(id) => dispatch({ type: 'SELECT_LAYER', layerId: id })}
                            onToggle={(id) => dispatch({ type: 'TOGGLE_LAYER', layerId: id })}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="mt-1 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-800/80 px-4 py-10 text-center">
                    <Layers size={28} strokeWidth={1} className="text-zinc-700" />
                    <div>
                      <p className="text-[11px] font-semibold text-zinc-500">Sin capas activas</p>
                      <p className="mt-1 max-w-[160px] text-[10px] text-zinc-600">
                        Usa los botones de arriba para agregar elementos.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Config */}
            {leftPanel === 'config' && (
              <div className="flex flex-col gap-2.5">
                <InspectorGroup label="Documento">
                  <InspectorRow label="Plantilla">
                    <span className="truncate text-[11px] text-zinc-300 max-w-[100px]">
                      {documentState?.templateId ?? '—'}
                    </span>
                  </InspectorRow>
                  <InspectorRow label="Versión">
                    <span className="font-mono text-[11px] text-zinc-500">v{documentState?.version ?? 2}</span>
                  </InspectorRow>
                </InspectorGroup>
                <InspectorGroup label="Exportar">
                  <div className="pt-1">
                    <ExportPDFButton />
                  </div>
                </InspectorGroup>
              </div>
            )}
          </div>

          {/* Panel footer */}
          <div className="shrink-0 border-t border-zinc-800/50 px-4 py-2">
            <p className="text-[9px] text-zinc-700">Editor v2.0 · Camino A — Canva-First</p>
          </div>
        </aside>

        {/* ───────────────────────────────────────────────────────────────────
            CANVAS STAGE
        ─────────────────────────────────────────────────────────────────── */}
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col items-center overflow-auto bg-zinc-950">

          {/* Dot grid background */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:22px_22px] opacity-60" />

          {/* Radial vignette */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,transparent_40%,rgba(0,0,0,0.6)_100%)]" />

          {/* Canvas metadata pill */}
          <div className="absolute top-4 z-10 flex items-center gap-2.5 rounded-full border border-zinc-800/60 bg-zinc-900/70 px-3.5 py-1.5 backdrop-blur-md">
            <span className="font-mono text-[10px] text-zinc-500">Menú · Mobile-first</span>
            <span className="h-3 w-px bg-zinc-700" />
            <span className="font-mono text-[10px] text-zinc-600">
              {viewMode === 'mobile' ? 'Móvil · 375 px' : 'Laptop · 740 px'}
            </span>
          </div>

          {/* ── Canvas device frame ────────────────────────────────────────── */}
          <div className="relative mx-auto mb-10 mt-16 flex flex-col items-center">
            {isWorkspaceReady ? (
              <>
                {viewMode === 'mobile' ? (

                  /* ── Phone frame ───────────────────────────────────────── */
                  <div className="relative" style={{ width: '375px' }}>

                    {/* Phone body */}
                    <div
                      className="relative rounded-[52px]"
                      style={{
                        background: 'linear-gradient(145deg, #2e2e32 0%, #1a1a1d 100%)',
                        padding: '14px',
                        boxShadow: '0 0 0 1.5px rgba(255,255,255,0.1), 0 0 0 5px rgba(0,0,0,0.5), 0 50px 130px rgba(0,0,0,1)',
                      }}
                    >
                      {/* Dynamic Island */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-zinc-950"
                        style={{ top: '25px', width: '120px', height: '30px', zIndex: 20 }}
                      />

                      {/* Left buttons — mute + volume */}
                      <div className="absolute -left-[4px] top-[110px] h-8 w-1 rounded-l-full bg-zinc-700" />
                      <div className="absolute -left-[4px] top-[158px] h-16 w-1 rounded-l-full bg-zinc-700" />
                      <div className="absolute -left-[4px] top-[238px] h-16 w-1 rounded-l-full bg-zinc-700" />

                      {/* Right button — power */}
                      <div className="absolute -right-[4px] top-[164px] h-20 w-1 rounded-r-full bg-zinc-700" />

                      {/* Screen */}
                      <div
                        className="relative rounded-[40px] bg-white"
                        style={{ height: '680px', overflowY: 'auto', overflowX: 'hidden' }}
                      >
                        {/* Metadata refresh overlay */}
                        {isMetadataLoading && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px] bg-zinc-950/50">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 size={20} className="animate-spin text-brand-500" />
                              <span className="text-[11px] text-zinc-500">Actualizando catálogo…</span>
                            </div>
                          </div>
                        )}

                        {/* Canvas content */}
                        <div className="relative">
                          {documentState.dataLayers.length === 0 && !documentState.canvaTemplate && (
                            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                              <div className="mx-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-700/60 bg-zinc-950/70 px-8 py-10 text-center backdrop-blur-sm">
                                <Layers size={28} strokeWidth={1} className="text-zinc-600" />
                                <div>
                                  <p className="text-[12px] font-semibold text-zinc-400">Lienzo vacío</p>
                                  <p className="mt-1.5 max-w-[190px] text-[10px] leading-relaxed text-zinc-600">
                                    Escoge una plantilla en el panel izquierdo, o agrega elementos desde la pestaña{' '}
                                    <span className="font-semibold text-zinc-500">Capas</span>.
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1 text-[9px] text-zinc-700">
                                  <span>💡 Ctrl+Z — Deshacer</span>
                                  <span>💡 Ctrl+S — Guardar</span>
                                </div>
                              </div>
                            </div>
                          )}
                          <DataLayerRenderer
                            canvaTemplate={documentState.canvaTemplate}
                            layers={documentState.dataLayers}
                            context={dataLayerContext}
                            selectedLayerId={selectedLayerId}
                            onSelectLayer={(id) => dispatch({ type: 'SELECT_LAYER', layerId: id })}
                            interactive={true}
                            onMoveLayer={(id, x, y) =>
                              dispatch({ type: 'UPDATE_LAYER_POSITION', layerId: id, patch: { x, y } })
                            }
                            onResizeLayer={(id, patch) =>
                              dispatch({ type: 'UPDATE_LAYER_POSITION', layerId: id, patch })
                            }
                          />
                        </div>
                      </div>

                      {/* Home indicator */}
                      <div className="flex justify-center pb-1 pt-2.5">
                        <div className="h-[5px] w-[130px] rounded-full bg-zinc-600" />
                      </div>
                    </div>
                  </div>

                ) : (

                  /* ── Laptop frame ──────────────────────────────────────── */
                  <div className="relative w-full max-w-[740px]">

                    {/* Screen lid */}
                    <div
                      className="rounded-t-2xl"
                      style={{
                        background: 'linear-gradient(180deg, #303034 0%, #262628 100%)',
                        padding: '18px 6px 0',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 -30px 80px rgba(0,0,0,0.8)',
                      }}
                    >
                      {/* Camera dot */}
                      <div className="mb-2 flex justify-center">
                        <div className="h-2 w-2 rounded-full bg-zinc-600 ring-1 ring-zinc-500/40" />
                      </div>

                      {/* Browser chrome hint */}
                      <div className="mb-0 flex items-center gap-1.5 rounded-t px-3 py-1.5"
                           style={{ background: 'rgba(0,0,0,0.25)' }}>
                        <div className="h-2 w-2 rounded-full bg-zinc-700" />
                        <div className="h-2 w-2 rounded-full bg-zinc-700" />
                        <div className="h-2 w-2 rounded-full bg-zinc-700" />
                        <div className="mx-2 flex-1 rounded bg-zinc-800 px-2 py-0.5 text-[9px] text-zinc-600">
                          {typeof window !== 'undefined' ? window.location.origin : 'menu.sodalarustica.com'}/preview
                        </div>
                      </div>

                      {/* Screen content */}
                      <div
                        className="relative bg-white"
                        style={{
                          height: '520px',
                          overflowY: 'auto',
                          overflowX: 'hidden',
                        }}
                      >
                        {/* Metadata refresh overlay */}
                        {isMetadataLoading && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px] bg-zinc-950/50">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 size={20} className="animate-spin text-brand-500" />
                              <span className="text-[11px] text-zinc-500">Actualizando catálogo…</span>
                            </div>
                          </div>
                        )}

                        {/* Canvas content */}
                        <div className="relative">
                          {documentState.dataLayers.length === 0 && !documentState.canvaTemplate && (
                            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                              <div className="mx-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-700/60 bg-zinc-950/70 px-8 py-10 text-center backdrop-blur-sm">
                                <Layers size={28} strokeWidth={1} className="text-zinc-600" />
                                <div>
                                  <p className="text-[12px] font-semibold text-zinc-400">Lienzo vacío</p>
                                  <p className="mt-1.5 max-w-[190px] text-[10px] leading-relaxed text-zinc-600">
                                    Escoge una plantilla en el panel izquierdo, o agrega elementos desde la pestaña{' '}
                                    <span className="font-semibold text-zinc-500">Capas</span>.
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1 text-[9px] text-zinc-700">
                                  <span>💡 Ctrl+Z — Deshacer</span>
                                  <span>💡 Ctrl+S — Guardar</span>
                                </div>
                              </div>
                            </div>
                          )}
                          <DataLayerRenderer
                            canvaTemplate={documentState.canvaTemplate}
                            layers={documentState.dataLayers}
                            context={dataLayerContext}
                            selectedLayerId={selectedLayerId}
                            onSelectLayer={(id) => dispatch({ type: 'SELECT_LAYER', layerId: id })}
                            interactive={true}
                            onMoveLayer={(id, x, y) =>
                              dispatch({ type: 'UPDATE_LAYER_POSITION', layerId: id, patch: { x, y } })
                            }
                            onResizeLayer={(id, patch) =>
                              dispatch({ type: 'UPDATE_LAYER_POSITION', layerId: id, patch })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Keyboard chin */}
                    <div
                      className="rounded-b-2xl"
                      style={{
                        background: 'linear-gradient(180deg, #3a3a3e 0%, #2c2c30 100%)',
                        height: '22px',
                        boxShadow: '0 8px 28px rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        paddingBottom: '5px',
                      }}
                    >
                      {/* Trackpad hint */}
                      <div className="h-1 w-20 rounded-full bg-zinc-600/40" />
                    </div>
                  </div>

                )}

                {/* Canvas hint */}
                <p className="mt-5 text-center text-[10px] text-zinc-700">
                  Clic para seleccionar · Arrastra para mover · Esquinas para redimensionar
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-24 text-zinc-700">
                <AlertCircle size={28} strokeWidth={1} />
                <p className="text-xs">Workspace no disponible</p>
              </div>
            )}
          </div>
        </main>

        {/* ───────────────────────────────────────────────────────────────────
            RIGHT PROPERTIES PANEL
        ─────────────────────────────────────────────────────────────────── */}
        <aside className="z-10 flex w-[260px] shrink-0 flex-col overflow-hidden border-l border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl">

          {/* Header */}
          <div className="shrink-0 border-b border-zinc-800/50 px-4 pb-3 pt-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Propiedades de estilo
            </h2>
            <p className="mt-0.5 truncate text-[10px] text-zinc-700">
              {selectedLayer ? `Capa: ${selectedLayer.label ?? selectedLayer.id.slice(0, 10)}…` : 'Documento activo'}
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3">

            {/* ── Lienzo (live) ── */}
            <InspectorGroup label="Lienzo">
              <InspectorRow label="Color de fondo">
                <ColorTokenInput
                  value={theme?.backgroundColor ?? '#ffffff'}
                  onChange={(hex) => dispatch({ type: 'SET_THEME', patch: { backgroundColor: hex } })}
                />
              </InspectorRow>
              <InspectorRow label="Radio de imagen">
                <SliderInput
                  value={parseInt(theme?.imgRadius ?? '8', 10)}
                  min={0}
                  max={24}
                  step={2}
                  format={(v) => `${v}px`}
                  onChange={(v) => dispatch({ type: 'SET_THEME', patch: { imgRadius: String(v) } })}
                />
              </InspectorRow>
            </InspectorGroup>

            {/* ── Tipografía (live) ── */}
            <InspectorGroup label="Tipografía">
              <InspectorRow label="Fuente">
                <select
                  value={theme?.fontFamily ?? 'Inter, system-ui'}
                  onChange={(e) => dispatch({ type: 'SET_THEME', patch: { fontFamily: e.target.value } })}
                  className="w-[130px] appearance-none truncate rounded-lg border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-[11px] text-zinc-200 focus:border-zinc-500 focus:outline-none"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </InspectorRow>
              <InspectorRow label="Escala de texto">
                <SliderInput
                  value={parseFloat(theme?.textScale ?? '1')}
                  min={0.8}
                  max={1.3}
                  step={0.05}
                  format={(v) => `${v.toFixed(2)}×`}
                  onChange={(v) => dispatch({ type: 'SET_THEME', patch: { textScale: v.toFixed(2) } })}
                />
              </InspectorRow>
            </InspectorGroup>

            {/* ── Identidad (live) ── */}
            <InspectorGroup label="Identidad">
              <InspectorRow label="Color primario">
                <ColorTokenInput
                  value={theme?.primaryColor ?? '#3b82f6'}
                  onChange={(hex) => dispatch({ type: 'SET_THEME', patch: { primaryColor: hex } })}
                />
              </InspectorRow>
            </InspectorGroup>

            {/* ── Capa activa (live, condicional) ── */}
            {selectedLayer && (
              <>
                {/* Content editor for static layers */}
                {selectedLayer.binding.type === 'static' && (
                  <InspectorGroup label="Contenido">
                    <textarea
                      value={selectedLayer.binding.content}
                      onChange={(e) => dispatch({
                        type: 'UPDATE_LAYER',
                        layerId: selectedLayer.id,
                        patch: { binding: { type: 'static', content: e.target.value } },
                      })}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900/80 px-2.5 py-2 text-[11px] text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                      placeholder="Escribe el texto…"
                    />
                  </InspectorGroup>
                )}

                {/* Text style */}
                {selectedLayer.textStyle && (
                  <InspectorGroup label="Estilo de texto">
                    <InspectorRow label="Color">
                      <ColorTokenInput
                        value={selectedLayer.textStyle.color}
                        onChange={(hex) => dispatch({ type: 'UPDATE_LAYER_TEXT_STYLE', layerId: selectedLayer.id, patch: { color: hex } })}
                      />
                    </InspectorRow>
                    <InspectorRow label="Fondo">
                      <div className="flex items-center gap-1.5">
                        <ColorTokenInput
                          value={selectedLayer.textStyle.backgroundColor ?? '#000000'}
                          onChange={(hex) => dispatch({ type: 'UPDATE_LAYER_TEXT_STYLE', layerId: selectedLayer.id, patch: { backgroundColor: hex } })}
                        />
                        {selectedLayer.textStyle.backgroundColor && (
                          <button
                            onClick={() => dispatch({ type: 'UPDATE_LAYER_TEXT_STYLE', layerId: selectedLayer.id, patch: { backgroundColor: null } })}
                            className="text-[9px] text-zinc-600 hover:text-zinc-400"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </InspectorRow>
                    <InspectorRow label="Tamaño">
                      <SliderInput
                        value={selectedLayer.textStyle.fontSize ?? 16}
                        min={8}
                        max={120}
                        step={1}
                        format={(v) => `${v}px`}
                        onChange={(v) => dispatch({ type: 'UPDATE_LAYER_TEXT_STYLE', layerId: selectedLayer.id, patch: { fontSize: v } })}
                      />
                    </InspectorRow>
                    <InspectorRow label="Peso">
                      <select
                        value={selectedLayer.textStyle.fontWeight}
                        onChange={(e) => dispatch({ type: 'UPDATE_LAYER_TEXT_STYLE', layerId: selectedLayer.id, patch: { fontWeight: parseFontWeight(e.target.value) } })}
                        className="w-[90px] appearance-none rounded-lg border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-[11px] text-zinc-200 focus:border-zinc-500 focus:outline-none"
                      >
                        <option value={400}>Normal</option>
                        <option value={600}>Semibold</option>
                        <option value={700}>Bold</option>
                        <option value={800}>Extrabold</option>
                        <option value={900}>Black</option>
                      </select>
                    </InspectorRow>
                    <InspectorRow label="Alineación">
                      <select
                        value={selectedLayer.textStyle.align}
                        onChange={(e) => dispatch({ type: 'UPDATE_LAYER_TEXT_STYLE', layerId: selectedLayer.id, patch: { align: parseTextAlign(e.target.value) } })}
                        className="w-[90px] appearance-none rounded-lg border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-[11px] text-zinc-200 focus:border-zinc-500 focus:outline-none"
                      >
                        <option value="left">Izquierda</option>
                        <option value="center">Centro</option>
                        <option value="right">Derecha</option>
                      </select>
                    </InspectorRow>
                    <InspectorRow label="Relleno X">
                      <SliderInput
                        value={selectedLayer.textStyle.paddingX}
                        min={0}
                        max={40}
                        step={2}
                        format={(v) => `${v}px`}
                        onChange={(v) => dispatch({ type: 'UPDATE_LAYER_TEXT_STYLE', layerId: selectedLayer.id, patch: { paddingX: v } })}
                      />
                    </InspectorRow>
                    <InspectorRow label="Relleno Y">
                      <SliderInput
                        value={selectedLayer.textStyle.paddingY}
                        min={0}
                        max={40}
                        step={2}
                        format={(v) => `${v}px`}
                        onChange={(v) => dispatch({ type: 'UPDATE_LAYER_TEXT_STYLE', layerId: selectedLayer.id, patch: { paddingY: v } })}
                      />
                    </InspectorRow>
                  </InspectorGroup>
                )}

                <InspectorGroup label="Posicion y tamano">
                  <InspectorRow label="X">
                    <SliderInput
                      value={selectedLayer.position.x}
                      min={0}
                      max={100}
                      step={0.5}
                      format={(v) => v.toFixed(1) + "%"}
                      onChange={(v) => dispatch({ type: "UPDATE_LAYER_POSITION", layerId: selectedLayer.id, patch: { x: v } })}
                    />
                  </InspectorRow>
                  <InspectorRow label="Y">
                    <SliderInput
                      value={selectedLayer.position.y}
                      min={0}
                      max={100}
                      step={0.5}
                      format={(v) => v.toFixed(1) + "%"}
                      onChange={(v) => dispatch({ type: "UPDATE_LAYER_POSITION", layerId: selectedLayer.id, patch: { y: v } })}
                    />
                  </InspectorRow>
                  <InspectorRow label="Ancho">
                    <SliderInput
                      value={selectedLayer.position.width}
                      min={1}
                      max={100}
                      step={0.5}
                      format={(v) => v.toFixed(1) + "%"}
                      onChange={(v) => dispatch({ type: "UPDATE_LAYER_POSITION", layerId: selectedLayer.id, patch: { width: v } })}
                    />
                  </InspectorRow>
                  <InspectorRow label="Alto">
                    <SliderInput
                      value={selectedLayer.position.height}
                      min={1}
                      max={100}
                      step={0.5}
                      format={(v) => v.toFixed(1) + "%"}
                      onChange={(v) => dispatch({ type: "UPDATE_LAYER_POSITION", layerId: selectedLayer.id, patch: { height: v } })}
                    />
                  </InspectorRow>
                  <InspectorRow label="Opacidad">
                    <SliderInput
                      value={selectedLayer.opacity * 100}
                      min={0}
                      max={100}
                      step={5}
                      format={(v) => v + "%"}
                      onChange={(v) => dispatch({ type: "UPDATE_LAYER", layerId: selectedLayer.id, patch: { opacity: v / 100 } })}
                    />
                  </InspectorRow>
                  <InspectorRow label="Radio">
                    <SliderInput
                      value={selectedLayer.borderRadius}
                      min={0}
                      max={60}
                      step={2}
                      format={(v) => v + "px"}
                      onChange={(v) => dispatch({ type: "UPDATE_LAYER", layerId: selectedLayer.id, patch: { borderRadius: v } })}
                    />
                  </InspectorRow>
                </InspectorGroup>

                {/* Eliminar capa */}
                <button
                  type="button"
                  onClick={() => handleDeleteLayer(selectedLayer.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-900/40 hover:text-red-300"
                >
                  <Trash2 size={12} />
                  Eliminar capa
                </button>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* AI Digitizer modal (lazy chunk — solo se descarga al abrirlo) */}
      {showDigitalizar && (
        <Suspense fallback={null}>
          <DigitalizarModal
            tenantId={tenantId}
            menuId={resolvedMenuId}
            onClose={() => setShowDigitalizar(false)}
          />
        </Suspense>
      )}
    </div>
  )
}

// ─── UI primitives del editor ─────────────────────────────────────────────────
// Componentes locales del inspector y la paleta. Viven aquí porque son parte
// del lenguaje visual interno del editor (zinc-dark), no UI compartida.

interface ElementPaletteButtonProps {
  readonly icon: ReactNode
  readonly label: string
  readonly onClick: () => void
  readonly disabled?: boolean
  readonly title?: string
}

function ElementPaletteButton({ icon, label, onClick, disabled, title }: ElementPaletteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      className="flex flex-col items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-1.5 py-2 text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      <span className="text-[9px] font-semibold">{label}</span>
    </button>
  )
}

interface InspectorGroupProps {
  readonly label: string
  readonly children: ReactNode
}

function InspectorGroup({ label, children }: InspectorGroupProps) {
  return (
    <section className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 px-3 py-2.5">
      <h3 className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
        {label}
      </h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  )
}

interface InspectorRowProps {
  readonly label: string
  readonly children: ReactNode
}

function InspectorRow({ label, children }: InspectorRowProps) {
  return (
    <div className="flex min-h-7 items-center justify-between gap-2">
      <span className="shrink-0 text-[10px] text-zinc-500">{label}</span>
      {children}
    </div>
  )
}

interface ColorTokenInputProps {
  readonly value: string
  readonly onChange: (hex: string) => void
}

function ColorTokenInput({ value, onChange }: ColorTokenInputProps) {
  return (
    <label className="relative flex cursor-pointer items-center gap-1.5">
      <span
        className="h-5 w-5 rounded-md border border-zinc-700"
        style={{ background: value }}
      />
      <span className="font-mono text-[10px] text-zinc-400">{value}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label="Seleccionar color"
      />
    </label>
  )
}

interface SliderInputProps {
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly format: (value: number) => string
  readonly onChange: (value: number) => void
}

function SliderInput({ value, min, max, step, format, onChange }: SliderInputProps) {
  return (
    <div className="flex w-[130px] items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer accent-zinc-300"
      />
      <span className="w-11 shrink-0 text-right font-mono text-[10px] text-zinc-400">
        {format(value)}
      </span>
    </div>
  )
}
