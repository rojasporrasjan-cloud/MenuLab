import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Search, Cuboid, X } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { getThemeColors } from '@shared/utils/colorScale'
import { matchesQuery } from '@shared/utils/menuSearch'
import { AnnouncementBar, SocialsBar, InfoFooter, OrderButton, ReservationSection, PromoSection, FeaturedSection, ScheduleBanner } from '../sections'
import type { MenuTemplateProps } from '../types'
import type { Dish } from '@core/domain/entities/Dish'
import type { TenantBranding } from '@core/domain/entities/Tenant'

// Sushi Zen — silence and negative space, Mincho serif, single vermilion seal.
const DISPLAY = '"Shippori Mincho", serif'
const BODY = 'var(--tenant-font, "Zen Kaku Gothic New"), sans-serif'

const PAPER = '#fbfaf7'
const CARD = '#ffffff'
const INK = '#1c1b19'
const MUTED = 'rgba(28,27,25,0.46)'
const HAIR = 'rgba(28,27,25,0.07)'

function loadFonts(): void {
  const id = 'sz-fonts'
  if (typeof document === 'undefined' || document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap'
  document.head.appendChild(link)
}

const fmt = (n: number, c: string): string =>
  new Intl.NumberFormat('es-CR', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n)

export default function SushiZenTemplate({ tenant, menu, table, groups, tenantId, featured }: MenuTemplateProps): ReactNode {
  useEffect(loadFonts, [])
  const tc = getThemeColors(tenant.branding)
  const accent = tc.primary
  const heroH = { compact: 230, normal: 300, tall: 372 }[tenant.branding.heroHeight] ?? 300
  const allDishes = groups.flatMap((g) => g.dishes)
  const tableLabel = table.label ?? `Mesa ${table.number}`
  const hasCover = Boolean(tenant.branding.coverImageUrl)

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
      <ScheduleBanner branding={tenant.branding} tc={tc} />
      <OrderButton branding={tenant.branding} tc={tc} />

      <header className="relative shrink-0 overflow-hidden" style={{ height: heroH, background: hasCover ? '#141312' : PAPER }}>
        {hasCover ? (
          <>
            <img src={tenant.branding.coverImageUrl ?? ''} alt={tenant.name} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: tenant.branding.coverOpacity }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,19,18,0.2) 0%, rgba(20,19,18,0.74) 100%)' }} />
          </>
        ) : null}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
          <span style={{ width: 46, height: 46, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, boxShadow: `0 6px 22px ${accent}40` }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.15rem', color: '#fff' }}>{(tenant.name.trim()[0] ?? '寿').toUpperCase()}</span>
          </span>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 'clamp(1.9rem,6.5vw,2.7rem)', color: hasCover ? '#fff' : INK, margin: 0, lineHeight: 1.2, letterSpacing: '0.14em', paddingLeft: '0.14em' }}>{tenant.name}</h1>
          {tenant.branding.tagline ? <p style={{ fontFamily: BODY, fontWeight: 400, fontSize: '0.84rem', color: hasCover ? 'rgba(255,255,255,0.7)' : MUTED, marginTop: 14, letterSpacing: '0.1em' }}>{tenant.branding.tagline}</p> : null}
          <span style={{ marginTop: 18, fontFamily: BODY, fontWeight: 400, fontSize: '0.6rem', letterSpacing: '0.34em', textTransform: 'uppercase', color: hasCover ? 'rgba(255,255,255,0.7)' : MUTED, paddingLeft: '0.34em' }}>{tableLabel}</span>
        </div>
      </header>

      {/* ── Sticky search & category nav ── */}
      <div className="sticky top-0 z-30 flex flex-col" style={{ background: 'rgba(251,250,247,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${HAIR}` }}>
        {tenant.branding.showSearch && (
          <div style={{ padding: '11px 16px 3px' }}>
            <div className="flex items-center gap-2.5" style={{ background: CARD, border: `1px solid ${HAIR}`, borderRadius: 4, padding: '12px 16px' }}>
            <Search size={15} style={{ color: accent, flexShrink: 0 }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="探す…" className="flex-1 bg-transparent focus:outline-none placeholder:opacity-40" style={{ color: INK, fontSize: '0.88rem', fontFamily: BODY }} />
            {query ? <button onClick={() => setQuery('')}><X size={14} style={{ color: MUTED }} /></button> : null}
          </div>
          </div>
        )}
        <nav style={{ background: 'rgba(251, 250, 247, 0.92)', backdropFilter: 'blur(12px)' }}>
          <div className="flex overflow-x-auto scrollbar-hide" style={{ padding: '0 16px' }}>
          {groups.map((g) => {
            const isActive = active === g.category.id
            return (
              <button key={g.category.id} onClick={() => scrollTo(g.category.id)} className="shrink-0 transition-all duration-150 relative" style={{ padding: '15px 14px', background: 'none', border: 'none', fontFamily: DISPLAY, fontWeight: isActive ? 600 : 400, fontSize: '0.86rem', letterSpacing: '0.08em', color: isActive ? INK : MUTED, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {g.category.name}
                {isActive ? <span style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: accent }} /> : null}
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

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '14px 20px 100px' }}>
        {filtered ? (
          <>
            <p style={{ fontFamily: BODY, fontWeight: 400, fontSize: '0.78rem', color: MUTED, padding: '14px 2px 16px', letterSpacing: '0.04em' }}>{filtered.length} 件</p>
            <MenuCard dishes={filtered} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </>
        ) : groups.map((group) => (
          <section key={group.category.id} ref={(el) => { sectionRefs.current[group.category.id] = el }} style={{ paddingTop: 44, scrollMarginTop: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '0 2px' }}>
              <span style={{ width: 3, height: 22, background: accent, flexShrink: 0 }} />
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.34rem', color: INK, margin: 0, lineHeight: 1.1, letterSpacing: '0.08em' }}>{group.category.name}</h2>
              <span style={{ fontFamily: BODY, fontWeight: 400, fontSize: '0.68rem', color: MUTED, marginLeft: 'auto', letterSpacing: '0.06em' }}>{group.dishes.length}</span>
            </div>
            {group.category.description ? <p style={{ fontFamily: BODY, fontWeight: 400, fontSize: '0.82rem', color: MUTED, margin: '0 0 18px', padding: '0 2px', lineHeight: 1.6 }}>{group.category.description}</p> : null}
            <MenuCard dishes={group.dishes} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </section>
        ))}
      </main>

      <div style={{ borderTop: `1px solid ${HAIR}` }}>
        <SocialsBar branding={tenant.branding} tc={tc} />
        <InfoFooter branding={tenant.branding} tc={tc} />
        <p style={{ textAlign: 'center', fontFamily: DISPLAY, fontWeight: 500, fontSize: '0.92rem', color: INK, padding: '20px 0 32px', letterSpacing: '0.1em' }}>{tenant.name}</p>
      </div>
    </div>
  )
}

function MenuCard({ dishes, tenantId, menuId, accent, branding }: { dishes: Dish[]; tenantId: string; menuId: string; accent: string; branding: TenantBranding }): ReactNode {
  return (
    <div style={{ background: CARD, borderRadius: 6, border: `1px solid ${HAIR}`, overflow: 'hidden' }}>
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
    <Link to={`/${tenantId}/menu/${menuId}/dish/${dish.id}`} className={cn('group flex items-stretch gap-4 transition-colors duration-150 active:bg-black/[0.02]', unavail && 'opacity-50')} style={{ textDecoration: 'none', padding: '18px 18px', borderBottom: divider ? `1px solid ${HAIR}` : 'none' }}>
      {hasImg ? (
        <div className="relative shrink-0 overflow-hidden" style={{ width: 58, height: 58, borderRadius: 4 }}>
          <img src={dish.assets.imageUrl ?? ''} alt={dish.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {dish.assets.hasAR ? <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: `${accent}e6` }}><Cuboid size={7} />AR</span> : null}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <h3 className="min-w-0 flex-1" style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.04rem', color: INK, margin: 0, lineHeight: 1.3, letterSpacing: '0.02em' }}>{dish.name}</h3>
          {branding.showPrices ? <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '0.98rem', color: accent, whiteSpace: 'nowrap' }}>{fmt(dish.price.amount, dish.price.currency)}</span> : null}
        </div>
        {dish.description ? (
          <p style={{ fontFamily: BODY, fontWeight: 400, fontSize: '0.77rem', color: MUTED, margin: '5px 0 0', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{dish.description}</p>
        ) : null}
        {showBadges || (!hasImg && dish.assets.hasAR) || unavail ? (
          <div className="flex flex-wrap items-center gap-1.5" style={{ marginTop: 9 }}>
            {!hasImg && dish.assets.hasAR ? <Badge accent={accent}><Cuboid size={9} />AR 3D</Badge> : null}
            {branding.showDietaryBadges && dish.nutrition.isVegan ? <Badge accent={accent}>🌱 Vegano</Badge> : null}
            {branding.showDietaryBadges && !dish.nutrition.isVegan && dish.nutrition.isVegetarian ? <Badge accent={accent}>🥦 Veggie</Badge> : null}
            {branding.showDietaryBadges && dish.nutrition.isGlutenFree ? <Badge accent={accent}>🌾 Sin gluten</Badge> : null}
            {unavail ? <span style={{ fontFamily: BODY, fontWeight: 500, fontSize: '0.62rem', color: '#b91c1c', background: 'rgba(185,28,28,0.08)', padding: '2px 8px', borderRadius: 999 }}>Agotado</span> : null}
          </div>
        ) : null}
      </div>
    </Link>
  )
}

function Badge({ children, accent }: { children: ReactNode; accent: string }): ReactNode {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: BODY, fontWeight: 500, fontSize: '0.62rem', color: accent, background: `${accent}12`, padding: '2px 8px', borderRadius: 3 }}>{children}</span>
}
