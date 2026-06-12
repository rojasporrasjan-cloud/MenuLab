import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Search, Cuboid, X } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { getThemeColors } from '@shared/utils/colorScale'
import { matchesQuery } from '@shared/utils/menuSearch'
import { AnnouncementBar, SocialsBar, InfoFooter, OrderButton, ReservationSection, PromoSection, FeaturedSection } from '../sections'
import type { MenuTemplateProps } from '../types'
import type { Dish } from '@core/domain/entities/Dish'
import type { TenantBranding } from '@core/domain/entities/Tenant'

// Tapas Bar — Spanish taberna warmth, Lora serif, azulejo tile motif, compact barra.
const DISPLAY = '"Lora", serif'
const BODY = 'var(--tenant-font, "Mulish"), sans-serif'

const PAPER = '#fdf0d9'
const CARD = '#fffdf6'
const INK = '#2c2014'
const MUTED = 'rgba(44,32,20,0.56)'
const HAIR = 'rgba(44,32,20,0.13)'

function loadFonts(): void {
  const id = 'tb-fonts'
  if (typeof document === 'undefined' || document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Mulish:wght@400;500;600;700;800&display=swap'
  document.head.appendChild(link)
}

const fmt = (n: number, c: string): string =>
  new Intl.NumberFormat('es-CR', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n)

export default function TapasBarTemplate({ tenant, menu, table, groups, tenantId, featured }: MenuTemplateProps): ReactNode {
  useEffect(loadFonts, [])
  const tc = getThemeColors(tenant.branding)
  const accent = tc.primary
  const heroH = { compact: 202, normal: 258, tall: 326 }[tenant.branding.heroHeight] ?? 258
  const allDishes = groups.flatMap((g) => g.dishes)
  const tableLabel = table.label ?? `Mesa ${table.number}`
  const azulejo = `linear-gradient(45deg, transparent 46%, ${accent}40 46% 54%, transparent 54%), linear-gradient(-45deg, transparent 46%, ${accent}40 46% 54%, transparent 54%)`

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

      <header className="relative shrink-0 overflow-hidden" style={{ height: heroH, backgroundColor: '#241407' }}>
        {tenant.branding.coverImageUrl ? (
          <img src={tenant.branding.coverImageUrl} alt={tenant.name} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: tenant.branding.coverOpacity }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 25% 110%, ${accent}66 0%, transparent 56%), linear-gradient(160deg, #34200f 0%, #1f1207 100%)` }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,12,5,0.35) 0%, rgba(20,12,5,0.16) 45%, rgba(20,12,5,0.72) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 8, backgroundImage: azulejo, backgroundSize: '16px 16px' }} />
        <div className="absolute inset-0 flex flex-col items-start justify-end px-6 pb-7">
          <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.26em', textTransform: 'uppercase', color: '#fbd9a8', marginBottom: 9 }}>Taberna · Tapas</span>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(2rem,7.5vw,3rem)', color: '#fff', margin: 0, lineHeight: 1.0, textShadow: '0 2px 14px rgba(0,0,0,0.5)' }}>{tenant.name}</h1>
          {tenant.branding.tagline ? <p style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: '0.98rem', color: 'rgba(255,255,255,0.82)', marginTop: 5 }}>{tenant.branding.tagline}</p> : null}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 11, fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.24)' }}>{tableLabel}</span>
        </div>
      </header>

      {/* ── Sticky search & category nav ── */}
      <div className="sticky top-0 z-30 flex flex-col" style={{ background: 'rgba(253,240,217,0.95)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${HAIR}` }}>
        {tenant.branding.showSearch && (
          <div style={{ padding: '11px 16px 3px' }}>
            <div className="flex items-center gap-2.5" style={{ background: CARD, border: `1px solid ${HAIR}`, borderRadius: 999, padding: '11px 16px' }}>
            <Search size={15} style={{ color: accent, flexShrink: 0 }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar tapa…" className="flex-1 bg-transparent focus:outline-none placeholder:opacity-45" style={{ color: INK, fontSize: '0.88rem', fontFamily: BODY }} />
            {query ? <button onClick={() => setQuery('')}><X size={14} style={{ color: MUTED }} /></button> : null}
          </div>
          </div>
        )}
        <nav style={{ background: 'rgba(253, 240, 217, 0.95)', backdropFilter: 'blur(10px)' }}>
          <div className="flex overflow-x-auto scrollbar-hide" style={{ padding: '11px 12px', gap: 8 }}>
          {groups.map((g) => {
            const isActive = active === g.category.id
            return (
              <button key={g.category.id} onClick={() => scrollTo(g.category.id)} className="shrink-0 transition-all duration-150 active:scale-95" style={{ padding: '7px 15px', borderRadius: 999, border: `1.5px solid ${isActive ? accent : HAIR}`, background: isActive ? accent : 'transparent', fontFamily: DISPLAY, fontWeight: 600, fontSize: '0.84rem', color: isActive ? '#fff' : MUTED, cursor: 'pointer', whiteSpace: 'nowrap' }}>
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
            <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: '0.8rem', color: MUTED, padding: '8px 2px 14px' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
            <MenuCard dishes={filtered} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </>
        ) : groups.map((group) => (
          <section key={group.category.id} ref={(el) => { sectionRefs.current[group.category.id] = el }} style={{ paddingTop: 26, scrollMarginTop: 62 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12, padding: '0 2px' }}>
              <span style={{ width: 8, height: 8, background: accent, transform: 'rotate(45deg)', flexShrink: 0 }} />
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.4rem', color: INK, margin: 0, lineHeight: 1.05 }}>{group.category.name}</h2>
              <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.7rem', color: MUTED, marginLeft: 'auto' }}>{group.dishes.length}</span>
            </div>
            {group.category.description ? <p style={{ fontFamily: BODY, fontSize: '0.83rem', color: MUTED, margin: '0 0 12px', padding: '0 2px' }}>{group.category.description}</p> : null}
            <MenuCard dishes={group.dishes} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </section>
        ))}
      </main>

      <div style={{ borderTop: `1px solid ${HAIR}` }}>
        <SocialsBar branding={tenant.branding} tc={tc} />
        <InfoFooter branding={tenant.branding} tc={tc} />
        <p style={{ textAlign: 'center', fontFamily: DISPLAY, fontStyle: 'italic', fontSize: '1.05rem', color: accent, padding: '16px 0 28px' }}>{tenant.name} · ¡Salud!</p>
      </div>
    </div>
  )
}

function MenuCard({ dishes, tenantId, menuId, accent, branding }: { dishes: Dish[]; tenantId: string; menuId: string; accent: string; branding: TenantBranding }): ReactNode {
  return (
    <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${HAIR}`, boxShadow: '0 2px 12px rgba(44,32,20,0.05)', overflow: 'hidden' }}>
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
    <Link to={`/${tenantId}/menu/${menuId}/dish/${dish.id}`} className={cn('group flex items-stretch gap-3 transition-colors duration-150 active:bg-black/[0.03]', unavail && 'opacity-50')} style={{ textDecoration: 'none', padding: '13px 14px', borderBottom: divider ? `1px solid ${HAIR}` : 'none' }}>
      {hasImg ? (
        <div className="relative shrink-0 overflow-hidden" style={{ width: 58, height: 58, borderRadius: 9 }}>
          <img src={dish.assets.imageUrl ?? ''} alt={dish.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {dish.assets.hasAR ? <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: `${accent}e6` }}><Cuboid size={7} />AR</span> : null}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="min-w-0 flex-1" style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.02rem', color: INK, margin: 0, lineHeight: 1.2 }}>{dish.name}</h3>
          {branding.showPrices ? <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '0.96rem', color: accent, whiteSpace: 'nowrap' }}>{fmt(dish.price.amount, dish.price.currency)}</span> : null}
        </div>
        {dish.description ? (
          <p style={{ fontFamily: BODY, fontSize: '0.78rem', color: MUTED, margin: '3px 0 0', lineHeight: 1.42, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{dish.description}</p>
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
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: accent, background: `${accent}12`, padding: '2px 8px', borderRadius: 999 }}>{children}</span>
}
