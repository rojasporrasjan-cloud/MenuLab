/* eslint-disable react-hooks/static-components */
import { useState, useEffect, useMemo, Suspense, useRef, type ReactNode } from 'react'
import {
  CheckCircle2, ExternalLink, Smartphone, Monitor,
  ChevronDown, Palette, Type, LayoutGrid, Upload, X,
  GripHorizontal, Sparkles, Search, QrCode, Eye, EyeOff, ShoppingBag
} from 'lucide-react'
import { Link } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@shared/utils/cn'
import { useTenantContext } from '@app/providers/TenantProvider'
import { Button } from '@shared/ui/components/Button'
import { Spinner } from '@shared/ui/components/Spinner'
import { ROUTES } from '@shared/constants/routes'
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { TEMPLATE_DEFINITIONS, TEMPLATE_DEFAULT_BRANDING, getTemplateComponent } from '@features/templates'
import { useUpdateAppearance } from '@features/settings/hooks/useUpdateAppearance'
import { AppearanceMobileShell, type EditorTool } from '@features/settings/components/AppearanceMobile'
import { isValidHex } from '@shared/utils/colorScale'
import { FONT_OPTIONS } from '@core/domain/entities/Tenant'
import { useAdminMenus } from '@features/menus'
import { useActiveDishes } from '@features/menu'
import type { TemplateId, TenantAnnouncement, TenantSocials, TenantInfoFooter, TenantOrderButton, TenantBgGradient, TenantReservation, TenantPromo, TenantFeatured, ImageRounding } from '@core/domain/entities/Tenant'
import type { Tenant } from '@core/domain/entities/Tenant'
import type { Menu } from '@core/domain/entities/Menu'
import type { Table } from '@core/domain/entities/Table'
import type { Dish } from '@core/domain/entities/Dish'

// ── Color palette presets ─────────────────────────────────────────────────────

const COLOR_PALETTES = [
  { name: 'Noche Profunda', primary: '#e11d48', bg: '#0B0B0C' },
  { name: 'Café Noir', primary: '#c2410c', bg: '#1c1006' },
  { name: 'Oro Bistro', primary: '#d97706', bg: '#1a1208' },
  { name: 'Verde Bosque', primary: '#16a34a', bg: '#0a1a0e' },
  { name: 'Azul Océano', primary: '#0ea5e9', bg: '#061520' },
  { name: 'Lavanda Noche', primary: '#8b5cf6', bg: '#130d20' },
  { name: 'Coral Sunset', primary: '#f43f5e', bg: '#1a0b0d' },
  { name: 'Blanco Limpio', primary: '#e11d48', bg: '#ffffff' },
  { name: 'Crema Cálida', primary: '#c2410c', bg: '#fdf4e7' },
  { name: 'Menta Fresca', primary: '#10b981', bg: '#f0fdf9' },
] as const

// ── Preview mock data ─────────────────────────────────────────────────────────

const PREVIEW_TABLE: Table = {
  id:            'preview',
  tenantId:      '',
  menuId:        '',
  number:        '1',
  label:         'Preview',
  status:        'active',
  qrCodeUrl:     null,
  qrMenuUrl:     null,
  qrGeneratedAt: null,
  createdAt:     new Date(),
}



// ── Editing state ──────────────────────────────────────────────────────────────

interface EditingState {
  // Theme
  templateId: TemplateId
  primaryColor: string
  backgroundColor: string
  fontFamily: string
  cardStyle: 'sharp' | 'rounded' | 'pill'
  textScale: 'sm' | 'md' | 'lg'
  shadowDepth: 'flat' | 'soft' | 'deep'
  // Hero section
  restaurantName: string
  tagline: string
  heroHeight: 'compact' | 'normal' | 'tall'
  coverOpacity: number
  logoFile: File | null
  logoPreview: string | null
  coverFile: File | null
  coverPreview: string | null
  // Menu section
  showPrices: boolean
  showDietaryBadges: boolean
  showSearch: boolean
  imageRounding: ImageRounding
  bgGradient: TenantBgGradient
  detailsCardStyle: 'glass' | 'solid'
  detailsCardOptionStyle: 'list' | 'pills'
  detailsCardShowImage: boolean
  // Page sections
  announcement: TenantAnnouncement
  socials: TenantSocials
  infoFooter: TenantInfoFooter
  orderButton: TenantOrderButton
  /** Feature flag: carrito + checkout + pedidos en línea (features.orderingEnabled). */
  orderingEnabled: boolean
  reservation: TenantReservation
  promo: TenantPromo
  featuredSection: TenantFeatured
}

// ── Firestore serializer ────────────────────────────────────────────────────────
// Strips `undefined` values recursively before writing to Firestore (which rejects them).

type FirestoreScalar = string | number | boolean | null
type FirestoreValue  = FirestoreScalar | FirestoreValue[] | { [key: string]: FirestoreValue }

