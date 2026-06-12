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

// Taquería Viva — festive Mexican, bold condensed display, serape-stripe accent, restrained heat.
const DISPLAY = '"Bebas Neue", sans-serif'
const BODY = 'var(--tenant-font, "Hanken Grotesk"), sans-serif'

const PAPER = '#fef2e4'
const CARD = '#fffdf9'
const INK = '#2a1c12'
const MUTED = 'rgba(42,28,18,0.56)'
const HAIR = 'rgba(42,28,18,0.11)'

function loadFonts(): void {
  const id = 'tv-fonts'
  if (typeof document === 'undefined' || document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap'
  document.head.appendChild(link)
}

const fmt = (n: number, c: string): string =>
  new Intl.NumberFormat('es-CR', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n)

export default function TaqueriaVivaTemplate({ tenant, menu, table, groups, tenantId, featured }: MenuTemplateProps): ReactNode {
  useEffect(loadFonts, [])
  const tc = getThemeColors(tenant.branding)
  const accent = tc.primary
  const heroH = { compact: 196, normal: 250, tall: 318 }[tenant.branding.heroHeight] ?? 250
  const allDishes = groups.flatMap((g) => g.dishes)
  const tableLabel = table.label ?? `Mesa ${table.number}`
  const serape = `repeating-linear-gradient(45deg, ${accent} 0, ${accent} 7px, #f2b705 7px, #f2b705 14px, #119da4 14px, #119da4 21px, #1c1c1c 21px, #1c1c1c 28px)`

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
    <div style={{ background: PAPER, minHeight: '100svh', color: INK, fontFamily: BODY, fontSize: tc.textScale }}>
      <AnnouncementBar branding={tenant.branding} tc={tc} />
      <OrderButton branding={tenant.branding} tc={tc} />

      <header className="relative shrink-0 overflow-hidden" style={{ height: heroH, backgroundColor: '#241108' }}>
        {tenant.branding.coverImageUrl ? (
          <img src={tenant.branding.coverImageUrl} alt={tenant.name} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: tenant.branding.coverOpacity }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 80% 110%, ${accent}66 0%, transparent 60%), linear-gradient(160deg, #311409 0%, #1c0c05 100%)` }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,9,3,0.5) 0%, rgba(20,9,3,0.2) 45%, rgba(20,9,3,0.7) 100%)' }} />
        <div className="absolute top-0 left-0 right-0" style={{ height: 6, background: serape }} />

        <div className="absolute inset-0 flex flex-col items-start justify-end px-6 pb-6">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: BODY, fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#fde6c9', marginBottom: 10 }}><Flame size={12} style={{ color: accent }} /> Cocina Mexicana</span>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: 'clamp(2.8rem,11vw,4.4rem)', color: '#fff', margin: 0, lineHeight: 0.9, letterSpacing: '0.01em', textShadow: '0 3px 18px rgba(0,0,0,0.55)' }}>{tenant.name}</h1>
          {tenant.branding.tagline ? <p style={{ fontFamily: BODY, fontWeight: 500, fontSize: '0.84rem', color: 'rgba(255,255,255,0.78)', marginTop: 4 }}>{tenant.branding.tagline}</p> : null}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 11, fontFamily: BODY, fontWeight: 700, fontSize: '0.64rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', padding: '4px 12px', borderRadius: 999, background: `${accent}d9`, boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>🌮 {tableLabel}</span>
        </div>
      </header>

      {/* ── Sticky search & category nav ── */}
      <div className="sticky top-0 z-30 flex flex-col" style={{ background: 'rgba(254,242,228,0.95)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${HAIR}` }}>
        {tenant.branding.showSearch && (
          <div style={{ padding: '11px 16px 3px' }}>
            <div className="flex items-center gap-2.5" style={{ background: CARD, border: `1px solid ${HAIR}`, borderRadius: 999, padding: '10px 16px' }}>
            <Search size={15} style={{ color: accent, flexShrink: 0 }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar antojito…" className="flex-1 bg-transparent focus:outline-none placeholder:opacity-45" style={{ color: INK, fontSize: '0.88rem', fontFamily: BODY }} />
            {query ? <button onClick={() => setQuery('')}><X size={14} style={{ color: MUTED }} /></button> : null}
          </div>
          </div>
        )}
        <nav style={{ background: 'rgba(254, 242, 228, 0.95)', backdropFilter: 'blur(10px)' }}>
          <div className="flex overflow-x-auto scrollbar-hide" style={{ padding: '11px 12px', gap: 8 }}>
          {groups.map((g) => {
            const isActive = active === g.category.id
            return (
              <button key={g.category.id} onClick={() => scrollTo(g.category.id)} className="shrink-0 transition-all duration-150 active:scale-95" style={{ padding: '8px 16px 6px', borderRadius: 999, border: `1.5px solid ${isActive ? accent : HAIR}`, background: isActive ? accent : 'transparent', fontFamily: DISPLAY, fontWeight: 400, fontSize: '1rem', letterSpacing: '0.03em', color: isActive ? '#fff' : MUTED, cursor: 'pointer', whiteSpace: 'nowrap' }}>
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
            <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: '0.8rem', color: MUTED, padding: '6px 2px 12px' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
            <MenuCard dishes={filtered} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </>
        ) : groups.map((group) => (
          <section key={group.category.id} ref={(el) => { sectionRefs.current[group.category.id] = el }} style={{ paddingTop: 26, scrollMarginTop: 62 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '0 2px' }}>
              <span style={{ width: 9, height: 9, background: accent, transform: 'rotate(45deg)', flexShrink: 0 }} />
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: '1.66rem', color: INK, margin: 0, lineHeight: 1, letterSpacing: '0.02em' }}>{group.category.name}</h2>
              <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.7rem', color: MUTED, marginLeft: 'auto' }}>{group.dishes.length}</span>
            </div>
            {group.category.description ? <p style={{ fontFamily: BODY, fontSize: '0.82rem', color: MUTED, margin: '0 0 12px', padding: '0 2px' }}>{group.category.description}</p> : null}
            <MenuCard dishes={group.dishes} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </section>
        ))}
      </main>

      <div style={{ borderTop: `1px solid ${HAIR}` }}>
        <SocialsBar branding={tenant.branding} tc={tc} />
        <InfoFooter branding={tenant.branding} tc={tc} />
        <p style={{ textAlign: 'center', fontFamily: DISPLAY, fontWeight: 400, fontSize: '1.4rem', color: accent, padding: '16px 0 28px', letterSpacing: '0.04em' }}>{tenant.name} · ¡Provecho!</p>
      </div>
    </div>
  )
}

function MenuCard({ dishes, tenantId, menuId, accent, branding }: { dishes: Dish[]; tenantId: string; menuId: string; accent: string; branding: TenantBranding }): ReactNode {
  return (
    <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${HAIR}`, boxShadow: '0 2px 12px rgba(42,28,18,0.05)', overflow: 'hidden' }}>
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
    <Link to={`/${tenantId}/menu/${menuId}/dish/${dish.id}`} className={cn('group flex items-stretch gap-3.5 transition-colors duration-150 active:bg-black/[0.03]', unavail && 'opacity-50')} style={{ textDecoration: 'none', padding: '13px 14px', borderBottom: divider ? `1px solid ${HAIR}` : 'none' }}>
      {hasImg ? (
        <div className="relative shrink-0 overflow-hidden" style={{ width: 62, height: 62, borderRadius: 10 }}>
          <img src={dish.assets.imageUrl ?? ''} alt={dish.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {dish.assets.hasAR ? <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: `${accent}e6` }}><Cuboid size={7} />AR</span> : null}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="min-w-0 flex-1" style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: '1.2rem', color: INK, margin: 0, lineHeight: 1.1, letterSpacing: '0.01em' }}>{dish.name}</h3>
          {branding.showPrices ? <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: '0.95rem', color: accent, whiteSpace: 'nowrap' }}>{fmt(dish.price.amount, dish.price.currency)}</span> : null}
        </div>
        {dish.description ? (
          <p style={{ fontFamily: BODY, fontSize: '0.78rem', color: MUTED, margin: '2px 0 0', lineHeight: 1.42, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{dish.description}</p>
        ) : null}
        {showBadges || (!hasImg && dish.assets.hasAR) || unavail ? (
          <div className="flex flex-wrap items-center gap-1.5" style={{ marginTop: 7 }}>
            {!hasImg && dish.assets.hasAR ? <Badge accent={accent}><Cuboid size={9} />AR 3D</Badge> : null}
            {branding.showDietaryBadges && dish.nutrition.isVegan ? <Badge accent={accent}>🌱 Vegano</Badge> : null}
            {branding.showDietaryBadges && !dish.nutrition.isVegan && dish.nutrition.isVegetarian ? <Badge accent={accent}>🥦 Veggie</Badge> : null}
            {branding.showDietaryBadges && dish.nutrition.isGlutenFree ? <Badge accent={accent}>🌾 Sin gluten</Badge> : null}
            {unavail ? <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: '#b91c1c', background: 'rgba(185,28,28,0.08)', padding: '2px 8px', borderRadius: 999 }}>Agotado</span> : null}
          </div>
        ) : null}
      </div>
    </Link>
  )
}

function Badge({ children, accent }: { children: ReactNode; accent: string }): ReactNode {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: accent, background: `${accent}14`, padding: '2px 8px', borderRadius: 999 }}>{children}</span>
}
