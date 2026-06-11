import { Suspense, useEffect, useMemo, memo, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useTenantContext } from '@app/providers/TenantProvider'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { cn } from '@shared/utils/cn'
import { useTableMenu, useActiveDishes, MenuSkeleton, DishSelectionModal } from '@features/menu'
import { useAdminMenus } from '@features/menus'
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

/**
 * A subtle floating badge that appears on every public menu.
 * It's the viral loop: every customer who sees a beautiful menu has a path
 * to sign up for the platform.
 */
const PoweredByBadge = memo(function PoweredByBadge({ tenantId }: { tenantId: string }) {
  return (
    <a
      href={`/?utm_source=menu_badge&utm_medium=organic&utm_content=${tenantId}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Creá tu menú digital gratis con Soda La Rústica"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold backdrop-blur-md transition-all hover:scale-105 active:scale-95 select-none"
      style={{
        background:  'rgba(0,0,0,0.55)',
        border:      '1px solid rgba(255,255,255,0.12)',
        color:       'rgba(255,255,255,0.85)',
        boxShadow:   '0 4px 16px rgba(0,0,0,0.3)',
        letterSpacing: '0.01em',
      }}
    >
      <span style={{ color: '#e99a0e' }}>⚡</span>
      Menú por Soda La Rústica
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const { tenantId, menuId, dishId } = useParams<{ tenantId: string; menuId?: string; dishId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const tableId = searchParams.get('table') ?? undefined
  const isPreview = searchParams.get('preview') === 'true'

  const { tenant: baseTenant } = useTenantContext()
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

  // Notify the PC editor that a phone has successfully connected/scanned
  useEffect(() => {
    if (!tenantId || !isPreview) return
    // Only notify if we are NOT inside an iframe (meaning a real device/tab opened it)
    if (window.self !== window.top) return

    void updateDoc(doc(db, 'tenants', tenantId, 'appearancePreview', 'current'), { phoneActive: true })
      .catch((err) => console.error("Error notifying PC of scan:", err))
  }, [tenantId, isPreview])

  const tenant = (isPreview && previewTenant && baseTenant)
    ? {
        ...baseTenant,
        name: previewTenant.name,
        templateId: previewTenant.templateId,
        branding: {
          ...baseTenant.branding,
          ...previewTenant.branding,
        },
      }
    : (previewTenant || baseTenant)
  const { data: tableMenu } = useTableMenu(tenantId ?? '', tableId ?? '')
  const { data: menus } = useAdminMenus(tenantId ?? '')
  const firstMenuId = menus?.[0]?.id ?? ''
  const resolvedMenuId = tableMenu?.menu?.id ?? menuId ?? firstMenuId ?? ''

  const { groups = [], isLoading } = useActiveDishes(tenantId ?? '', resolvedMenuId, [])
  const { document: editorDoc } = usePublishedEditorDocument(tenantId ?? '')

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

  if (!tenantId) return <MenuNotFound />
  if (!tenant) return isLoading ? <MenuSkeleton /> : <MenuNotFound />

  return (
    <Suspense fallback={<MenuSkeleton />}>
      {isPreview && <LivePreviewIndicator connected={isLiveConnected} />}
      {editorDoc ? (
        <DataLayerRenderer canvaTemplate={editorDoc.canvaTemplate} layers={editorDoc.dataLayers} context={dataLayerCtx} />
      ) : (
        <TemplateComponent
          tenant={tenant}
          menu={tableMenu?.menu ?? walkInMenu(tenantId, resolvedMenuId)}
          table={tableMenu?.table ?? walkInTable(tenantId, resolvedMenuId)}
          groups={groups}
          tenantId={tenantId}
        />
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
        />
      )}
      {tenantId && <PoweredByBadge tenantId={tenantId} />}
    </Suspense>
  )
}