function stripUndefined(value: unknown): FirestoreValue {
  if (value === undefined || value === null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (value instanceof Date) return value as unknown as string
  if (Array.isArray(value)) return (value as unknown[]).map(stripUndefined)
  if (typeof value === 'object') {
    const result: { [key: string]: FirestoreValue } = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) result[k] = stripUndefined(v)
    }
    return result
  }
  return null
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AppearancePage() {
  const { tenant, tenantId } = useTenantContext()
  const { save, isLoading, error, success } = useUpdateAppearance(tenantId)
  const { data: menus } = useAdminMenus(tenantId)

  const resolvedMenuId = menus?.[0]?.id ?? ''
  const { groups: realGroups = [] } = useActiveDishes(tenantId, resolvedMenuId, menus?.[0]?.categoryOrder ?? [])
  const previewGroups = realGroups

  const defaultEditing = (): EditingState => ({
    templateId: tenant?.templateId ?? 'dark-modern',
    primaryColor: tenant?.branding.primaryColor ?? '#e11d48',
    backgroundColor: tenant?.branding.backgroundColor ?? '#0B0B0C',
    fontFamily: tenant?.branding.fontFamily ?? 'Inter',
    cardStyle: tenant?.branding.cardStyle ?? 'rounded',
    textScale: tenant?.branding.textScale ?? 'md',
    shadowDepth: tenant?.branding.shadowDepth ?? 'soft',
    restaurantName: tenant?.name ?? '',
    tagline: tenant?.branding.tagline ?? '',
    heroHeight: tenant?.branding.heroHeight ?? 'normal',
    coverOpacity: tenant?.branding.coverOpacity ?? 0.65,
    logoFile: null,
    logoPreview: tenant?.branding.logoUrl ?? null,
    coverFile: null,
    coverPreview: tenant?.branding.coverImageUrl ?? null,
    showPrices: tenant?.branding.showPrices ?? true,
    showDietaryBadges: tenant?.branding.showDietaryBadges ?? true,
    showSearch: tenant?.branding.showSearch ?? false,
    imageRounding: tenant?.branding.imageRounding ?? 'lg',
    bgGradient: tenant?.branding.bgGradient ?? { enabled: false, from: tenant?.branding.backgroundColor ?? '#0B0B0C', to: '#1a1a2e', direction: '180deg' as const },
    detailsCardStyle: tenant?.branding.detailsCardStyle ?? 'glass',
    detailsCardOptionStyle: tenant?.branding.detailsCardOptionStyle ?? 'list',
    detailsCardShowImage: tenant?.branding.detailsCardShowImage ?? true,
    announcement: tenant?.branding.announcement ?? { enabled: true, text: '¡Bienvenidos! Descubre nuestro menú', emoji: '🎉', bgColor: null },
    socials: tenant?.branding.socials ?? { enabled: true, instagram: '', facebook: '', tiktok: '', whatsapp: '' },
    infoFooter: tenant?.branding.infoFooter ?? { enabled: true, hours: '', address: '', phone: '', wazeUrl: '', googleMapsUrl: '', sinpeNumber: '' },
    orderButton: tenant?.branding.orderButton ?? { enabled: true, whatsapp: '', label: 'Ordenar ahora' },
    orderingEnabled: tenant?.features?.orderingEnabled ?? true,
    reservation: tenant?.branding.reservation ?? { enabled: true, title: 'Reserva tu mesa', phone: '', bookingUrl: '', buttonLabel: 'Reservar ahora' },
    promo: tenant?.branding.promo ?? { enabled: true, title: '', description: '', imageUrl: null, ctaLabel: 'Ver más', ctaLink: '' },
    featuredSection: tenant?.branding.featuredSection ?? { enabled: true, title: 'Nuestros favoritos', dishIds: [] },
  })

  const [editing, setEditing] = useState<EditingState>(defaultEditing)
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false)

  // Re-inicializa la edición cuando llega (o cambia) el tenant, o si el tenant se actualiza
  // desde afuera (ej. al terminar el Onboarding).
  const [syncedTenantId, setSyncedTenantId] = useState<string | null>(null)
  const [syncedUpdatedAt, setSyncedUpdatedAt] = useState<number>(0)

  const incomingUpdatedAt = tenant?.updatedAt?.getTime() ?? 0

  if (tenant && (tenant.id !== syncedTenantId || incomingUpdatedAt !== syncedUpdatedAt)) {
    setSyncedTenantId(tenant.id)
    setSyncedUpdatedAt(incomingUpdatedAt)
    setEditing({
      templateId: tenant.templateId,
      primaryColor: tenant.branding.primaryColor,
      backgroundColor: tenant.branding.backgroundColor,
      fontFamily: tenant.branding.fontFamily,
      cardStyle: tenant.branding.cardStyle,
      textScale: tenant.branding.textScale,
      shadowDepth: tenant.branding.shadowDepth,
      restaurantName: tenant.name,
      tagline: tenant.branding.tagline ?? '',
      heroHeight: tenant.branding.heroHeight,
      coverOpacity: tenant.branding.coverOpacity,
      logoFile: null,
      logoPreview: tenant.branding.logoUrl,
      coverFile: null,
      coverPreview: tenant.branding.coverImageUrl,
      showPrices: tenant.branding.showPrices,
      showDietaryBadges: tenant.branding.showDietaryBadges,
      showSearch: tenant.branding.showSearch,
      imageRounding: tenant.branding.imageRounding,
      bgGradient: tenant.branding.bgGradient,
      detailsCardStyle: tenant.branding.detailsCardStyle ?? 'glass',
      detailsCardOptionStyle: tenant.branding.detailsCardOptionStyle ?? 'list',
      detailsCardShowImage: tenant.branding.detailsCardShowImage ?? true,
      announcement: { ...tenant.branding.announcement, enabled: true },
      socials: { ...tenant.branding.socials, enabled: true },
      infoFooter: { ...tenant.branding.infoFooter, enabled: true },
      orderButton: { ...tenant.branding.orderButton, enabled: true },
      orderingEnabled: true,
      reservation: { ...tenant.branding.reservation, enabled: true },
      promo: { ...tenant.branding.promo, enabled: true },
      featuredSection: { ...tenant.branding.featuredSection, enabled: true },
    })
  }

  const set = <K extends keyof EditingState>(key: K, value: EditingState[K]) =>
    setEditing((prev) => ({ ...prev, [key]: value }))

  const handleTemplateSelect = (id: TemplateId) => {
    const defaults = TEMPLATE_DEFAULT_BRANDING[id]
    setEditing((prev) => ({
      ...prev,
      templateId: id,
      primaryColor: defaults.primaryColor,
      backgroundColor: defaults.backgroundColor,
      fontFamily: defaults.fontFamily,
    }))
  }

  const handleSave = async () => {
    if (!tenant) return
    await save(
      { ...editing, restaurantName: editing.restaurantName.trim() || tenant.name },
      tenant.branding.logoUrl,
      tenant.branding.coverImageUrl,
    )
  }

  const previewTenant: Tenant | null = useMemo<Tenant | null>(() => tenant
    ? {
        ...tenant,
        name: editing.restaurantName.trim() || tenant.name,
        templateId: editing.templateId,
        branding: {
          ...tenant.branding,
          primaryColor: isValidHex(editing.primaryColor) ? editing.primaryColor : tenant.branding.primaryColor,
          backgroundColor: isValidHex(editing.backgroundColor) ? editing.backgroundColor : tenant.branding.backgroundColor,
          fontFamily: editing.fontFamily,
          logoUrl: editing.logoPreview,
          coverImageUrl: editing.coverPreview,
          tagline: editing.tagline.trim() || null,
          cardStyle: editing.cardStyle,
          coverOpacity: editing.coverOpacity,
          textScale: editing.textScale,
          shadowDepth: editing.shadowDepth,
          heroHeight: editing.heroHeight,
          showPrices: editing.showPrices,
          showDietaryBadges: editing.showDietaryBadges,
          showSearch: editing.showSearch,
          imageRounding: editing.imageRounding,
          bgGradient: editing.bgGradient,
          detailsCardStyle: editing.detailsCardStyle,
          detailsCardOptionStyle: editing.detailsCardOptionStyle,
          detailsCardShowImage: editing.detailsCardShowImage,
          announcement: editing.announcement,
          socials: editing.socials,
          infoFooter: editing.infoFooter,
          orderButton: editing.orderButton,
          reservation: editing.reservation,
          promo: editing.promo,
          featuredSection: editing.featuredSection,
        },
        features: { ...tenant.features, orderingEnabled: editing.orderingEnabled },
      }
    : null, [tenant, editing])

  const previewMenu: Menu = menus?.[0] ?? {
    id:            'preview',
    tenantId,
    name:          'Menú',
    description:   null,
    status:        'active',
    categoryOrder: [],
    schedule:      null,
    createdAt:     new Date(),
    updatedAt:     new Date(),
  }
  // Memoizado: el registry devuelve referencias lazy estables; useMemo garantiza
  // identidad constante entre renders para no remontar el preview.
  const TemplatePreview = useMemo(() => getTemplateComponent(editing.templateId), [editing.templateId])
  const menuPreviewUrl = `/${tenantId}/menu`

  const [previewMode, setPreviewMode] = useState<'full' | 'mobile'>('mobile')
  const [activeTab, setActiveTab] = useState<'sections' | 'theme'>('sections')
  const [openSection, setOpenSection] = useState<string | null>('hero')

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Vista móvil: el "teléfono" del preview se escala al alto disponible del
  // panel (antes era fijo y muy pequeño). El iframe se renderiza a tamaño
  // lógico de teléfono (390×863) y se reduce con transform para ser fiel.
  const phoneAreaRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [phoneScale, setPhoneScale] = useState(0.6)

  useEffect(() => {
    if (previewMode !== 'mobile') return
    const el = phoneAreaRef.current
    if (!el) return
    const compute = (): void => {
      const fromHeight = (el.clientHeight - 72) / 863
      const fromWidth = (el.clientWidth - 24) / 390
      setPhoneScale(Math.max(0.5, Math.min(0.95, Math.min(fromHeight, fromWidth))))
    }
    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(el)
    return () => observer.disconnect()
  }, [previewMode])

  // Reset scroll position when tab changes to avoid sections being hidden out of view
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [activeTab])

  // Tipografía en vivo: publica la fuente seleccionada como CSS var para que el
  // preview embebido (PC) actualice la fuente de cuerpo al cambiarla en config.
  useEffect(() => {
    const font = previewTenant?.branding.fontFamily
    const root = document.documentElement
    if (font) root.style.setProperty('--tenant-font', `"${font}"`)
    return () => { root.style.removeProperty('--tenant-font') }
  }, [previewTenant?.branding.fontFamily])

  // Real-time sync for phone preview
  useEffect(() => {
    if (!tenantId || !previewTenant) return
    const timeout = setTimeout(() => {
      const cleanData = {
        name:       previewTenant.name,
        templateId: previewTenant.templateId,
        branding:   stripUndefined(previewTenant.branding),
        features:   previewTenant.features,
      }

      void setDoc(doc(db, 'tenants', tenantId, 'appearancePreview', 'current'), cleanData)
        .catch((err) => {
          console.error("Error updating live preview document:", err)
        })
    }, 1500) // 1500ms debounce to strictly respect Firestore 1 write/sec limit
    return () => clearTimeout(timeout)
  }, [tenantId, previewTenant])

  // Truly live sync to iframe via postMessage (no Firebase limits)
  useEffect(() => {
    if (iframeRef.current?.contentWindow && previewTenant) {
      iframeRef.current.contentWindow.postMessage({
        type: 'LIVE_PREVIEW_UPDATE',
        payload: {
          name: previewTenant.name,
          templateId: previewTenant.templateId,
          branding: stripUndefined(previewTenant.branding),
          features: previewTenant.features,
        }
      }, '*')
    }
  }, [previewTenant])

  // Listen for phone connection trigger to auto-close QR modal and collapse preview
  useEffect(() => {
    if (!tenantId) return
    const unsub = onSnapshot(
      doc(db, 'tenants', tenantId, 'appearancePreview', 'current'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          if (data.phoneActive === true) {
            setIsQrDialogOpen(false)
            setIsPreviewCollapsed(true)
            // Reset to false immediately in Firestore
            void updateDoc(doc(db, 'tenants', tenantId, 'appearancePreview', 'current'), { phoneActive: false })
              .catch((err) => console.error("Error resetting phoneActive:", err))
          }
        }
      },
      (err) => console.error("Live preview snapshot error:", err)
    )
    return () => unsub()
  }, [tenantId])

  const toggleSection = (id: string) =>
    setOpenSection((prev) => (prev === id ? null : id))

  const hasChanges = tenant ? (
    editing.restaurantName.trim() !== tenant.name ||
    editing.templateId !== tenant.templateId ||
    editing.primaryColor !== tenant.branding.primaryColor ||
    editing.backgroundColor !== tenant.branding.backgroundColor ||
    editing.fontFamily !== tenant.branding.fontFamily ||
    editing.cardStyle !== tenant.branding.cardStyle ||
    editing.textScale !== tenant.branding.textScale ||
    editing.shadowDepth !== tenant.branding.shadowDepth ||
    editing.heroHeight !== tenant.branding.heroHeight ||
    editing.coverOpacity !== tenant.branding.coverOpacity ||
    editing.logoFile !== null ||
    editing.coverFile !== null ||
    editing.logoPreview !== tenant.branding.logoUrl ||
    editing.coverPreview !== tenant.branding.coverImageUrl ||
    (editing.tagline.trim() || null) !== tenant.branding.tagline ||
    editing.showPrices !== tenant.branding.showPrices ||
    editing.showDietaryBadges !== tenant.branding.showDietaryBadges ||
    editing.showSearch !== tenant.branding.showSearch ||
    editing.imageRounding !== tenant.branding.imageRounding ||
    editing.detailsCardStyle !== (tenant.branding.detailsCardStyle ?? 'glass') ||
    editing.detailsCardOptionStyle !== (tenant.branding.detailsCardOptionStyle ?? 'list') ||
    editing.detailsCardShowImage !== (tenant.branding.detailsCardShowImage ?? true) ||
    JSON.stringify(editing.bgGradient) !== JSON.stringify(tenant.branding.bgGradient) ||
    JSON.stringify(editing.announcement) !== JSON.stringify(tenant.branding.announcement) ||
    JSON.stringify(editing.socials) !== JSON.stringify(tenant.branding.socials) ||
    JSON.stringify(editing.infoFooter) !== JSON.stringify(tenant.branding.infoFooter) ||
    JSON.stringify(editing.orderButton) !== JSON.stringify(tenant.branding.orderButton) ||
    editing.orderingEnabled !== tenant.features.orderingEnabled ||
    JSON.stringify(editing.reservation) !== JSON.stringify(tenant.branding.reservation) ||
    JSON.stringify(editing.promo) !== JSON.stringify(tenant.branding.promo) ||
    JSON.stringify(editing.featuredSection) !== JSON.stringify(tenant.branding.featuredSection)
  ) : false

  // Prompts confirmation dialog if user tries to reload/navigate away with unsaved edits
  useEffect(() => {
    if (!hasChanges) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  // ── Móvil: herramientas, preview y acciones para el shell nativo ───────────
  const themeToolProps = { editing, set, handleTemplateSelect, isPreviewCollapsed: false } as const
  const mobileTools: EditorTool[] = [
    { id: 'template', label: 'Plantilla',  icon: LayoutGrid,     content: <ThemePanel {...themeToolProps} only="template" /> },
    { id: 'colors',   label: 'Colores',    icon: Palette,        content: <ThemePanel {...themeToolProps} only="colors" /> },
    { id: 'gradient', label: 'Fondo',      icon: GripHorizontal, content: <ThemePanel {...themeToolProps} only="gradient" /> },
    { id: 'type',     label: 'Tipografía', icon: Type,           content: <ThemePanel {...themeToolProps} only="typography" /> },
    { id: 'style',    label: 'Estilo',     icon: Sparkles,       content: <ThemePanel {...themeToolProps} only="style" /> },
    {
      id: 'sections', label: 'Secciones', icon: ShoppingBag,
      content: <SectionsPanel editing={editing} set={set} openSection={openSection} toggleSection={toggleSection} previewGroups={previewGroups} isPreviewCollapsed={false} />,
    },
  ]

  const mobileHeader = (
    <>
      <Link to={ROUTES.admin.dashboard} aria-label="Cerrar editor" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-transform active:scale-90">
        <X size={18} />
      </Link>
      <div className="flex items-center gap-2">
        {success && <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-bold text-white">Guardado</span>}
        <button type="button" onClick={() => void handleSave()} disabled={isLoading} className="h-9 rounded-full bg-brand-500 px-4 text-[13px] font-bold text-white shadow-md shadow-brand-500/30 transition-transform active:scale-95 disabled:opacity-60">
          {isLoading ? 'Guardando…' : 'Publicar'}
        </button>
      </div>
    </>
  )

  const mobilePreview = previewTenant ? (
    // transform-gpu hace que el frame sea el contenedor de los elementos
    // `position: fixed` del template (ej. botón "Ordenar"), evitando que se
    // escapen sobre el toolbar. overflow-hidden los recorta dentro del teléfono.
    <div className="transform-gpu aspect-[10/19] h-full max-h-full w-auto overflow-hidden rounded-[2.3rem] border-2 border-white/10 bg-black shadow-2xl ring-1 ring-white/5">
      <Suspense fallback={<div className="grid h-full place-items-center" style={{ backgroundColor: editing.backgroundColor }}><Spinner size="sm" /></div>}>
        <div className="scrollbar-hide h-full w-full overflow-y-auto" style={{ backgroundColor: editing.backgroundColor }}>
          <TemplatePreview tenant={previewTenant} menu={previewMenu} table={PREVIEW_TABLE} groups={previewGroups} tenantId={tenantId} />
        </div>
      </Suspense>
    </div>
  ) : (
    <div className="grid h-full place-items-center"><Spinner size="sm" /></div>
  )

  return (
    <>
    {/* ── Desktop: layout existente ─────────────────────────────────── */}
    <div className="hidden md:flex flex-col gap-0 h-full w-full min-h-0">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-200 bg-white shrink-0 shadow-sm">
        <div>
          <h1 className="text-sm font-bold text-zinc-900 tracking-tight">Apariencia</h1>
        </div>
        <div className="flex items-center gap-2">
          {success && (
            <div className="flex items-center gap-1.5 text-xs text-green-700 font-medium mr-2">
              <CheckCircle2 size={13} />Guardado
            </div>
          )}
          <div className="flex items-center rounded-xl border border-zinc-200 p-0.5 bg-zinc-50">
            <button
              onClick={() => setPreviewMode('full')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
                previewMode === 'full' ? 'bg-white text-zinc-900 shadow-sm font-semibold' : 'text-zinc-400 hover:text-zinc-650',
              )}
            >
              <Monitor size={12} />Completo
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
                previewMode === 'mobile' ? 'bg-white text-zinc-900 shadow-sm font-semibold' : 'text-zinc-400 hover:text-zinc-650',
              )}
            >
              <Smartphone size={12} />Móvil
            </button>
          </div>

          <Button variant="secondary" size="sm" asChild className="rounded-xl shadow-sm hidden sm:inline-flex">
            <Link to={menuPreviewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={12} className="mr-1.5" />Ver menú
            </Link>
          </Button>

          <Dialog.Root open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
            <Dialog.Trigger asChild>
              <Button variant="secondary" size="sm" className="rounded-xl shadow-sm">
                <QrCode size={13} className="mr-1.5" />
                Ver en celular
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-[340px] translate-x-[-50%] translate-y-[-50%] rounded-3xl bg-white p-6 shadow-xl text-center flex flex-col items-center">
                <Dialog.Title className="text-lg font-bold text-zinc-900 mb-2">
                  Ver menú en tu celular
                </Dialog.Title>
                <Dialog.Description className="text-sm text-zinc-500 mb-6">
                  Escanea este código QR con la cámara de tu teléfono para ver los cambios en tiempo real.
                </Dialog.Description>
                { (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                  <div className="mb-4 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 text-left">
                    <strong>Nota de desarrollo:</strong> El QR está apuntando a la IP de tu red (192.168.100.130) para que tu celular pueda conectarse a tu computadora. Debes estar conectado al mismo Wi-Fi.
                  </div>
                )}
                <div className="flex justify-center mb-6 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 w-full">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://192.168.100.130:4001' : window.location.origin) + menuPreviewUrl + '?preview=true')}`}
                    alt="QR Code del menú"
                    className="w-[200px] h-[200px] rounded-lg mx-auto"
                  />
                </div>
                <Dialog.Close asChild>
                  <Button className="w-full rounded-xl">Cerrar</Button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPreviewCollapsed((c) => !c)}
            className="rounded-xl shadow-sm inline-flex"
          >
            {isPreviewCollapsed ? <Eye size={13} className="mr-1.5" /> : <EyeOff size={13} className="mr-1.5" />}
            {isPreviewCollapsed ? 'Mostrar preview' : 'Ocultar preview'}
          </Button>

          <Button size="sm" isLoading={isLoading} onClick={() => void handleSave()} className={cn('rounded-xl shadow-sm', !hasChanges && 'opacity-60')}>
            Guardar
          </Button>
        </div>
      </div>

      {error && <div className="px-6 py-2.5 bg-red-50 border-b border-red-100 text-sm text-red-700 shrink-0">{error}</div>}

      {/* ── Main layout ──────────────────────────────────────────────── */}
      <div className="flex flex-1 items-stretch min-h-0">

        {/* ── Left panel ── */}
        <div className={cn(
          "flex flex-col border-r border-surface-100 bg-surface-0 h-full min-h-0 transition-all duration-300 ease-in-out",
          isPreviewCollapsed ? "flex-1 w-full" : "hidden md:flex md:w-[380px] lg:w-[420px] shrink-0"
        )}>

          {/* Tab nav — Shopify-style */}
          <div className="flex shrink-0 border-b border-surface-100">
            <button
              onClick={() => setActiveTab('sections')}
              className={cn(
                'flex-1 py-3 text-xs font-semibold transition-all border-b-2',
                activeTab === 'sections'
                  ? 'text-brand-600 border-brand-500'
                  : 'text-surface-400 border-transparent hover:text-surface-600',
              )}
            >
              Secciones
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={cn(
                'flex-1 py-3 text-xs font-semibold transition-all border-b-2',
                activeTab === 'theme'
                  ? 'text-brand-600 border-brand-500'
                  : 'text-surface-400 border-transparent hover:text-surface-600',
              )}
            >
              Tema
            </button>
          </div>

          {/* AI Digitize banner — always visible */}
          <div className="shrink-0 m-3 rounded-xl overflow-hidden border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
            <Link
              to={`${ROUTES.admin.editor}?openDigitalize=1`}
              className="flex items-center gap-3 p-3 hover:from-violet-100 hover:to-purple-100 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
                <Sparkles size={15} className="text-violet-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-violet-800">Digitalizar menú con IA</p>
                <p className="text-[10px] text-violet-500 leading-tight">Sube una foto y Gemini lo convierte en tu menú digital</p>
              </div>
              <ExternalLink size={11} className="shrink-0 text-violet-400" />
            </Link>
          </div>

          {/* Panel content */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
            {activeTab === 'sections' ? (
              <SectionsPanel
                editing={editing}
                set={set}
                openSection={openSection}
                toggleSection={toggleSection}
                previewGroups={previewGroups}
                isPreviewCollapsed={isPreviewCollapsed}
              />
            ) : (
              <ThemePanel
                editing={editing}
                set={set}
                handleTemplateSelect={handleTemplateSelect}
                isPreviewCollapsed={isPreviewCollapsed}
              />
            )}
          </div>

          {/* Unsaved changes bar */}
          {hasChanges && (
            <div className="shrink-0 border-t border-amber-200 bg-amber-50 px-3 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                <span className="text-[11px] font-medium text-amber-700">Cambios sin guardar</span>
              </div>
              <button
                onClick={() => void handleSave()}
                disabled={isLoading}
                className="rounded-lg bg-amber-500 px-3 py-1 text-[11px] font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
              >
                {isLoading ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          )}
        </div>

        {/* ── Right panel: live preview ── */}
        {previewMode === 'full' ? (
          <div className={cn(
            "flex flex-col h-full rounded-r-xl border-l-0 border border-surface-200 shadow-sm transition-all duration-300 ease-in-out relative overflow-hidden",
            isPreviewCollapsed ? "w-0 opacity-0 border-0 shrink-0" : "flex-1 w-full"
          )} style={{ backgroundColor: editing.backgroundColor, transform: 'translateZ(0)' }}>
            <div className="flex-1 overflow-y-auto relative flex flex-col">
              {realGroups.length === 0 && (
                <div className="flex shrink-0 items-center justify-center gap-1.5 py-2 text-xs bg-amber-50 border-b border-amber-100">
                  <span className="text-amber-600">Vista de ejemplo —</span>
                  <Link to={ROUTES.admin.menu.list} className="text-amber-700 font-medium hover:underline">agrega tu menú</Link>
                </div>
              )}
              <div className="flex-1 relative">
                {previewTenant ? (
                  <Suspense fallback={<div className="flex h-64 items-center justify-center" style={{ backgroundColor: editing.backgroundColor }}><Spinner size="sm" /></div>}>
                    <TemplatePreview tenant={previewTenant} menu={previewMenu} table={PREVIEW_TABLE} groups={previewGroups} tenantId={tenantId} />
                    
                    {/* Mock Cart Button for preview */}
                    {previewTenant.features.orderingEnabled && (
                      <div
                        className="fixed bottom-4 left-4 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, ${previewTenant.branding.primaryColor} 0%, ${previewTenant.branding.primaryColor}cc 100%)`,
                          boxShadow: `0 8px 24px ${previewTenant.branding.primaryColor}55`,
                          zIndex: 9999,
                        }}
                      >
                        <ShoppingBag size={22} />
                      </div>
                    )}
                  </Suspense>
                ) : (
                  <div className="flex h-64 items-center justify-center"><Spinner size="sm" /></div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div ref={phoneAreaRef} className={cn(
            "bg-surface-50 flex flex-col items-center justify-center py-6 px-4 gap-4 h-full rounded-r-xl border-l-0 border border-surface-200 shadow-[inset_4px_0_12px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 ease-in-out relative",
            isPreviewCollapsed ? "w-0 opacity-0 overflow-hidden border-0 shrink-0" : "flex-1"
          )}>
            {/* Elegant Phone Frame */}
            <div
              className="relative shrink-0 flex items-center justify-center drop-shadow-2xl"
              style={{ 
                width: Math.round(390 * phoneScale) + (12 * phoneScale), 
                height: Math.round(863 * phoneScale) + (12 * phoneScale),
              }}
            >
              {/* Outer metallic bezel */}
              <div 
                className="absolute inset-0 rounded-[44px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-black/5"
                style={{ 
                  borderRadius: 44 * phoneScale,
                  background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 20%, #4b5563 80%, #1f2937 100%)',
                  padding: 3 * phoneScale 
                }}
              >
                {/* Inner black bezel */}
                <div 
                  className="h-full w-full rounded-[40px] bg-black overflow-hidden relative"
                  style={{ 
                    borderRadius: 40 * phoneScale,
                    border: `${Math.max(4, Math.round(6 * phoneScale))}px solid #000` 
                  }}
                >
                  {/* Dynamic Island */}
                  <div 
                    className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-black rounded-full shadow-[inset_0_-1px_1px_rgba(255,255,255,0.1)] flex items-center justify-around px-2"
                    style={{ 
                      width: Math.round(110 * phoneScale), 
                      height: Math.round(30 * phoneScale),
                    }}
                  >
                    {/* Camera lens reflection */}
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-900/40 shadow-[0_0_2px_rgba(255,255,255,0.2)] ml-auto mr-1" />
                  </div>
                  
                  {/* Screen Content */}
                  <div className="h-full w-full bg-surface-0 relative rounded-[32px] overflow-hidden" style={{ borderRadius: 32 * phoneScale }}>
                    <iframe
                      ref={iframeRef}
                      src={`${menuPreviewUrl}?preview=true`}
                      title="Vista previa móvil"
                      className="border-0 phone-preview-scroll w-full h-full"
                      style={{
                        width: 390,
                        height: 863,
                        transform: `scale(${phoneScale})`,
                        transformOrigin: 'top left',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        background: editing.backgroundColor,
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Hardware buttons */}
              {/* Silent switch */}
              <div className="absolute left-0 top-[18%] bg-gradient-to-r from-surface-300 to-surface-400 rounded-l-md" style={{ width: 3 * phoneScale, height: 26 * phoneScale, left: -2 * phoneScale }} />
              {/* Vol up */}
              <div className="absolute left-0 top-[26%] bg-gradient-to-r from-surface-300 to-surface-400 rounded-l-md" style={{ width: 3 * phoneScale, height: 50 * phoneScale, left: -2 * phoneScale }} />
              {/* Vol down */}
              <div className="absolute left-0 top-[35%] bg-gradient-to-r from-surface-300 to-surface-400 rounded-l-md" style={{ width: 3 * phoneScale, height: 50 * phoneScale, left: -2 * phoneScale }} />
              {/* Power */}
              <div className="absolute right-0 top-[28%] bg-gradient-to-l from-surface-300 to-surface-400 rounded-r-md" style={{ width: 3 * phoneScale, height: 80 * phoneScale, right: -2 * phoneScale }} />
            </div>
            
            <div className="absolute bottom-4 flex items-center justify-center w-full">
              {realGroups.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-md border border-surface-200 px-4 py-2 rounded-full shadow-sm">
                  <p className="text-[10px] font-medium text-surface-500">
                    Ejemplo. Agrega tu menú en <Link to={ROUTES.admin.menu.list} className="text-brand-600 hover:text-brand-700 font-bold">Menús</Link>
                  </p>
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-md border border-surface-200 px-4 py-1.5 rounded-full shadow-sm flex items-center gap-2 text-[10px] text-surface-500 font-medium">
                  <Smartphone size={12} className="text-surface-400" />
                  Previsualización Móvil
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ── Móvil: editor de apariencia nativo a pantalla completa ────── */}
    <div className="md:hidden fixed inset-0 z-40">
      <AppearanceMobileShell preview={mobilePreview} tools={mobileTools} header={mobileHeader} />
    </div>
    </>
  )
}

// ── Sections Tab ───────────────────────────────────────────────────────────────

function SectionsPanel({
  editing, set, openSection, toggleSection, previewGroups, isPreviewCollapsed,
}: {
  editing: EditingState
  set: <K extends keyof EditingState>(k: K, v: EditingState[K]) => void
  openSection: string | null
  toggleSection: (id: string) => void
  previewGroups: import('@core/use-cases/menu/GetActiveDishesUseCase').DishesGroupedByCategory[]
  isPreviewCollapsed: boolean
}) {
  const socialCount = [editing.socials.instagram, editing.socials.facebook, editing.socials.tiktok, editing.socials.whatsapp].filter(Boolean).length

  return (
    <div className={cn(
      "grid gap-6 p-4 pb-12 items-start",
      isPreviewCollapsed ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4" : "grid-cols-1"
    )}>

      {/* ── IDENTIDAD ─────────────────────────────────────────────────── */}
      <SectionGroup label="Identidad">

        <SectionCard
          icon="🏠" iconBg="#fff7ed"
          title="Hero & Restaurante"
          preview={[editing.restaurantName, editing.tagline].filter(Boolean).join(' · ') || undefined}
          isOpen={openSection === 'hero'}
          onToggle={() => toggleSection('hero')}
        >
          <TextInput label="Nombre del restaurante" value={editing.restaurantName} onChange={(v) => set('restaurantName', v)} placeholder="Nombre" maxLength={60} />
          <TextInput label="Eslogan" value={editing.tagline} onChange={(v) => set('tagline', v)} placeholder="Lo mejor de la cocina tica…" maxLength={60} />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wide">Altura del hero</label>
            <TriPicker
              value={editing.heroHeight}
              onChange={(v) => set('heroHeight', v as 'compact' | 'normal' | 'tall')}
              options={[
                { value: 'compact', label: 'Bajo',   preview: <div className="h-2 w-full rounded bg-surface-300" /> },
                { value: 'normal',  label: 'Normal', preview: <div className="h-4 w-full rounded bg-surface-300" /> },
                { value: 'tall',    label: 'Alto',   preview: <div className="h-6 w-full rounded bg-surface-300" /> },
              ]}
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wide">Opacidad de portada</label>
              <span className="text-[10px] font-mono text-surface-400">{Math.round(editing.coverOpacity * 100)}%</span>
            </div>
            <input type="range" min={0.15} max={0.95} step={0.05} value={editing.coverOpacity}
              onChange={(e) => set('coverOpacity', parseFloat(e.target.value))}
              className="w-full accent-brand-500" />
          </div>
          <AssetUpload label="Logo" hint="PNG/WebP · cuadrado" aspect="aspect-square" preview={editing.logoPreview}
            onSelect={(f) => { set('logoFile', f); set('logoPreview', URL.createObjectURL(f)) }}
            onClear={() => { set('logoFile', null); set('logoPreview', null) }}
          />
          <AssetUpload label="Imagen/video de portada" hint="JPG/PNG/MP4 · 16:9" aspect="aspect-video" preview={editing.coverPreview}
            onSelect={(f) => { set('coverFile', f); set('coverPreview', URL.createObjectURL(f)) }}
            onClear={() => { set('coverFile', null); set('coverPreview', null) }}
          />
        </SectionCard>

        <SectionCard
          icon="📢" iconBg="#fef9c3"
          title="Barra de anuncio"
          preview={editing.announcement.enabled
            ? `${editing.announcement.emoji} ${editing.announcement.text}`
            : 'Mensaje en la parte superior del menú'}
          isOpen={openSection === 'announcement'}
          onToggle={() => toggleSection('announcement')}
          enableToggle
          enabled={editing.announcement.enabled}
          onEnable={(v) => set('announcement', { ...editing.announcement, enabled: v })}
        >
          <TextInput label="Texto del anuncio" value={editing.announcement.text}
            onChange={(v) => set('announcement', { ...editing.announcement, text: v })}
            placeholder="¡Bienvenidos! Descubre nuestro menú" maxLength={80} />
          <TextInput label="Emoji" value={editing.announcement.emoji}
            onChange={(v) => set('announcement', { ...editing.announcement, emoji: v })}
            placeholder="🎉" maxLength={4} />
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-surface-500 uppercase tracking-wide">Color de fondo</label>
            <p className="text-[10px] text-surface-400">Vacío = usa el color de acento del tema</p>
            <div className="flex items-center gap-2 rounded-xl border border-surface-200 bg-surface-0 px-3 py-2">
              <input type="color" value={editing.announcement.bgColor ?? '#000000'}
                onChange={(e) => set('announcement', { ...editing.announcement, bgColor: e.target.value })}
                className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0" />
              <input type="text" value={editing.announcement.bgColor ?? ''}
                onChange={(e) => set('announcement', { ...editing.announcement, bgColor: e.target.value || null })}
                placeholder="Dejar vacío para usar acento"
                className="flex-1 bg-transparent text-xs font-mono focus:outline-none text-surface-700 placeholder:text-surface-300" />
              {editing.announcement.bgColor && (
                <button onClick={() => set('announcement', { ...editing.announcement, bgColor: null })} className="text-surface-300 hover:text-surface-600">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </SectionCard>

      </SectionGroup>

      {/* ── ACCIONES ──────────────────────────────────────────────────── */}
      <SectionGroup label="Acciones">

        <SectionCard
          icon="🛍️" iconBg="#f0fdf4"
          title="Botón de pedidos"
          preview={editing.orderButton.enabled
            ? `"${editing.orderButton.label}" vía WhatsApp`
            : 'Botón flotante para ordenar por WhatsApp'}
          isOpen={openSection === 'orderButton'}
          onToggle={() => toggleSection('orderButton')}
          enableToggle
          enabled={editing.orderButton.enabled}
          onEnable={(v) => set('orderButton', { ...editing.orderButton, enabled: v })}
        >
          <ToggleRow
            label="Pedidos en línea (carrito)"
            description="Activa el carrito, el checkout con modo de entrega y los pedidos por WhatsApp"
            checked={editing.orderingEnabled}
            onChange={(v) => set('orderingEnabled', v)}
          />
          <p className="text-[10px] text-surface-400 leading-relaxed">El botón flotante de abajo abre WhatsApp con un mensaje de pedido predefinido (independiente del carrito).</p>
          <TextInput label="Texto del botón" value={editing.orderButton.label}
            onChange={(v) => set('orderButton', { ...editing.orderButton, label: v })}
            placeholder="Ordenar ahora" maxLength={30} />
          <TextInput label="Número de WhatsApp" value={editing.orderButton.whatsapp}
            onChange={(v) => set('orderButton', { ...editing.orderButton, whatsapp: v })}
            placeholder="+506 8888 8888" />

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-surface-600">Disposición</label>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { value: 'floating', label: 'Flotante' },
                { value: 'bar', label: 'Barra fija' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('orderButton', { ...editing.orderButton, variant: opt.value })}
                  className={cn(
                    'rounded-xl border p-2 text-center text-[10px] font-semibold transition-all',
                    (editing.orderButton.variant ?? 'floating') === opt.value
                      ? 'border-brand-400 bg-brand-50 text-brand-650 font-bold'
                      : 'border-surface-150 hover:border-surface-300 text-surface-400 bg-surface-0'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            label="Solo ícono"
            description="Mostrar únicamente el ícono de WhatsApp, sin texto"
            checked={editing.orderButton.iconOnly ?? false}
            onChange={(v) => set('orderButton', { ...editing.orderButton, iconOnly: v })}
          />
        </SectionCard>

        <SectionCard
          icon="📅" iconBg="#f0f9ff"
          title="Reservaciones"
          preview={editing.reservation.enabled
            ? editing.reservation.title
            : 'Sección para reservar mesa en línea'}
          isOpen={openSection === 'reservation'}
          onToggle={() => toggleSection('reservation')}
          enableToggle
          enabled={editing.reservation.enabled}
          onEnable={(v) => set('reservation', { ...editing.reservation, enabled: v })}
        >
          <TextInput label="Título de la sección" value={editing.reservation.title}
            onChange={(v) => set('reservation', { ...editing.reservation, title: v })}
            placeholder="Reserva tu mesa" maxLength={50} />
          <TextInput label="Teléfono para llamar" value={editing.reservation.phone}
            onChange={(v) => set('reservation', { ...editing.reservation, phone: v })}
            placeholder="+506 2222 2222" />
          <TextInput label="URL de reserva online" value={editing.reservation.bookingUrl}
            onChange={(v) => set('reservation', { ...editing.reservation, bookingUrl: v })}
            placeholder="https://…" />
          <TextInput label="Texto del botón" value={editing.reservation.buttonLabel}
            onChange={(v) => set('reservation', { ...editing.reservation, buttonLabel: v })}
            placeholder="Reservar ahora" maxLength={30} />
        </SectionCard>

        <SectionCard
          icon="🏷️" iconBg="#fdf2f8"
          title="Promoción especial"
          preview={editing.promo.enabled
            ? (editing.promo.title || 'Banner de promoción activo')
            : 'Banner con descuentos o eventos'}
          isOpen={openSection === 'promo'}
          onToggle={() => toggleSection('promo')}
          enableToggle
          enabled={editing.promo.enabled}
          onEnable={(v) => set('promo', { ...editing.promo, enabled: v })}
        >
          <p className="text-[10px] text-surface-400 leading-relaxed">Banner promocional visible al cliente con imagen, descripción y botón de acción.</p>
          <TextInput label="Título" value={editing.promo.title}
            onChange={(v) => set('promo', { ...editing.promo, title: v })}
            placeholder="¡Especial del mes!" maxLength={60} />
          <TextInput label="Descripción" value={editing.promo.description}
            onChange={(v) => set('promo', { ...editing.promo, description: v })}
            placeholder="2x1 en bebidas todos los viernes" maxLength={120} />
          <TextInput label="Texto del botón" value={editing.promo.ctaLabel}
            onChange={(v) => set('promo', { ...editing.promo, ctaLabel: v })}
            placeholder="Ver más" maxLength={30} />
          <TextInput label="Enlace del botón" value={editing.promo.ctaLink}
            onChange={(v) => set('promo', { ...editing.promo, ctaLink: v })}
            placeholder="https://…" />
        </SectionCard>

      </SectionGroup>

      {/* ── MENÚ ──────────────────────────────────────────────────────── */}
      <SectionGroup label="Menú">

        <SectionCard
          icon="📋" iconBg="#f5f3ff"
          title="Configuración del menú"
          preview={[
            editing.showPrices        && 'Precios ✓',
            editing.showSearch        && 'Búsqueda ✓',
            editing.showDietaryBadges && 'Etiquetas ✓',
          ].filter(Boolean).join(' · ') || 'Visibilidad y opciones del menú'}
          isOpen={openSection === 'menu'}
          onToggle={() => toggleSection('menu')}
        >
          <ToggleRow label="Mostrar precios" description="Precio visible en cada platillo" checked={editing.showPrices} onChange={(v) => set('showPrices', v)} />
          <ToggleRow label="Etiquetas dietéticas" description="Vegano, Sin gluten, Vegetariano" checked={editing.showDietaryBadges} onChange={(v) => set('showDietaryBadges', v)} />
          <ToggleRow label="Barra de búsqueda" description="El cliente puede filtrar platillos" checked={editing.showSearch} onChange={(v) => set('showSearch', v)} />
          <div className="border-t border-surface-100 pt-2.5">
            <label className="mb-2 block text-[11px] font-semibold text-surface-500 uppercase tracking-wide">Redondeo de imágenes</label>
            <QuadPicker
              value={editing.imageRounding}
              onChange={(v) => set('imageRounding', v as ImageRounding)}
              options={[
                { value: 'none', label: 'Recto',   preview: <div className="h-5 w-full bg-surface-200" style={{ borderRadius: '0px'  }} /> },
                { value: 'sm',   label: 'Leve',    preview: <div className="h-5 w-full bg-surface-200" style={{ borderRadius: '6px'  }} /> },
                { value: 'lg',   label: 'Redondo', preview: <div className="h-5 w-full bg-surface-200" style={{ borderRadius: '16px' }} /> },
                { value: 'xl',   label: 'Máximo',  preview: <div className="h-5 w-full bg-surface-200" style={{ borderRadius: '24px' }} /> },
              ]}
            />
          </div>

          <div className="border-t border-surface-100 pt-2.5 flex flex-col gap-3.5">
            <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Tarjeta de Selección (Variantes)</label>
            <ToggleRow label="Mostrar imágenes" description="Ver foto del plato al elegir opciones" checked={editing.detailsCardShowImage} onChange={(v) => set('detailsCardShowImage', v)} />
            
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-surface-600">Fondo de tarjeta</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'glass', label: 'Efecto Cristal' },
                  { value: 'solid', label: 'Color Sólido' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('detailsCardStyle', opt.value as 'glass' | 'solid')}
                    className={cn(
                      'rounded-xl border p-2 text-center text-[10px] font-semibold transition-all',
                      editing.detailsCardStyle === opt.value
                        ? 'border-brand-400 bg-brand-50 text-brand-650 font-bold'
                        : 'border-surface-150 hover:border-surface-300 text-surface-400 bg-surface-0'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-surface-600">Estilo de opciones</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'list', label: 'Lista Clásica' },
                  { value: 'pills', label: 'Botones/Pills' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('detailsCardOptionStyle', opt.value as 'list' | 'pills')}
                    className={cn(
                      'rounded-xl border p-2 text-center text-[10px] font-semibold transition-all',
                      editing.detailsCardOptionStyle === opt.value
                        ? 'border-brand-400 bg-brand-50 text-brand-650 font-bold'
                        : 'border-surface-150 hover:border-surface-300 text-surface-400 bg-surface-0'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon="⭐" iconBg="#fffbeb"
          title="Platos destacados"
          preview={editing.featuredSection.enabled
            ? `"${editing.featuredSection.title}" — carrusel al inicio`
            : 'Carrusel horizontal de tus mejores platos'}
          isOpen={openSection === 'featured'}
          onToggle={() => toggleSection('featured')}
          enableToggle
          enabled={editing.featuredSection.enabled}
          onEnable={(v) => set('featuredSection', { ...editing.featuredSection, enabled: v })}
        >
          <TextInput label="Título de la sección" value={editing.featuredSection.title}
            onChange={(v) => set('featuredSection', { ...editing.featuredSection, title: v })}
            placeholder="Nuestros favoritos" maxLength={40} />
          <FeaturedDishPicker
            allDishes={previewGroups.flatMap((g) => g.dishes)}
            selectedIds={editing.featuredSection.dishIds}
            onChange={(ids) => set('featuredSection', { ...editing.featuredSection, dishIds: ids })}
          />
        </SectionCard>

      </SectionGroup>

      {/* ── CONTACTO ──────────────────────────────────────────────────── */}
      <SectionGroup label="Contacto">

        <SectionCard
          icon="🔗" iconBg="#f5f3ff"
          title="Redes sociales"
          preview={editing.socials.enabled
            ? (socialCount > 0
                ? `${socialCount} red${socialCount !== 1 ? 'es' : ''} configurada${socialCount !== 1 ? 's' : ''}`
                : 'Sin redes configuradas aún')
            : 'Instagram, TikTok, Facebook, WhatsApp'}
          isOpen={openSection === 'socials'}
          onToggle={() => toggleSection('socials')}
          enableToggle
          enabled={editing.socials.enabled}
          onEnable={(v) => set('socials', { ...editing.socials, enabled: v })}
        >
          <TextInput label="Instagram" value={editing.socials.instagram} onChange={(v) => set('socials', { ...editing.socials, instagram: v })} placeholder="@mirestaurante" />
          <TextInput label="TikTok"    value={editing.socials.tiktok}    onChange={(v) => set('socials', { ...editing.socials, tiktok:    v })} placeholder="@mirestaurante" />
          <TextInput label="Facebook"  value={editing.socials.facebook}  onChange={(v) => set('socials', { ...editing.socials, facebook:  v })} placeholder="facebook.com/mirestaurante" />
          <TextInput label="WhatsApp"  value={editing.socials.whatsapp}  onChange={(v) => set('socials', { ...editing.socials, whatsapp:  v })} placeholder="+506 8888 8888" />
        </SectionCard>

        <SectionCard
          icon="ℹ️" iconBg="#eff6ff"
          title="Información del local"
          preview={editing.infoFooter.enabled
            ? ([editing.infoFooter.hours, editing.infoFooter.address].filter(Boolean)[0] ?? 'Información configurada')
            : 'Horarios, dirección y teléfono'}
          isOpen={openSection === 'infoFooter'}
          onToggle={() => toggleSection('infoFooter')}
          enableToggle
          enabled={editing.infoFooter.enabled}
          onEnable={(v) => set('infoFooter', { ...editing.infoFooter, enabled: v })}
        >
          <TextInput label="Horarios"  value={editing.infoFooter.hours}    onChange={(v) => set('infoFooter', { ...editing.infoFooter, hours:   v })} placeholder="Lun–Dom: 11am – 10pm" />
          <TextInput label="Dirección" value={editing.infoFooter.address}  onChange={(v) => set('infoFooter', { ...editing.infoFooter, address: v })} placeholder="Calle 5, San José" />
          <TextInput label="Teléfono"  value={editing.infoFooter.phone}    onChange={(v) => set('infoFooter', { ...editing.infoFooter, phone:   v })} placeholder="+506 2222 2222" />
          <TextInput label="Link de Waze" value={editing.infoFooter.wazeUrl} onChange={(v) => set('infoFooter', { ...editing.infoFooter, wazeUrl: v })} placeholder="https://waze.com/ul/..." />
          <TextInput label="Link de Google Maps" value={editing.infoFooter.googleMapsUrl} onChange={(v) => set('infoFooter', { ...editing.infoFooter, googleMapsUrl: v })} placeholder="https://maps.app.goo.gl/..." />
        </SectionCard>

      </SectionGroup>

    </div>
  )
}

// ── Appearance Template Picker ────────────────────────────────────────────────

function AppearanceTemplateTrigger({
  currentTemplateId,
  onSelect,
}: {
  currentTemplateId: TemplateId
  onSelect: (id: TemplateId) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const templates = Object.values(TEMPLATE_DEFINITIONS) as (typeof TEMPLATE_DEFINITIONS)[TemplateId][]
  const current = TEMPLATE_DEFINITIONS[currentTemplateId]

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white text-left transition-all duration-300 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        {/* Banner with gradient or current template colors */}
        <div 
          className="h-16 w-full relative transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundColor: current?.previewBg ?? '#1e293b' }}
        >
          {current && (
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/30 to-transparent" />
          )}
          {current && (
            <div 
              className="absolute -bottom-3 left-4 h-6 w-14 rounded-full border-[3px] border-white shadow-sm transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: current.previewAccent }}
            />
          )}
        </div>
        
        {/* Card Body */}
        <div className="flex items-center justify-between px-4 pb-4 pt-5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-extrabold tracking-widest text-brand-500 uppercase">Plantilla Activa</span>
            <span className="text-[15px] font-bold text-surface-900 leading-none mt-1">{current?.name ?? 'Seleccionar plantilla'}</span>
            {current && <span className="text-[10px] text-surface-500 mt-1 font-medium">{current.tags.join(' • ')}</span>}
          </div>
          <div className="flex shrink-0 items-center justify-center h-8 px-3.5 rounded-lg bg-surface-100/80 text-[11px] font-bold text-surface-700 transition-colors group-hover:bg-brand-50 group-hover:text-brand-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
            Cambiar ({templates.length})
          </div>
        </div>
      </button>

      <p className="text-[10px] text-surface-400 mt-0.5 px-1">Cambiar la plantilla sobrescribirá los colores por defecto.</p>

      {/* Full-screen modal */}
      {isOpen && (
        <AppearanceTemplateModal
          currentTemplateId={currentTemplateId}
          onSelect={(id) => { onSelect(id); setIsOpen(false) }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

function AppearanceTemplateModal({
  currentTemplateId,
  onSelect,
  onClose,
}: {
  currentTemplateId: TemplateId
  onSelect: (id: TemplateId) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const templates = Object.values(TEMPLATE_DEFINITIONS) as (typeof TEMPLATE_DEFINITIONS)[TemplateId][]

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = query === ''
    ? templates
    : templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
      )

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)' }}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-6 border-b border-surface-200 bg-white px-8 py-5 shadow-sm relative z-20">
        <div className="flex-1">
          <h2 className="text-xl font-black text-surface-900 tracking-tight">Galería de plantillas</h2>
          <p className="mt-1 text-[12px] font-medium text-surface-500">{templates.length} diseños listos para usar</p>
        </div>
        <div className="relative flex items-center">
          <Search size={14} className="pointer-events-none absolute left-3.5 text-surface-400" />
          <input
            autoFocus
            type="text"
            placeholder="Buscar plantilla..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-64 rounded-xl border border-surface-200 bg-surface-50 pl-9 pr-4 text-sm text-surface-800 placeholder-surface-400 outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
          />
        </div>
        <button
          onClick={onClose}
          title="Cerrar (Esc)"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-800"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto bg-surface-50 p-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-32 text-surface-400">
            <Search size={40} strokeWidth={1.5} className="text-surface-300" />
            <p className="text-base font-medium">Sin resultados para "{query}"</p>
            <button
              onClick={() => setQuery('')}
              className="mt-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-surface-700 shadow-sm border border-surface-200 hover:bg-surface-50 hover:text-surface-900"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 max-w-[1600px] mx-auto w-full">
            {filtered.map((tmpl) => {
              const isActive = tmpl.id === currentTemplateId
              return (
                <button
                  key={tmpl.id}
                  onClick={() => onSelect(tmpl.id as TemplateId)}
                  className={cn(
                    'group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300',
                    isActive
                      ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-lg scale-[1.02] z-10'
                      : 'border-surface-200 bg-white hover:border-brand-300 hover:shadow-xl hover:-translate-y-1',
                  )}
                >
                  {/* Color preview thumbnail */}
                  <div
                    className="relative h-32 w-full transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundColor: tmpl.previewBg }}
                  >
                    {/* Simulated elegant menu skeleton */}
                    <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end gap-2 p-4 bg-gradient-to-t from-black/40 to-transparent h-full">
                      <div className="h-2 w-1/3 rounded-full shadow-sm" style={{ backgroundColor: tmpl.previewAccent }} />
                      <div className="h-1.5 w-3/4 rounded-full opacity-70" style={{ backgroundColor: tmpl.previewAccent }} />
                      <div className="flex gap-2 mt-1">
                        <div className="h-1.5 w-1/4 rounded-full opacity-40" style={{ backgroundColor: tmpl.previewAccent }} />
                        <div className="h-1.5 w-1/4 rounded-full opacity-40" style={{ backgroundColor: tmpl.previewAccent }} />
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
                        <CheckCircle2 size={12} strokeWidth={3} />
                        Activa
                      </div>
                    )}
                  </div>

                  {/* Name + tags */}
                  <div className="flex flex-col gap-1 bg-white p-4 relative z-10">
                    <p className={cn('text-[13px] font-bold leading-tight truncate', isActive ? 'text-brand-700' : 'text-surface-900')}>
                      {tmpl.name}
                    </p>
                    <p className="text-[10px] text-surface-500 font-medium truncate">{tmpl.tags.join(' • ')}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Theme Tab ──────────────────────────────────────────────────────────────────

function ThemePanel({
  editing, set, handleTemplateSelect, isPreviewCollapsed, only,
}: {
  editing: EditingState
  set: <K extends keyof EditingState>(k: K, v: EditingState[K]) => void
  handleTemplateSelect: (id: TemplateId) => void
  isPreviewCollapsed: boolean
  only?: 'template' | 'colors' | 'gradient' | 'typography' | 'style'
}) {
  const show = (key: NonNullable<typeof only>): boolean => only === undefined || only === key
  return (
    <div className={cn(
      "grid gap-6 p-4 pb-12 items-start",
      isPreviewCollapsed ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
    )}>

      {/* Template */}
      <section className={cn('flex-col gap-3', show('template') ? 'flex' : 'hidden')}>
        <SectionLabel icon={<LayoutGrid size={12} />}>Plantilla</SectionLabel>
        <AppearanceTemplateTrigger
          currentTemplateId={editing.templateId}
          onSelect={handleTemplateSelect}
        />
      </section>

      {/* Colors */}
      <section className={cn('flex-col gap-3', show('colors') ? 'flex' : 'hidden')}>
        <SectionLabel icon={<Palette size={12} />}>Colores</SectionLabel>

        {/* Palette presets */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-medium text-surface-700">Paletas prediseñadas</label>
          <div className="grid grid-cols-5 gap-2.5">
            {COLOR_PALETTES.map((p) => {
              const isActive = editing.primaryColor === p.primary && editing.backgroundColor === p.bg
              return (
                <button
                  type="button"
                  key={p.name}
                  title={p.name}
                  onClick={() => { set('primaryColor', p.primary); set('backgroundColor', p.bg) }}
                  className={cn(
                    'group relative flex flex-col h-14 w-full rounded-xl overflow-hidden transition-all duration-200 border', 
                    isActive 
                      ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md scale-110 z-10' 
                      : 'border-surface-200 hover:border-brand-300 hover:shadow-sm'
                  )}
                >
                  <div className="flex-1 w-full transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: p.bg }} />
                  <div className="h-3.5 w-full flex-shrink-0 shadow-[0_-1px_2px_rgba(0,0,0,0.1)]" style={{ backgroundColor: p.primary }} />
                  {isActive && (
                    <div className="absolute top-1 right-1 h-3.5 w-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <CheckCircle2 size={10} className="text-brand-600" strokeWidth={3} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-surface-400 px-1">Click para aplicar. Luego ajusta a tu gusto abajo.</p>
        </div>

        <ColorField label="Color de acento" hint="Botones y destacados" value={editing.primaryColor} onChange={(v) => set('primaryColor', v)} />
        <ColorField label="Color de fondo" hint="Fondo del menú" value={editing.backgroundColor} onChange={(v) => set('backgroundColor', v)} />
      </section>

      {/* Gradient */}
      <section className={cn('flex-col gap-3', show('gradient') ? 'flex' : 'hidden')}>
        <div className="flex items-center justify-between">
          <SectionLabel icon={<GripHorizontal size={12} />}>Fondo gradiente</SectionLabel>
          <button
            type="button"
            onClick={() => set('bgGradient', { ...editing.bgGradient, enabled: !editing.bgGradient.enabled })}
            className={cn('relative h-4 w-7 rounded-full transition-all duration-200', editing.bgGradient.enabled ? 'bg-brand-500' : 'bg-surface-300')}
          >
            <div className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200', editing.bgGradient.enabled ? 'translate-x-3.5' : 'translate-x-0.5')} />
          </button>
        </div>
        {editing.bgGradient.enabled && (
          <>
            <ColorField label="Color inicial" hint="Desde" value={editing.bgGradient.from} onChange={(v) => set('bgGradient', { ...editing.bgGradient, from: v })} />
            <ColorField label="Color final" hint="Hasta" value={editing.bgGradient.to} onChange={(v) => set('bgGradient', { ...editing.bgGradient, to: v })} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-surface-700">Dirección</label>
              <TriPicker
                value={editing.bgGradient.direction}
                onChange={(v) => set('bgGradient', { ...editing.bgGradient, direction: v as '180deg' | '135deg' | '90deg' })}
                options={[
                  { value: '180deg', label: 'Vertical', preview: <div className="h-5 w-full rounded-md" style={{ background: `linear-gradient(180deg, ${editing.bgGradient.from}, ${editing.bgGradient.to})` }} /> },
                  { value: '135deg', label: 'Diagonal', preview: <div className="h-5 w-full rounded-md" style={{ background: `linear-gradient(135deg, ${editing.bgGradient.from}, ${editing.bgGradient.to})` }} /> },
                  { value: '90deg', label: 'Horizontal', preview: <div className="h-5 w-full rounded-md" style={{ background: `linear-gradient(90deg, ${editing.bgGradient.from}, ${editing.bgGradient.to})` }} /> },
                ]}
              />
            </div>
          </>
        )}
        {!editing.bgGradient.enabled && (
          <p className="text-[10px] text-surface-400 -mt-1">Activa para usar un gradiente como fondo en lugar de un color sólido.</p>
        )}
      </section>

      {/* Typography */}
      <section className={cn('flex-col gap-4 mt-2', show('typography') ? 'flex' : 'hidden')}>
        <SectionLabel icon={<Type size={14} className="text-brand-500" />}>Tipografía</SectionLabel>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-surface-800">Fuente tipográfica</label>
          <div className="relative">
            <select
              value={editing.fontFamily}
              onChange={(e) => set('fontFamily', e.target.value)}
              className="w-full appearance-none rounded-xl border border-surface-200 bg-white px-4 py-3.5 text-sm font-semibold text-surface-900 shadow-sm transition-all hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 cursor-pointer"
              style={{ fontFamily: editing.fontFamily, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 16px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px' }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-surface-800">Tamaño base de la letra</label>
          <TriPicker
            value={editing.textScale}
            onChange={(v) => set('textScale', v as 'sm' | 'md' | 'lg')}
            options={[
              { value: 'sm', label: 'Pequeño', preview: <span className="text-xs font-black">Aa</span> },
              { value: 'md', label: 'Normal', preview: <span className="text-base font-black">Aa</span> },
              { value: 'lg', label: 'Grande', preview: <span className="text-xl font-black">Aa</span> },
            ]}
          />
        </div>
      </section>

      {/* Style */}
      <section className={cn('flex-col gap-4 mt-4', show('style') ? 'flex' : 'hidden')}>
        <SectionLabel icon={<LayoutGrid size={14} className="text-brand-500" />}>Estilo de componentes</SectionLabel>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-surface-800">Bordes de tarjetas</label>
          <TriPicker
            value={editing.cardStyle}
            onChange={(v) => set('cardStyle', v as 'sharp' | 'rounded' | 'pill')}
            options={[
              { value: 'sharp', label: 'Recto', preview: <div className="h-8 w-12 border-[2.5px] border-current" style={{ borderRadius: '4px' }} /> },
              { value: 'rounded', label: 'Redondo', preview: <div className="h-8 w-12 border-[2.5px] border-current" style={{ borderRadius: '12px' }} /> },
              { value: 'pill', label: 'Cápsula', preview: <div className="h-8 w-12 border-[2.5px] border-current" style={{ borderRadius: '24px' }} /> },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-surface-800">Profundidad (Sombras)</label>
          <TriPicker
            value={editing.shadowDepth}
            onChange={(v) => set('shadowDepth', v as 'flat' | 'soft' | 'deep')}
            options={[
              { value: 'flat', label: 'Plano', preview: <div className="h-8 w-12 rounded-lg bg-surface-100 border border-surface-200" style={{ boxShadow: 'none' }} /> },
              { value: 'soft', label: 'Suave', preview: <div className="h-8 w-12 rounded-lg bg-white border border-surface-100" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} /> },
              { value: 'deep', label: 'Intenso', preview: <div className="h-8 w-12 rounded-lg bg-white" style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1)' }} /> },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-surface-800">Imágenes y fotos</label>
          <QuadPicker
            value={editing.imageRounding}
            onChange={(v) => set('imageRounding', v as ImageRounding)}
            options={[
              { value: 'none', label: 'Recto', preview: <div className="h-8 w-8 bg-current" style={{ borderRadius: '0px' }} /> },
              { value: 'sm', label: 'Leve', preview: <div className="h-8 w-8 bg-current" style={{ borderRadius: '6px' }} /> },
              { value: 'lg', label: 'Redondo', preview: <div className="h-8 w-8 bg-current" style={{ borderRadius: '16px' }} /> },
              { value: 'xl', label: 'Círculo', preview: <div className="h-8 w-8 bg-current" style={{ borderRadius: '24px' }} /> },
            ]}
          />
        </div>
      </section>

      <div className="h-4" />
    </div>
  )
}

// ── SectionGroup ──────────────────────────────────────────────────────────────

function SectionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-0.5">
        <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.18em] text-surface-350">
          {label}
        </span>
        <div className="h-px flex-1 bg-surface-100" />
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

// ── SectionCard ───────────────────────────────────────────────────────────────

function SectionCard({
  icon, iconBg, title, preview,
  isOpen, onToggle,
  enableToggle, enabled, onEnable,
  locked,
  children,
}: {
  icon: string
  iconBg: string
  title: string
  preview?: string
  isOpen: boolean
  onToggle: () => void
  enableToggle?: boolean
  enabled?: boolean
  onEnable?: (v: boolean) => void
  locked?: boolean
  children: ReactNode
}) {
  const isOff = (enableToggle && !enabled && !locked) || (locked && !enabled)
  const isSwitchOn = enabled || locked
  
  useEffect(() => {
    if (locked && !enabled && onEnable) onEnable(true)
  }, [locked, enabled, onEnable])

  return (
    <div
      className={cn(
        'group overflow-hidden rounded-2xl border bg-white transition-all duration-300 relative',
        isOpen
          ? 'border-brand-400 ring-4 ring-brand-500/10 shadow-lg scale-[1.01] z-10'
          : 'border-surface-200 hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5',
        (enableToggle || locked) && !isSwitchOn && !isOpen && 'opacity-75 bg-surface-50'
      )}
    >
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
        className={cn(
          'flex w-full cursor-pointer select-none items-center gap-4 px-4 py-3.5 outline-none transition-colors duration-300',
          isOpen ? 'bg-brand-50/40' : 'bg-transparent'
        )}
      >
        {/* Emoji icon bubble */}
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg shadow-sm transition-transform duration-300", 
            !isOff && "group-hover:scale-110",
            isOff && 'grayscale-[0.5] opacity-80'
          )}
          style={{ background: iconBg }}
        >
          {icon}
        </div>

        {/* Title + preview */}
        <div className="min-w-0 flex-1">
          <p className={cn(
            'text-[13px] font-bold leading-tight transition-colors',
            isOpen ? 'text-brand-700' : 'text-surface-900',
            isOff && !isOpen && 'text-surface-500'
          )}>
            {title}
          </p>
          {preview && !isOpen && (
            <p className="mt-0.5 truncate text-[10px] leading-tight text-surface-400">
              {preview}
            </p>
          )}
        </div>

        {/* Enabled/disabled toggle */}
        {(enableToggle || locked) && onEnable && (
          <div
            role="button"
            tabIndex={locked ? -1 : 0}
            onClick={(e) => { 
              e.stopPropagation()
              if (locked) return
              onEnable(!enabled) 
            }}
            className={cn(
              'relative shrink-0 h-[26px] w-[46px] rounded-full transition-colors duration-300 shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)] mr-1',
              isSwitchOn ? 'bg-brand-500' : 'bg-surface-200 hover:bg-surface-300',
              locked && 'opacity-80 cursor-not-allowed hover:bg-brand-500'
            )}
            title={locked ? "Módulo Premium incluido gratuitamente" : ""}
          >
            {locked && <span className="absolute inset-0 flex items-center justify-center text-[10px] pr-[18px]">💎</span>}
            <div className={cn(
              'absolute top-[3px] left-0 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-300 flex items-center justify-center',
              isSwitchOn ? 'translate-x-[23px]' : 'translate-x-[3px]',
              locked && 'opacity-90'
            )}>
              {locked && <span className="text-[10px] leading-none mb-[1px]">🔒</span>}
            </div>
          </div>
        )}

        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={cn(
            'shrink-0 transition-transform duration-200',
            isOpen ? 'rotate-180 text-brand-400' : 'text-surface-300',
          )}
        />
      </div>

      {/* Body */}
      {isOpen && (
        <div className={cn(
          "border-t border-surface-100 bg-white px-4 py-4 transition-opacity duration-300",
          isOff && 'opacity-40 pointer-events-none select-none bg-surface-50'
        )}>
          {isOff && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-surface-200/50 p-2.5 text-surface-600">
              <span className="text-[16px]">💡</span>
              <p className="text-[11px] font-bold">Sección desactivada. Enciéndela para configurar.</p>
            </div>
          )}
          <div className="flex flex-col gap-3.5">{children}</div>
        </div>
      )}
    </div>
  )
}

// ── TriPicker ─────────────────────────────────────────────────────────────────

function TriPicker({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; preview: ReactNode }[]
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((opt) => {
        const isActive = value === opt.value
        return (
          <button
            type="button"
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'group relative flex flex-col items-center gap-3 rounded-2xl border p-3 transition-all duration-300',
              isActive 
                ? 'border-brand-500 bg-brand-50/60 ring-4 ring-brand-500/10 shadow-sm scale-[1.02] z-10' 
                : 'border-surface-200 bg-white hover:border-brand-300 hover:bg-surface-50 hover:shadow-md hover:-translate-y-0.5'
            )}
          >
            <div className={cn("w-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105", isActive ? "text-brand-500" : "text-surface-300 group-hover:text-surface-400")}>
               {opt.preview}
            </div>
            <span className={cn('text-[11px] font-bold leading-none transition-colors mt-1', isActive ? 'text-brand-700' : 'text-surface-500 group-hover:text-surface-700')}>{opt.label}</span>
            {isActive && (
              <div className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-brand-500 rounded-full flex items-center justify-center shadow-sm text-white">
                <CheckCircle2 size={10} strokeWidth={3.5} />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── QuadPicker (4 options, 2×2 grid) ──────────────────────────────────────────

function QuadPicker({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; preview: ReactNode }[]
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {options.map((opt) => {
        const isActive = value === opt.value
        return (
          <button
            type="button"
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'group relative flex flex-col items-center gap-2 rounded-2xl border p-2 transition-all duration-300',
              isActive 
                ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20 shadow-sm scale-[1.02] z-10' 
                : 'border-surface-200 bg-white hover:border-brand-300 hover:bg-surface-50 hover:shadow-md hover:-translate-y-0.5'
            )}
          >
            <div className={cn("w-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105", isActive ? "text-brand-500" : "text-surface-300 group-hover:text-surface-400")}>
               {opt.preview}
            </div>
            <span className={cn('text-[10px] font-bold leading-none text-center transition-colors', isActive ? 'text-brand-700' : 'text-surface-500 group-hover:text-surface-700')}>{opt.label}</span>
            {isActive && (
              <div className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-brand-500 rounded-full flex items-center justify-center shadow-sm text-white">
                <CheckCircle2 size={10} strokeWidth={3.5} />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-surface-400">{icon}</span>
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-surface-500">{children}</h2>
    </div>
  )
}

function TextInput({ label, value, onChange, placeholder, maxLength }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-surface-600">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-lg border border-surface-200 bg-surface-0 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-surface-300"
      />
    </div>
  )
}

function ColorField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-surface-700">{label}</label>
        <span className="text-[10px] text-surface-400">{hint}</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-surface-200 bg-surface-0 px-3 py-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 text-sm font-mono bg-transparent focus:outline-none text-surface-800" maxLength={7} placeholder="#000000" />
      </div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200",
        checked 
          ? "border-brand-300 bg-brand-50 hover:bg-brand-100/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" 
          : "border-surface-200 bg-surface-50 hover:bg-surface-100 hover:border-surface-300"
      )}
    >
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className={cn("text-[13px] font-bold", checked ? "text-brand-900" : "text-surface-800")}>{label}</span>
        <span className={cn("text-[11px] leading-relaxed", checked ? "text-brand-700/80" : "text-surface-500")}>{description}</span>
      </div>
      <div
        className={cn('relative shrink-0 h-6 w-11 rounded-full transition-all duration-300 shadow-inner', checked ? 'bg-brand-500' : 'bg-surface-300')}
      >
        <div className={cn('absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-out', checked ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
      </div>
    </button>
  )
}

function AssetUpload({ label, hint, aspect, preview, onSelect, onClear }: {
  label: string; hint: string; aspect: string; preview: string | null
  onSelect: (f: File) => void; onClear: () => void
}) {
  const isVideo = preview ? /\.(mp4|webm|mov)/i.test(preview) : false
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-surface-600">{label}</label>
        {preview && (
          <button type="button" onClick={onClear} className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-0.5">
            <X size={9} />Quitar
          </button>
        )}
      </div>
      {preview ? (
        <div className={cn('overflow-hidden rounded-xl border border-surface-200', aspect)}>
          {isVideo
            ? <video src={preview} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            : <img src={preview} alt={label} className="h-full w-full object-cover" />
          }
        </div>
      ) : (
        <label className={cn('flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-200 bg-surface-50 transition-colors hover:border-brand-300 hover:bg-brand-50', aspect)}>
          <Upload size={16} className="text-surface-400" />
          <span className="text-[10px] text-surface-400 text-center px-2">{hint}</span>
          <input type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f) }} />
        </label>
      )}
    </div>
  )
}


// ── FeaturedDishPicker ─────────────────────────────────────────────────────────


const MAX_FEATURED = 6

function FeaturedDishPicker({
  allDishes,
  selectedIds,
  onChange,
}: {
  allDishes: Dish[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else if (selectedIds.length < MAX_FEATURED) {
      onChange([...selectedIds, id])
    }
  }

  if (allDishes.length === 0) {
    return (
      <p className="text-[10px] text-surface-400 leading-relaxed">
        Agrega platos a tu menú para poder destacarlos aquí.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-surface-600">Elige hasta {MAX_FEATURED} platos</p>
        <span className="text-[10px] text-surface-400">{selectedIds.length}/{MAX_FEATURED}</span>
      </div>

      <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
        {allDishes.map((dish) => {
          const isSelected = selectedIds.includes(dish.id)
          const isDisabled = !isSelected && selectedIds.length >= MAX_FEATURED
          return (
            <button
              key={dish.id}
              type="button"
              disabled={isDisabled}
              onClick={() => toggle(dish.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left text-xs transition-all',
                isSelected
                  ? 'border-brand-300 bg-brand-50'
                  : isDisabled
                  ? 'border-surface-100 bg-surface-0 opacity-40 cursor-not-allowed'
                  : 'border-surface-150 bg-surface-0 hover:border-surface-300',
              )}
            >
              {/* Thumbnail or placeholder */}
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-surface-100 bg-surface-100">
                {dish.assets.imageUrl ? (
                  <img
                    src={dish.assets.imageUrl}
                    alt={dish.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[14px]">🍽</div>
                )}
              </div>
              <span className={cn(
                'flex-1 truncate font-medium',
                isSelected ? 'text-brand-700' : 'text-surface-700',
              )}>
                {dish.name}
              </span>
              <div className={cn(
                'h-4 w-4 shrink-0 rounded border-2 transition-all',
                isSelected ? 'border-brand-500 bg-brand-500' : 'border-surface-300',
              )}>
                {isSelected && (
                  <svg viewBox="0 0 10 10" className="h-full w-full" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selectedIds.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-[10px] text-surface-400 hover:text-red-500 transition-colors text-left"
        >
          Quitar selección
        </button>
      )}
    </div>
  )
}
