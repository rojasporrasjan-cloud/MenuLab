import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Search, Cuboid, X, Flame } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { getThemeColors } from '@shared/utils/colorScale'
import { matchesQuery } from '@shared/utils/menuSearch'
import { AnnouncementBar, SocialsBar, InfoFooter, OrderButton, ReservationSection, PromoSection, FeaturedSection } from '../sections'
import type { MenuTemplateProps } from '../types'
import type { Dish } from '@core/domain/entities/Dish'
import type { TenantBranding } from '@core/domain/entities/Tenant'

// Steakhouse — dark wood and leather, condensed Oswald, ember-copper glow.
const DISPLAY = '"Oswald", sans-serif'
const BODY = 'var(--tenant-font, "Lato"), sans-serif'

const INKBG = '#1a1206'
const CARD = 'rgba(255,255,255,0.04)'
const TEXT = '#efe6d8'
const MUTED = 'rgba(239,230,216,0.52)'
const HAIR = 'rgba(239,230,216,0.11)'

function loadFonts(): void {
  const id = 'sh-fonts'
  if (typeof document === 'undefined' || document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Lato:wght@400;700;900&display=swap'
  document.head.appendChild(link)
}

const fmt = (n: number, c: string): string =>
  new Intl.NumberFormat('es-CR', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n)

export default function SteakhouseTemplate({ tenant, menu, table, groups, tenantId, featured }: MenuTemplateProps): ReactNode {
  useEffect(loadFonts, [])
  const tc = getThemeColors(tenant.branding)
  const accent = tc.primary
  const heroH = { compact: 210, normal: 272, tall: 340 }[tenant.branding.heroHeight] ?? 272
  const allDishes = groups.flatMap((g) => g.dishes)
  const tableLabel = table.label ?? `Mesa ${table.number}`

  const [active, setActive] = useState<string | null>(groups[0]?.category.id ?? null)
  const [query, setQuery] = useState('')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    if (!groups.length || typeof IntersectionObserver === 'undefined') return
    const obs: IntersectionObserver[] = []
    groups.forEach((g) => {
      const el = sectionRefs.current[g.category.id]
      if (!el) return
      const o = new IntersectionObserver(([e]) => { if (e?.isIntersecting) setActive(g.category.id) }, { rootMargin: '-25% 0px -60% 0px' })
      o.observe(el)
      obs.push(o)
    })
    return () => obs.forEach((o) => o.disconnect())
  }, [groups])

  const scrollTo = (id: string): void => sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const filtered = query.trim()
    ? allDishes.filter((d) => matchesQuery([d.name, d.description], query))
    : null

  return (
    <div style={{ background: INKBG, minHeight: '100svh', color: TEXT, fontFamily: BODY, fontSize: tc.textScale }}>
      <AnnouncementBar branding={tenant.branding} tc={tc} />
      <OrderButton branding={tenant.branding} tc={tc} />

      <header className="relative shrink-0 overflow-hidden" style={{ height: heroH, backgroundColor: '#0f0a03' }}>
        {tenant.branding.coverImageUrl ? (
          <img src={tenant.branding.coverImageUrl} alt={tenant.name} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: tenant.branding.coverOpacity }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 125%, ${accent}55 0%, transparent 56%), linear-gradient(165deg, #25190b 0%, #100a03 100%)` }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(8,5,1,0.4) 0%, rgba(8,5,1,0.15) 45%, rgba(8,5,1,0.66) 100%)' }} />
        <div className="absolute inset-0 flex flex-col items-start justify-end px-6 pb-6">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: BODY, fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#e9c79a', marginBottom: 9 }}><Flame size={12} style={{ color: accent }} /> Grill · Asador</span>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 'clamp(2.2rem,8vw,3.3rem)', color: '#fff', margin: 0, lineHeight: 0.98, letterSpacing: '0.02em', textTransform: 'uppercase', textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>{tenant.name}</h1>
          {tenant.branding.tagline ? <p style={{ fontFamily: BODY, fontWeight: 400, fontSize: '0.88rem', color: 'rgba(255,255,255,0.78)', marginTop: 6 }}>{tenant.branding.tagline}</p> : null}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 11, fontFamily: DISPLAY, fontWeight: 500, fontSize: '0.66rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', padding: '4px 13px', borderRadius: 3, background: `${accent}cc` }}>{tableLabel}</span>
        </div>
      </header>

      {/* ── Sticky search & category nav ── */}
      <div className="sticky top-0 z-30 flex flex-col" style={{ background: 'rgba(26,18,6,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${HAIR}` }}>
        {tenant.branding.showSearch && (
          <div style={{ padding: '11px 16px 3px' }}>
            <div className="flex items-center gap-2.5" style={{ background: CARD, border: `1px solid ${HAIR}`, borderRadius: 6, padding: '11px 14px' }}>
            <Search size={15} style={{ color: accent, flexShrink: 0 }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar corte…" className="flex-1 bg-transparent focus:outline-none placeholder:opacity-45" style={{ color: TEXT, fontSize: '0.88rem', fontFamily: BODY }} />
            {query ? <button onClick={() => setQuery('')}><X size={14} style={{ color: MUTED }} /></button> : null}
          </div>
          </div>
        )}
        <nav style={{ background: 'rgba(26, 18, 6, 0.9)', backdropFilter: 'blur(12px)' }}>
          <div className="flex overflow-x-auto scrollbar-hide" style={{ padding: '0 14px' }}>
          {groups.map((g) => {
            const isActive = active === g.category.id
            return (
              <button key={g.category.id} onClick={() => scrollTo(g.category.id)} className="shrink-0 transition-all duration-150" style={{ padding: '15px 13px 13px', background: 'none', border: 'none', fontFamily: DISPLAY, fontWeight: isActive ? 600 : 400, fontSize: '0.84rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: isActive ? accent : MUTED, cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: `2px solid ${isActive ? accent : 'transparent'}` }}>
                {g.category.name}
              </button>
            )
          })}
        </div>
        </nav>
      </div>

      {featured}
      <FeaturedSection branding={tenant.branding} tc={tc} dishes={allDishes} tenantId={tenantId} menuId={menu.id} />
      <ReservationSection branding={tenant.branding} tc={tc} />
      <PromoSection branding={tenant.branding} tc={tc} />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '14px 16px 96px' }}>
        {filtered ? (
          <>
            <p style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.8rem', color: MUTED, padding: '8px 2px 14px' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
            <MenuCard dishes={filtered} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </>
        ) : groups.map((group) => (
          <section key={group.category.id} ref={(el) => { sectionRefs.current[group.category.id] = el }} style={{ paddingTop: 28, scrollMarginTop: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '0 2px' }}>
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.5rem', color: TEXT, margin: 0, lineHeight: 1.0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{group.category.name}</h2>
              <span style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
              <span style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: '0.8rem', color: MUTED }}>{group.dishes.length}</span>
            </div>
            {group.category.description ? <p style={{ fontFamily: BODY, fontSize: '0.83rem', color: MUTED, margin: '0 0 14px', padding: '0 2px' }}>{group.category.description}</p> : null}
            <MenuCard dishes={group.dishes} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </section>
        ))}
      </main>

      <div style={{ borderTop: `1px solid ${HAIR}` }}>
        <SocialsBar branding={tenant.branding} tc={tc} />
        <InfoFooter branding={tenant.branding} tc={tc} />
        <p style={{ textAlign: 'center', fontFamily: DISPLAY, fontWeight: 500, fontSize: '1.1rem', color: accent, padding: '16px 0 28px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tenant.name}</p>
      </div>
    </div>
  )
}

function MenuCard({ dishes, tenantId, menuId, accent, branding }: { dishes: Dish[]; tenantId: string; menuId: string; accent: string; branding: TenantBranding }): ReactNode {
  return (
    <div style={{ background: CARD, borderRadius: 8, border: `1px solid ${HAIR}`, overflow: 'hidden' }}>
      {dishes.map((dish, i) => (
        <DishRow key={dish.id} dish={dish} tenantId={tenantId} menuId={menuId} accent={accent} branding={branding} divider={i < dishes.length - 1} />
      ))}
    </div>
  )
}

function DishRow({ dish, tenantId, menuId, accent, branding, divider }: { dish: Dish; tenantId: string; menuId: string; accent: string; branding: TenantBranding; divider: boolean }): ReactNode {
  const unavail = dish.status === 'unavailable'
  const hasImg = Boolean(dish.assets.imageUrl)
  const showBadges = branding.showDietaryBadges && (dish.nutrition.isVegan || dish.nutrition.isVegetarian || dish.nutrition.isGlutenFree)
  return (
    <Link to={`/${tenantId}/menu/${menuId}/dish/${dish.id}`} className={cn('group flex items-stretch gap-3.5 transition-colors duration-150 active:bg-white/[0.03]', unavail && 'opacity-45')} style={{ textDecoration: 'none', padding: '14px 15px', borderBottom: divider ? `1px solid ${HAIR}` : 'none' }}>
      {hasImg ? (
        <div className="relative shrink-0 overflow-hidden" style={{ width: 62, height: 62, borderRadius: 8 }}>
          <img src={dish.assets.imageUrl ?? ''} alt={dish.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {dish.assets.hasAR ? <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: `${accent}e6` }}><Cuboid size={7} />AR</span> : null}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="min-w-0 flex-1" style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: '1.04rem', color: TEXT, margin: 0, lineHeight: 1.15, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{dish.name}</h3>
          {branding.showPrices ? <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '0.98rem', color: accent, whiteSpace: 'nowrap' }}>{fmt(dish.price.amount, dish.price.currency)}</span> : null}
        </div>
        {dish.description ? (
          <p style={{ fontFamily: BODY, fontSize: '0.78rem', color: MUTED, margin: '3px 0 0', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{dish.description}</p>
        ) : null}
        {showBadges || (!hasImg && dish.assets.hasAR) || unavail ? (
          <div className="flex flex-wrap items-center gap-1.5" style={{ marginTop: 7 }}>
            {!hasImg && dish.assets.hasAR ? <Badge accent={accent}><Cuboid size={9} />AR 3D</Badge> : null}
            {branding.showDietaryBadges && dish.nutrition.isVegan ? <Badge accent={accent}>🌱 Vegano</Badge> : null}
            {branding.showDietaryBadges && !dish.nutrition.isVegan && dish.nutrition.isVegetarian ? <Badge accent={accent}>🥦 Veggie</Badge> : null}
            {branding.showDietaryBadges && dish.nutrition.isGlutenFree ? <Badge accent={accent}>🌾 Sin gluten</Badge> : null}
            {unavail ? <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: '#fca5a5', background: 'rgba(248,113,113,0.12)', padding: '2px 8px', borderRadius: 999 }}>Agotado</span> : null}
          </div>
        ) : null}
      </div>
    </Link>
  )
}

function Badge({ children, accent }: { children: ReactNode; accent: string }): ReactNode {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: accent, background: `${accent}1a`, border: `1px solid ${accent}33`, padding: '1px 8px', borderRadius: 4 }}>{children}</span>
}
