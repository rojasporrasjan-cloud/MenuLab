/* eslint-disable react-hooks/static-components */
import { Suspense, useEffect, useMemo, memo, useState, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useTenantContext } from '@app/providers/TenantProvider'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { cn } from '@shared/utils/cn'
import { COPY } from '@shared/copy/ui.copy'
import { Search, X } from 'lucide-react'
import { useTableMenu, useActiveDishes, MenuSkeleton, DishSelectionModal, FeaturedCarousel } from '@features/menu'
import { selectFeaturedDishes } from '@core/domain/entities/Dish'
import type { Dish } from '@core/domain/entities/Dish'
import { LIMITS } from '@shared/constants/limits'
import type { DishCartSelection } from '@features/menu/components/DishSelectionModal'
import { useAdminMenus } from '@features/menus'
import { CartProvider, CartButton, CartDrawer, useCart } from '@features/cart'
import { useTrackEvent } from '@features/analytics/hooks/useTrackEvent'
import { getTemplateComponent } from '@features/templates'
import { usePublishedEditorDocument } from '@features/editor'
import { DataLayerRenderer } from '@features/editor/components/DataLayerRenderer'
import type { DataLayerContext, ResolvedDish, ResolvedCategory } from '@features/editor/components/DataLayerRenderer'
import type { DishesGroupedByCategory } from '@core/use-cases/menu/GetActiveDishesUseCase'
import type { Menu } from '@core/domain/entities/Menu'
import type { Table } from '@core/domain/entities/Table'
import type { Tenant } from '@core/domain/entities/Tenant'

// ─── Head meta tag helpers ────────────────────────────────────────────────────

/**
 * Upserts a <meta> tag in <head>.
 * Uses property= for OG tags and name= for standard ones.
 */
