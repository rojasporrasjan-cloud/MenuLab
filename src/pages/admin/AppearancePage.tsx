import { useState, useEffect, useMemo, Suspense, type ReactNode } from 'react'
import {
  CheckCircle2, ExternalLink, Smartphone, Monitor,
  ChevronDown, Palette, Type, LayoutGrid, Upload, X,
  GripHorizontal, Sparkles, Search,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@shared/utils/cn'
import { useTenantContext } from '@app/providers/TenantProvider'
import { Button } from '@shared/ui/components/Button'
import { Spinner } from '@shared/ui/components/Spinner'
import { ROUTES } from '@shared/constants/routes'
import { TEMPLATE_DEFINITIONS, TEMPLATE_DEFAULT_BRANDING, getTemplateComponent } from '@features/templates'
import { useUpdateAppearance } from '@features/settings/hooks/useUpdateAppearance'
import { isValidHex } from '@shared/utils/colorScale'
import { FONT_OPTIONS } from '@core/domain/entities/Tenant'
import { useAdminMenus } from '@features/menus'
import { useActiveDishes } from '@features/menu'
import type { TemplateId, TenantAnnouncement, TenantSocials, TenantInfoFooter, TenantOrderButton, TenantBgGradient, TenantReservation, TenantPromo, TenantFeatured, ImageRounding } from '@core/domain/entities/Tenant'
import type { Tenant } from '@core/domain/entities/Tenant'
import type { Menu } from '@core/domain/entities/Menu'
import type { Table } from '@core/domain/entities/Table'
import type { DishesGroupedByCategory } from '@core/use-cases/menu/GetActiveDishesUseCase'
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

const MOCK_GROUPS: DishesGroupedByCategory[] = [
  {
    category: { id: 'c1', menuId: 'preview', tenantId: 'preview', name: 'Entradas', description: null, imageUrl: null, sortOrder: 0 },
    dishes: [
      { id: 'd1', tenantId: 'preview', menuId: 'preview', categoryId: 'c1', name: 'Ceviche de Corvina', description: 'Fresco y delicioso', price: { amount: 8500, currency: 'CRC' }, status: 'available', assets: { imageUrl: null, thumbnailUrl: null, modelGlbUrl: null, modelUsdzUrl: null, hasAR: false }, nutrition: { calories: null, allergens: [], isVegetarian: false, isVegan: false, isGlutenFree: false }, tags: [], variantGroups: [], sortOrder: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 'd2', tenantId: 'preview', menuId: 'preview', categoryId: 'c1', name: 'Patacones con Guacamole', description: 'Crujientes y sabrosos', price: { amount: 4500, currency: 'CRC' }, status: 'available', assets: { imageUrl: null, thumbnailUrl: null, modelGlbUrl: null, modelUsdzUrl: null, hasAR: false }, nutrition: { calories: null, allergens: [], isVegetarian: true, isVegan: true, isGlutenFree: true }, tags: [], variantGroups: [], sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
    ],
  },
  {
    category: { id: 'c2', menuId: 'preview', tenantId: 'preview', name: 'Platos Fuertes', description: null, imageUrl: null, sortOrder: 1 },
    dishes: [
      { id: 'd3', tenantId: 'preview', menuId: 'preview', categoryId: 'c2', name: 'Casado de Pollo', description: 'Con arroz, frijoles y ensalada', price: { amount: 6500, currency: 'CRC' }, status: 'available', assets: { imageUrl: null, thumbnailUrl: null, modelGlbUrl: null, modelUsdzUrl: null, hasAR: false }, nutrition: { calories: null, allergens: [], isVegetarian: false, isVegan: false, isGlutenFree: false }, tags: [], variantGroups: [], sortOrder: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 'd4', tenantId: 'preview', menuId: 'preview', categoryId: 'c2', name: 'Filete de Pescado', description: 'Con vegetales al vapor', price: { amount: 9500, currency: 'CRC' }, status: 'available', assets: { imageUrl: null, thumbnailUrl: null, modelGlbUrl: null, modelUsdzUrl: null, hasAR: false }, nutrition: { calories: null, allergens: ['pescado'], isVegetarian: false, isVegan: false, isGlutenFree: true }, tags: [], variantGroups: [], sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
    ],
  },
]

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
  // Page sections
  announcement: TenantAnnouncement
  socials: TenantSocials
  infoFooter: TenantInfoFooter
  orderButton: TenantOrderButton
  reservation: TenantReservation
  promo: TenantPromo
  featuredSection: TenantFeatured
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AppearancePage() {
  const { tenant, tenantId } = useTenantContext()
  const { save, isLoading, error, success } = useUpdateAppearance(tenantId)
  const { data: menus } = useAdminMenus(tenantId)

  const firstMenuId = menus?.[0]?.id ?? null
  const { groups: realGroups } = useActiveDishes(tenantId, firstMenuId ?? '', menus?.[0]?.categoryOrder ?? [])
  const previewGroups = realGroups.length > 0 ? realGroups : MOCK_GROUPS

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
    announcement: tenant?.branding.announcement ?? { enabled: false, text: '¡Bienvenidos! Descubre nuestro menú', emoji: '🎉', bgColor: null },
    socials: tenant?.branding.socials ?? { enabled: false, instagram: '', facebook: '', tiktok: '', whatsapp: '' },
    infoFooter: tenant?.branding.infoFooter ?? { enabled: false, hours: '', address: '', phone: '' },
    orderButton: tenant?.branding.orderButton ?? { enabled: false, whatsapp: '', label: 'Ordenar ahora' },
    reservation: tenant?.branding.reservation ?? { enabled: false, title: 'Reserva tu mesa', phone: '', bookingUrl: '', buttonLabel: 'Reservar ahora' },
    promo: tenant?.branding.promo ?? { enabled: false, title: '', description: '', imageUrl: null, ctaLabel: 'Ver más', ctaLink: '' },
    featuredSection: tenant?.branding.featuredSection ?? { enabled: false, title: 'Nuestros favoritos', dishIds: [] },
  })

  const [editing, setEditing] = useState<EditingState>(defaultEditing)

  // Re-inicializa la edición cuando llega (o cambia) el tenant.
  // Patrón React "adjust state during render": se compara contra el último
  // tenant sincronizado; ediciones locales sobreviven a refetches del mismo tenant.
  const [syncedTenantId, setSyncedTenantId] = useState<string | null>(null)
  if (tenant && tenant.id !== syncedTenantId) {
    setSyncedTenantId(tenant.id)
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
      announcement: tenant.branding.announcement,
      socials: tenant.branding.socials,
      infoFooter: tenant.branding.infoFooter,
      orderButton: tenant.branding.orderButton,
      reservation: tenant.branding.reservation,
      promo: tenant.branding.promo,
      featuredSection: tenant.branding.featuredSection,
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

  const previewTenant: Tenant | null = tenant
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
          announcement: editing.announcement,
          socials: editing.socials,
          infoFooter: editing.infoFooter,
          orderButton: editing.orderButton,
          reservation: editing.reservation,
          promo: editing.promo,
          featuredSection: editing.featuredSection,
        },
      }
    : null

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

  const [previewMode, setPreviewMode] = useState<'full' | 'mobile'>('full')
  const [activeTab, setActiveTab] = useState<'sections' | 'theme'>('sections')
  const [openSection, setOpenSection] = useState<string | null>('hero')

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
    JSON.stringify(editing.bgGradient) !== JSON.stringify(tenant.branding.bgGradient) ||
    JSON.stringify(editing.announcement) !== JSON.stringify(tenant.branding.announcement) ||
    JSON.stringify(editing.socials) !== JSON.stringify(tenant.branding.socials) ||
    JSON.stringify(editing.infoFooter) !== JSON.stringify(tenant.branding.infoFooter) ||
    JSON.stringify(editing.orderButton) !== JSON.stringify(tenant.branding.orderButton) ||
    JSON.stringify(editing.reservation) !== JSON.stringify(tenant.branding.reservation) ||
    JSON.stringify(editing.promo) !== JSON.stringify(tenant.branding.promo) ||
    JSON.stringify(editing.featuredSection) !== JSON.stringify(tenant.branding.featuredSection)
  ) : false

  return (
    <div className="flex flex-col gap-0 h-full">

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 bg-white shrink-0 shadow-sm">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400">
            Personalización
          </p>
          <h1 className="text-base font-bold text-zinc-900 tracking-tight mt-0.5">Editor de apariencia</h1>
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
          {/* AI Digitize CTA */}
          <Link
            to={`${ROUTES.admin.editor}?openDigitalize=1`}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-500"
          >
            <Sparkles size={12} />
            Digitalizar menú con IA
          </Link>

          <Button variant="secondary" size="sm" asChild className="rounded-xl shadow-sm">
            <Link to={menuPreviewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={12} className="mr-1.5" />Ver menú
            </Link>
          </Button>
          <Button size="sm" isLoading={isLoading} onClick={() => void handleSave()} className={cn('rounded-xl shadow-sm', !hasChanges && 'opacity-60')}>
            Guardar
          </Button>
        </div>
      </div>

      {error && <div className="px-6 py-2.5 bg-red-50 border-b border-red-100 text-sm text-red-700 shrink-0">{error}</div>}

      {/* ── Main layout ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel ── */}
        <div className="w-[300px] shrink-0 flex flex-col border-r border-surface-100 bg-surface-0">

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
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'sections' ? (
              <SectionsPanel editing={editing} set={set} openSection={openSection} toggleSection={toggleSection} previewGroups={previewGroups} />
            ) : (
              <ThemePanel editing={editing} set={set} handleTemplateSelect={handleTemplateSelect} />
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
          <div className="flex-1 overflow-y-auto flex flex-col" style={{ backgroundColor: editing.backgroundColor }}>
            {realGroups.length === 0 && (
              <div className="flex shrink-0 items-center justify-center gap-1.5 py-2 text-xs bg-amber-50 border-b border-amber-100">
                <span className="text-amber-600">Vista de ejemplo —</span>
                <Link to={ROUTES.admin.menu.list} className="text-amber-700 font-medium hover:underline">agrega tu menú</Link>
              </div>
            )}
            <div className="flex-1">
              {previewTenant ? (
                <Suspense fallback={<div className="flex h-64 items-center justify-center" style={{ backgroundColor: editing.backgroundColor }}><Spinner size="sm" /></div>}>
                  <TemplatePreview tenant={previewTenant} menu={previewMenu} table={PREVIEW_TABLE} groups={previewGroups} tenantId={tenantId} />
                </Suspense>
              ) : (
                <div className="flex h-64 items-center justify-center"><Spinner size="sm" /></div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-surface-100 flex flex-col items-center justify-start py-8 px-6 gap-3">
            <div className="flex items-center gap-1.5 text-xs text-surface-400">
              <Smartphone size={12} />Vista móvil
            </div>
            <div
              className="relative overflow-hidden shadow-2xl shrink-0"
              style={{ width: 293, height: 620, borderRadius: '2.75rem', border: '7px solid #1f2937', background: '#0f172a' }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 w-20 h-5 rounded-b-xl" style={{ backgroundColor: '#1f2937' }} />
              {previewTenant ? (
                <div className="phone-preview-scroll" style={{ width: 390, height: 863, transform: 'scale(0.718)', transformOrigin: 'top left', overflowY: 'auto', position: 'absolute', top: 0, left: 0 }}>
                  <Suspense fallback={<div className="flex items-center justify-center h-full" style={{ backgroundColor: editing.backgroundColor }}><Spinner size="sm" /></div>}>
                    <TemplatePreview tenant={previewTenant} menu={previewMenu} table={PREVIEW_TABLE} groups={previewGroups} tenantId={tenantId} />
                  </Suspense>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full"><Spinner size="sm" /></div>
              )}
            </div>
            {realGroups.length === 0 && (
              <p className="text-xs text-surface-400 text-center max-w-[200px]">
                Ejemplo. Agrega tu menú en{' '}
                <Link to={ROUTES.admin.menu.list} className="text-brand-600 hover:underline">Menús</Link>.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sections Tab ───────────────────────────────────────────────────────────────

function SectionsPanel({
  editing, set, openSection, toggleSection, previewGroups,
}: {
  editing: EditingState
  set: <K extends keyof EditingState>(k: K, v: EditingState[K]) => void
  openSection: string | null
  toggleSection: (id: string) => void
  previewGroups: import('@core/use-cases/menu/GetActiveDishesUseCase').DishesGroupedByCategory[]
}) {
  const socialCount = [editing.socials.instagram, editing.socials.facebook, editing.socials.tiktok, editing.socials.whatsapp].filter(Boolean).length

  return (
    <div className="flex flex-col gap-4 p-3 pb-6">

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
          <p className="text-[10px] text-surface-400 leading-relaxed">Botón flotante que abre WhatsApp con un mensaje de pedido predefinido.</p>
          <TextInput label="Texto del botón" value={editing.orderButton.label}
            onChange={(v) => set('orderButton', { ...editing.orderButton, label: v })}
            placeholder="Ordenar ahora" maxLength={30} />
          <TextInput label="Número de WhatsApp" value={editing.orderButton.whatsapp}
            onChange={(v) => set('orderButton', { ...editing.orderButton, whatsapp: v })}
            placeholder="+506 8888 8888" />
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
      {/* Current template preview */}
      {current && (
        <div
          className="flex items-center gap-3 rounded-xl border border-surface-150 bg-surface-0 p-2.5"
        >
          <div
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-surface-100"
            style={{ backgroundColor: current.previewBg }}
          >
            <div
              className="absolute bottom-1 left-1 right-1 h-1.5 rounded-full"
              style={{ backgroundColor: current.previewAccent }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-surface-800 truncate">{current.name}</p>
            <p className="text-[10px] text-surface-400 truncate">{current.tags.join(' · ')}</p>
          </div>
          <CheckCircle2 size={14} className="text-brand-500 shrink-0" />
        </div>
      )}

      {/* Open modal button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 bg-surface-0 py-2.5 text-[11px] font-semibold text-surface-600 transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600"
      >
        <LayoutGrid size={12} />
        Cambiar plantilla ({templates.length} disponibles)
      </button>

      <p className="text-[10px] text-surface-400">Cambiar plantilla aplica sus colores por defecto.</p>

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
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)' }}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex-1">
          <h2 className="text-sm font-bold text-zinc-900">Elegir plantilla</h2>
          <p className="mt-0.5 text-[10px] text-zinc-400">{templates.length} plantillas disponibles</p>
        </div>
        <div className="relative flex items-center">
          <Search size={12} className="pointer-events-none absolute left-3 text-zinc-400" />
          <input
            autoFocus
            type="text"
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-52 rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-3 text-xs text-zinc-800 placeholder-zinc-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button
          onClick={onClose}
          title="Cerrar (Esc)"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
        >
          <X size={16} />
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto bg-zinc-50 p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-zinc-400">
            <Search size={28} strokeWidth={1} />
            <p className="text-sm">Sin resultados</p>
            <button
              onClick={() => setQuery('')}
              className="text-xs text-zinc-400 underline hover:text-zinc-600"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((tmpl) => {
              const isActive = tmpl.id === currentTemplateId
              return (
                <button
                  key={tmpl.id}
                  onClick={() => onSelect(tmpl.id as TemplateId)}
                  className={cn(
                    'group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-150 hover:shadow-md',
                    isActive
                      ? 'border-brand-400 ring-2 ring-brand-200 shadow-md'
                      : 'border-zinc-200 bg-white hover:border-brand-300',
                  )}
                >
                  {/* Color preview thumbnail */}
                  <div
                    className="relative h-20 w-full"
                    style={{ backgroundColor: tmpl.previewBg }}
                  >
                    {/* Simulated menu rows */}
                    <div className="absolute inset-0 flex flex-col justify-end gap-1 p-2">
                      <div className="h-1 w-2/3 rounded-full opacity-60" style={{ backgroundColor: tmpl.previewAccent }} />
                      <div className="h-1 w-1/2 rounded-full opacity-30" style={{ backgroundColor: tmpl.previewAccent }} />
                      <div className="h-2 w-3/4 rounded-full" style={{ backgroundColor: tmpl.previewAccent }} />
                    </div>
                    {isActive && (
                      <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-brand-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                        <CheckCircle2 size={8} />
                        Activa
                      </div>
                    )}
                  </div>

                  {/* Name + tags */}
                  <div className="flex flex-col gap-0.5 bg-white p-2">
                    <p className={cn('text-[11px] font-bold leading-tight truncate', isActive ? 'text-brand-700' : 'text-zinc-800')}>
                      {tmpl.name}
                    </p>
                    <p className="text-[9px] text-zinc-400 truncate">{tmpl.tags.join(' · ')}</p>
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
  editing, set, handleTemplateSelect,
}: {
  editing: EditingState
  set: <K extends keyof EditingState>(k: K, v: EditingState[K]) => void
  handleTemplateSelect: (id: TemplateId) => void
}) {
  return (
    <div className="flex flex-col gap-6 p-4">

      {/* Template */}
      <section className="flex flex-col gap-3">
        <SectionLabel icon={<LayoutGrid size={12} />}>Plantilla</SectionLabel>
        <AppearanceTemplateTrigger
          currentTemplateId={editing.templateId}
          onSelect={handleTemplateSelect}
        />
      </section>

      {/* Colors */}
      <section className="flex flex-col gap-3">
        <SectionLabel icon={<Palette size={12} />}>Colores</SectionLabel>

        {/* Palette presets */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-surface-700">Paletas prediseñadas</label>
          <div className="grid grid-cols-5 gap-1.5">
            {COLOR_PALETTES.map((p) => {
              const isActive = editing.primaryColor === p.primary && editing.backgroundColor === p.bg
              return (
                <button
                  key={p.name}
                  title={p.name}
                  onClick={() => { set('primaryColor', p.primary); set('backgroundColor', p.bg) }}
                  className={cn('relative h-9 w-full rounded-xl overflow-hidden transition-all', isActive ? 'ring-2 ring-brand-500 ring-offset-1' : 'hover:scale-105')}
                  style={{ backgroundColor: p.bg }}
                >
                  <div className="absolute bottom-1 left-1 right-1 h-1.5 rounded-full" style={{ backgroundColor: p.primary }} />
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-surface-400">Click para aplicar. Luego ajusta a tu gusto.</p>
        </div>

        <ColorField label="Color de acento" hint="Botones y destacados" value={editing.primaryColor} onChange={(v) => set('primaryColor', v)} />
        <ColorField label="Color de fondo" hint="Fondo del menú" value={editing.backgroundColor} onChange={(v) => set('backgroundColor', v)} />
      </section>

      {/* Gradient */}
      <section className="flex flex-col gap-3">
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
      <section className="flex flex-col gap-3">
        <SectionLabel icon={<Type size={12} />}>Tipografía</SectionLabel>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-surface-700">Fuente</label>
          <select
            value={editing.fontFamily}
            onChange={(e) => set('fontFamily', e.target.value)}
            className="w-full rounded-xl border border-surface-200 bg-surface-0 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            style={{ fontFamily: editing.fontFamily }}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-surface-700">Tamaño base</label>
          <TriPicker
            value={editing.textScale}
            onChange={(v) => set('textScale', v as 'sm' | 'md' | 'lg')}
            options={[
              { value: 'sm', label: 'Pequeño', preview: <span className="text-[10px] font-bold text-surface-600">Aa</span> },
              { value: 'md', label: 'Normal', preview: <span className="text-sm font-bold text-surface-600">Aa</span> },
              { value: 'lg', label: 'Grande', preview: <span className="text-lg font-bold text-surface-600">Aa</span> },
            ]}
          />
        </div>
      </section>

      {/* Style */}
      <section className="flex flex-col gap-3">
        <SectionLabel icon={<LayoutGrid size={12} />}>Estilo</SectionLabel>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-surface-700">Forma de tarjetas</label>
          <TriPicker
            value={editing.cardStyle}
            onChange={(v) => set('cardStyle', v as 'sharp' | 'rounded' | 'pill')}
            options={[
              { value: 'sharp', label: 'Recto', preview: <div className="h-5 w-full bg-surface-200" style={{ borderRadius: '4px' }} /> },
              { value: 'rounded', label: 'Redondo', preview: <div className="h-5 w-full bg-surface-200" style={{ borderRadius: '10px' }} /> },
              { value: 'pill', label: 'Cápsula', preview: <div className="h-5 w-full bg-surface-200" style={{ borderRadius: '20px' }} /> },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-surface-700">Sombras</label>
          <TriPicker
            value={editing.shadowDepth}
            onChange={(v) => set('shadowDepth', v as 'flat' | 'soft' | 'deep')}
            options={[
              { value: 'flat', label: 'Sin sombra', preview: <div className="h-5 w-full rounded-md bg-surface-200" style={{ boxShadow: 'none' }} /> },
              { value: 'soft', label: 'Suave', preview: <div className="h-5 w-full rounded-md bg-surface-200" style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.14)' }} /> },
              { value: 'deep', label: 'Profunda', preview: <div className="h-5 w-full rounded-md bg-surface-200" style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.26)' }} /> },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-surface-700">Redondeo de imágenes</label>
          <QuadPicker
            value={editing.imageRounding}
            onChange={(v) => set('imageRounding', v as ImageRounding)}
            options={[
              { value: 'none', label: 'Recto', preview: <div className="h-5 w-full bg-surface-200" style={{ borderRadius: '0px' }} /> },
              { value: 'sm', label: 'Leve', preview: <div className="h-5 w-full bg-surface-200" style={{ borderRadius: '6px' }} /> },
              { value: 'lg', label: 'Redondo', preview: <div className="h-5 w-full bg-surface-200" style={{ borderRadius: '16px' }} /> },
              { value: 'xl', label: 'Máximo', preview: <div className="h-5 w-full bg-surface-200" style={{ borderRadius: '24px' }} /> },
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
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border transition-all duration-150',
        isOpen
          ? 'border-brand-300 shadow-[0_2px_10px_rgba(0,0,0,0.07)]'
          : 'border-surface-150 hover:border-surface-250 hover:shadow-sm',
      )}
    >
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
        className={cn(
          'flex w-full cursor-pointer select-none items-center gap-2.5 px-3.5 py-3 outline-none transition-colors',
          isOpen ? 'bg-brand-50/70' : 'bg-white hover:bg-surface-50',
        )}
      >
        {/* Emoji icon bubble */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm leading-none"
          style={{ background: iconBg }}
        >
          {icon}
        </div>

        {/* Title + preview */}
        <div className="min-w-0 flex-1">
          <p className={cn(
            'text-[12px] font-semibold leading-tight',
            isOpen ? 'text-brand-700' : 'text-surface-800',
          )}>
            {title}
          </p>
          {preview && !isOpen && (
            <p className="mt-0.5 truncate text-[10px] leading-tight text-surface-400">
              {preview}
            </p>
          )}
        </div>

        {/* Enabled/disabled pill */}
        {enableToggle && onEnable && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEnable(!enabled) }}
            className={cn(
              'shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold transition-all',
              enabled
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-surface-200 bg-surface-50 text-surface-400 hover:bg-surface-100',
            )}
          >
            {enabled ? '● Activa' : '○ Inactiva'}
          </button>
        )}

        <ChevronDown
          size={13}
          className={cn(
            'shrink-0 transition-transform duration-200',
            isOpen ? 'rotate-180 text-brand-400' : 'text-surface-350',
          )}
        />
      </div>

      {/* Body */}
      {isOpen && (
        <div className="border-t border-surface-100 bg-white px-4 py-4">
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
    <div className="grid grid-cols-3 gap-1.5">
      {options.map((opt) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-2.5 transition-all',
              isActive ? 'border-brand-400 bg-brand-50' : 'border-surface-150 hover:border-surface-300',
            )}
          >
            {opt.preview}
            <span className={cn('text-[9px] font-semibold leading-none', isActive ? 'text-brand-600' : 'text-surface-400')}>{opt.label}</span>
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
    <div className="grid grid-cols-4 gap-1.5">
      {options.map((opt) => {
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-2 transition-all',
              isActive ? 'border-brand-400 bg-brand-50' : 'border-surface-150 hover:border-surface-300',
            )}
          >
            {opt.preview}
            <span className={cn('text-[9px] font-semibold leading-none text-center', isActive ? 'text-brand-600' : 'text-surface-400')}>{opt.label}</span>
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-150 px-3 py-2.5">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-medium text-surface-700">{label}</span>
        <span className="text-[10px] text-surface-400">{description}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn('relative shrink-0 h-5 w-9 rounded-full transition-all duration-200', checked ? 'bg-brand-500' : 'bg-surface-300')}
      >
        <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200', checked ? 'translate-x-4' : 'translate-x-0.5')} />
      </button>
    </div>
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