function setMeta(attr: 'property' | 'name', key: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Upserts a <link> tag in <head>. */
function setLink(rel: string, href: string): void {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Visitante sin mesa (link directo o QR genérico): los templates exigen
 * `menu` y `table` completos, así que construimos placeholders tipados.
 * Solo consumen `menu.id`, `table.label` y `table.number`.
 */
function walkInMenu(tenantId: string, menuId: string): Menu {
  return {
    id: menuId,
    tenantId,
    name: '',
    description: null,
    status: 'active',
    categoryOrder: [],
    schedule: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  }
}

function walkInTable(tenantId: string, menuId: string): Table {
  return {
    id: 'walk-in',
    tenantId,
    menuId,
    number: '',
    label: 'Bienvenido',
    status: 'active',
    qrCodeUrl: null,
    qrMenuUrl: null,
    qrGeneratedAt: null,
    createdAt: new Date(0),
  }
}

function formatPrice(amount: number, currency: string): string {
  if (currency === 'CRC') return `₡${amount.toLocaleString()}`
  if (currency === 'USD') return `$${amount}`
  return `${currency} ${amount}`
}

function buildDataLayerContext(
  groups: DishesGroupedByCategory[],
  tenant: { name: string; branding: { logoUrl?: string | null; tagline?: string | null; infoFooter: { phone?: string | null; address?: string | null } } } | null,
): DataLayerContext {
  const dishes: Record<string, ResolvedDish> = {}
  const categories: Record<string, ResolvedCategory> = {}

  for (const { category, dishes: catDishes } of groups) {
    categories[category.id] = { name: category.name }
    for (const d of catDishes) {
      dishes[d.id] = {
        name:        d.name,
        price:       d.price ? formatPrice(d.price.amount, d.price.currency) : '₡0',
        description: d.description ?? null,
        imageUrl:    d.assets?.imageUrl ?? null,
        tags:        d.tags ?? [],
        categoryId:  d.categoryId,
      }
    }
  }

  return {
    dishes,
    categories,
    tenant: tenant ? {
      name:    tenant.name,
      logoUrl: tenant.branding.logoUrl ?? null,
      tagline: tenant.branding.tagline ?? null,
      phone:   tenant.branding.infoFooter.phone ?? null,
      address: tenant.branding.infoFooter.address ?? null,
    } : null,
  }
}

// ─── Powered-by badge ─────────────────────────────────────────────────────────

// Badge removed per user request

// ─── Reservation link (floating pill) ─────────────────────────────────────────

/**
 * Acceso a la página pública de reservas desde la carta.
 * Solo se muestra cuando tenant.features.reservationsEnabled está activo.
 */
const ReservationLink = memo(function ReservationLink({
  tenantId,
  accentColor,
}: {
  tenantId: string
  accentColor: string
}) {
  return (
    <a
      href={`/${tenantId}/reservar`}
      aria-label={COPY.reservations.menuLink}
      className="fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold backdrop-blur-md transition-all hover:scale-105 active:scale-95 select-none"
      style={{
        background: 'rgba(0,0,0,0.55)',
        border: `1px solid ${accentColor}55`,
        color: 'rgba(255,255,255,0.92)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}
    >
      <span style={{ color: accentColor }}>📅</span>
      {COPY.reservations.menuLink}
    </a>
  )
})

// ─── Not-found state ──────────────────────────────────────────────────────────

function MenuNotFound() {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ background: '#0c0c0e' }}
    >
      {/* Animated plate */}
      <div className="relative">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full text-5xl"
          style={{
            background:  'linear-gradient(135deg, rgba(233,154,14,0.15), rgba(233,154,14,0.05))',
            border:      '1px solid rgba(233,154,14,0.2)',
            boxShadow:   '0 0 40px rgba(233,154,14,0.1)',
          }}
        >
          🍽
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-xs">
        <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
          Menú no disponible
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Este menú no existe o fue eliminado. Si eres el dueño, verifica la URL.
        </p>
      </div>
    </div>
  )
}

// ─── Live preview connection indicator ────────────────────────────────────────

const LivePreviewIndicator = memo(function LivePreviewIndicator({ connected }: { connected: boolean }) {
  return (
    <div
      className="fixed top-4 left-4 z-[9999] flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-md transition-all select-none"
      style={{
        background: connected ? 'rgba(20, 83, 45, 0.9)' : 'rgba(153, 27, 27, 0.9)',
        border: connected ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
        color: '#ffffff',
      }}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-green-400 animate-pulse" : "bg-red-400")} />
      {connected ? 'En vivo' : 'Desconectado'}
    </div>
  )
})

// ─── Table Indicator (Static Banner) ──────────────────────────────────────────

const TableIndicator = memo(function TableIndicator({
  tableNumber,
  tableLabel,
  accentColor,
}: {
  tableNumber: string
  tableLabel: string | null
  accentColor: string
}) {
  return (
    <div
      className="w-full py-2 px-4 flex flex-col items-center justify-center text-center shadow-sm select-none"
      style={{
        backgroundColor: accentColor,
        color: '#ffffff',
      }}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest opacity-90 mb-0.5">
        Estás en
      </p>
      <p className="text-base font-black tracking-tight leading-none">
        Mesa {tableNumber}
      </p>
      {tableLabel && tableLabel !== tableNumber && (
        <p className="text-[11px] font-medium opacity-80 mt-1">
          {tableLabel}
        </p>
      )}
    </div>
  )
})

// ─── Ordering overlay (FAB + drawer) ──────────────────────────────────────────

/**
 * Capa de pedidos en línea sobre la carta pública.
 * Solo se monta cuando tenant.features.orderingEnabled está activo.
 */
function OrderingOverlay({
  tenantId,
  whatsappPhone,
  sinpeNumber,
  tableId,
  tableLabel,
  accentColor,
  deliveryConfig,
  taxConfig,
}: {
  tenantId: string
  whatsappPhone: string
  sinpeNumber: string | null
  tableId: string | null
  tableLabel: string | null
  accentColor: string
  deliveryConfig?: Tenant['deliveryConfig']
  taxConfig?: Tenant['taxConfig']
}) {
  return (
    <>
      <CartButton accentColor={accentColor} />
      <CartDrawer
        tenantId={tenantId}
        whatsappPhone={whatsappPhone}
        sinpeNumber={sinpeNumber}
        tableId={tableId}
        tableLabel={tableLabel}
        accentColor={accentColor}
        deliveryConfig={deliveryConfig}
        taxConfig={taxConfig}
      />
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MenuPage() {
  return (
    <CartProvider>
      <MenuPageContent />
    </CartProvider>
  )
}

function MenuPageContent() {
  const { tenantId, menuId, dishId } = useParams<{ tenantId: string; menuId?: string; dishId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tableId = searchParams.get('tableId') ?? searchParams.get('table') ?? undefined
  const isPreview = searchParams.get('preview') === 'true'

  const { tenant: baseTenant, isLoading: isTenantLoading } = useTenantContext()
  const [previewTenant, setPreviewTenant] = useState<Tenant | null>(null)
  const [isLiveConnected, setIsLiveConnected] = useState(false)

  useEffect(() => {
    if (!tenantId || !isPreview) return
    const unsub = onSnapshot(
      doc(db, 'tenants', tenantId, 'appearancePreview', 'current'),
      (snap) => {
        if (snap.exists()) {
          setPreviewTenant(snap.data() as Tenant)
          setIsLiveConnected(true)
        } else {
          setIsLiveConnected(false)
        }
      },
      (error) => {
        console.error("Error listening to live preview:", error)
        setIsLiveConnected(false)
      }
    )
    return () => unsub()
  }, [tenantId, isPreview])

  // Instant local preview via postMessage (bypasses Firebase limits)
  useEffect(() => {
    if (!isPreview) return
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'LIVE_PREVIEW_UPDATE') {
        setPreviewTenant(e.data.payload)
        setIsLiveConnected(true)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [isPreview])


  // Notify the PC editor that a phone has successfully connected/scanned
  useEffect(() => {
    if (!tenantId || !isPreview) return
    // Only notify if we are NOT inside an iframe (meaning a real device/tab opened it)
    if (window.self !== window.top) return

    void updateDoc(doc(db, 'tenants', tenantId, 'appearancePreview', 'current'), { phoneActive: true })
      .catch((err) => console.error("Error notifying PC of scan:", err))
  }, [tenantId, isPreview])

  const tenant = useMemo(() => {
    return (isPreview && previewTenant && baseTenant)
      ? {
          ...baseTenant,
          name: previewTenant.name,
          templateId: previewTenant.templateId,
          branding: {
            ...baseTenant.branding,
            ...previewTenant.branding,
          },
          // El preview en vivo también lleva los feature flags (p. ej. carrito),
          // para que activarlos en Apariencia se refleje al instante en el menú.
          features: {
            ...baseTenant.features,
            ...previewTenant.features,
          },
        }
      : (previewTenant || baseTenant)
  }, [isPreview, previewTenant, baseTenant])
  const { data: tableMenu } = useTableMenu(tenantId ?? '', tableId ?? '')
  const { data: menus } = useAdminMenus(tenantId ?? '')
  const firstMenuId = menus?.[0]?.id ?? ''
  const resolvedMenuId = tableMenu?.menu?.id ?? menuId ?? firstMenuId ?? ''

  const { groups = [], isLoading } = useActiveDishes(tenantId ?? '', resolvedMenuId, [])
  const { document: editorDoc } = usePublishedEditorDocument(tenantId ?? '')

  // ─── Búsqueda (Search) ────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groups
    const lower = searchTerm.toLowerCase()
    return groups.map(g => ({
      ...g,
      dishes: g.dishes.filter(d => 
        d.name.toLowerCase().includes(lower) || 
        (d.description && d.description.toLowerCase().includes(lower))
      )
    })).filter(g => g.dishes.length > 0)
  }, [groups, searchTerm])

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      // Pequeño delay para enfocar correctamente en móvil después de la animación
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isSearchOpen])

  // Build DataLayer context for editor-driven templates
  const dataLayerCtx = useMemo(
    () => buildDataLayerContext(groups, tenant ?? null),
    [groups, tenant],
  )

  // Set page meta tags
  useEffect(() => {
    if (!tenant) return
    const title = `${tenant.name} — Menú Digital`
    document.title = title
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:type', 'website')
    if (tenant.branding?.logoUrl) {
      setMeta('property', 'og:image', tenant.branding.logoUrl)
    }
    if (tenant.branding?.tagline) {
      setMeta('name', 'description', tenant.branding.tagline)
      setMeta('property', 'og:description', tenant.branding.tagline)
    }
    setLink('canonical', window.location.href)
  }, [tenant])

  // Aplica la tipografía seleccionada en vivo (móvil y PC). Los templates
  // consumen `var(--tenant-font, <su-default>)` como fuente de cuerpo, así que
  // basta con publicar la fuente del branding en el root para que se actualice
  // sin remontar nada.
  useEffect(() => {
    const font = tenant?.branding.fontFamily
    const root = document.documentElement
    if (font) root.style.setProperty('--tenant-font', `"${font}"`)
    return () => { root.style.removeProperty('--tenant-font') }
  }, [tenant?.branding.fontFamily])

  // Memoizado: el registry devuelve referencias lazy estables; useMemo garantiza
  // identidad constante entre renders para no remontar el template.
  const TemplateComponent = useMemo(
    () => getTemplateComponent(tenant?.templateId ?? ''),
    [tenant?.templateId],
  )

  const selectedDish = useMemo(() => {
    if (!dishId) return null
    return groups.flatMap((g) => g.dishes).find((d) => d.id === dishId) ?? null
  }, [dishId, groups])

  // ── Ordering (carrito) ──────────────────────────────────────────────────────
  const cart = useCart()
  const { track } = useTrackEvent(tenantId ?? '')
  const orderingEnabled = tenant?.features?.orderingEnabled ?? false
  const orderingPhone =
    tenant?.branding.infoFooter.phone ||
    tenant?.branding.orderButton.whatsapp ||
    tenant?.branding.socials.whatsapp ||
    ''
  const sinpeNumber = tenant?.branding.infoFooter.sinpeNumber?.trim() || null
  const resolvedTableId = tableMenu?.table?.id ?? tableId ?? null
  const resolvedTableLabel = tableMenu?.table?.label ?? tableMenu?.table?.number ?? null

  function handleAddToCart(selection: DishCartSelection): void {
    cart.add({
      dishId: selection.dishId,
      dishName: selection.dishName,
      unitPrice: selection.unitPrice,
      currency: selection.currency,
      variantLabel: selection.variantLabel,
      note: null,
    })
    track({ type: 'cart_add', dishId: selection.dishId, tableId: resolvedTableId })
  }

  // ── Destacados (carrusel) ───────────────────────────────────────────────────
  const featuredDishes = useMemo(
    () =>
      selectFeaturedDishes(
        groups.flatMap((g) => g.dishes),
        LIMITS.featured.maxFeaturedDishes,
      ),
    [groups],
  )

  function handleFeaturedSelect(dish: Dish): void {
    track({ type: 'featured_click', dishId: dish.id, tableId: resolvedTableId })
    navigate(`/${tenantId}/menu/${resolvedMenuId}/dish/${dish.id}${window.location.search}`)
  }

  function handleFeaturedAdd(dish: Dish): void {
    handleAddToCart({
      dishId: dish.id,
      dishName: dish.name,
      unitPrice: dish.price.amount,
      currency: dish.price.currency,
      variantLabel: null,
    })
  }

  function handleFeaturedView(): void {
    track({ type: 'featured_view', tableId: resolvedTableId })
  }

  if (!tenantId) return <MenuNotFound />
  // El tenant puede tardar un instante en resolverse al recargar; mientras el
  // contexto sigue cargando mostramos el skeleton (no el "Menú no disponible",
  // que solo aplica cuando de verdad no existe el tenant).
  if (!tenant) return (isTenantLoading || isLoading) ? <MenuSkeleton /> : <MenuNotFound />

  // Carrusel de destacados: se inyecta DENTRO del template (debajo del Hero)
  // vía la prop `featured`, en lugar de renderizarse por encima de la portada.
  const featuredNode =
    featuredDishes.length > 0 ? (
      <div style={{ background: tenant.branding.backgroundColor }}>
        <FeaturedCarousel
          dishes={featuredDishes}
          accentColor={tenant.branding.primaryColor}
          orderingEnabled={orderingEnabled}
          showPrices={tenant.branding.showPrices}
          onSelect={handleFeaturedSelect}
          onAdd={handleFeaturedAdd}
          onView={handleFeaturedView}
        />
      </div>
    ) : null

  return (
    <Suspense fallback={<MenuSkeleton />}>
      {isPreview && <LivePreviewIndicator connected={isLiveConnected} />}
      {tableMenu?.table && tableMenu.table.id !== 'walk-in' && !isPreview && (
        <TableIndicator
          tableNumber={tableMenu.table.number}
          tableLabel={tableMenu.table.label ?? null}
          accentColor={tenant.branding.primaryColor}
        />
      )}
      {editorDoc ? (
        <DataLayerRenderer canvaTemplate={editorDoc.canvaTemplate} layers={editorDoc.dataLayers} context={dataLayerCtx} />
      ) : (
        <TemplateComponent
          tenant={tenant}
          menu={tableMenu?.menu ?? walkInMenu(tenantId, resolvedMenuId)}
          table={tableMenu?.table ?? walkInTable(tenantId, resolvedMenuId)}
          groups={filteredGroups}
          tenantId={tenantId}
          featured={featuredNode}
        />
      )}

      {/* Si no hay resultados de búsqueda, mostramos un mensaje (por encima o debajo del template vacío) */}
      {searchTerm && filteredGroups.length === 0 && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col items-center justify-center bg-white/95 px-6 text-center backdrop-blur-sm">
          <div className="mb-4 text-4xl opacity-50">🔍</div>
          <h3 className="mb-2 text-xl font-black text-neutral-900">Sin resultados</h3>
          <p className="text-sm font-medium text-neutral-500">No encontramos ningún platillo que coincida con "{searchTerm}".</p>
          <button 
            onClick={() => setSearchTerm('')}
            className="mt-6 rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95"
          >
            Limpiar búsqueda
          </button>
        </div>
      )}

      {/* Floating Search Button */}
      {!isSearchOpen && !editorDoc && (
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Buscar platillos"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9990] flex h-12 items-center gap-2.5 rounded-full px-6 text-[15px] font-bold text-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
          style={{
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          }}
        >
          <Search size={18} className="text-white/80" />
          Buscar platillo...
        </button>
      )}

      {/* Sticky Search Bar (Top) */}
      {isSearchOpen && (
        <div 
          className="fixed top-0 left-0 z-[9999] w-full bg-white px-4 py-3 shadow-lg transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Buscar platillo..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl bg-neutral-100 py-3.5 pl-11 pr-4 text-[14px] font-bold text-neutral-900 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-amber-400"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button 
              onClick={() => {
                setIsSearchOpen(false)
                setSearchTerm('')
              }}
              className="px-2 py-2 text-[14px] font-bold text-neutral-500 hover:text-neutral-900"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {selectedDish && (
        <DishSelectionModal
          isOpen={!!selectedDish}
          onClose={() => {
            const hasHistory = window.history.length > 1 && window.history.state && window.history.state.idx > 0
            if (hasHistory) {
              navigate(-1)
            } else {
              navigate(`/${tenantId}/menu${window.location.search}`, { replace: true })
            }
          }}
          dish={selectedDish}
          branding={tenant.branding}
          onAddToCart={orderingEnabled ? handleAddToCart : undefined}
        />
      )}
      {orderingEnabled && (
        <OrderingOverlay
          tenantId={tenantId}
          whatsappPhone={orderingPhone}
          sinpeNumber={sinpeNumber}
          tableId={resolvedTableId}
          tableLabel={resolvedTableLabel}
          accentColor={tenant.branding.primaryColor}
          deliveryConfig={tenant.deliveryConfig}
          taxConfig={tenant.taxConfig}
        />
      )}
      {(tenant.features?.reservationsEnabled ?? false) && !isPreview && (
        <ReservationLink tenantId={tenantId} accentColor={tenant.branding.primaryColor} />
      )}
    </Suspense>
  )
}
