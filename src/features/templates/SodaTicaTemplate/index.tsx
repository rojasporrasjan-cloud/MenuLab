import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Search, Cuboid, X, Coffee } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { getThemeColors } from '@shared/utils/colorScale'
import { matchesQuery } from '@shared/utils/menuSearch'
import { AnnouncementBar, SocialsBar, InfoFooter, OrderButton, ReservationSection, PromoSection, FeaturedSection } from '../sections'
import type { MenuTemplateProps } from '../types'
import type { Dish } from '@core/domain/entities/Dish'

const DISPLAY = '"Pacifico", cursive'
const BODY    = 'var(--tenant-font, "Nunito"), sans-serif'

// Premium warm-paper palette — restraint over saturation.
const PAPER = '#faf8f4'
const CARD  = '#ffffff'
const INK   = '#1f2418'
const MUTED = 'rgba(31,36,24,0.54)'
const HAIR  = 'rgba(31,36,24,0.08)'

function loadFonts() {
  const id = 'st-fonts'
  if (typeof document === 'undefined' || document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id; link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Pacifico&family=Nunito:wght@400;500;600;700;800;900&display=swap'
  document.head.appendChild(link)
}

const fmt = (n: number, c: string) =>
  new Intl.NumberFormat('es-CR', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n)

export default function SodaTicaTemplate({ tenant, menu, table, groups, tenantId, featured }: MenuTemplateProps) {
  useEffect(loadFonts, [])
  const tc      = getThemeColors(tenant.branding)
  const accent  = tc.primary
  const heroH   = { compact: 200, normal: 264, tall: 340 }[tenant.branding.heroHeight] ?? 264
  const allDishes = groups.flatMap(g => g.dishes)
  const tableLabel = table.label ?? `Mesa ${table.number}`

  const [active, setActive] = useState<string | null>(groups[0]?.category.id ?? null)
  const [query, setQuery]   = useState('')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    if (!groups.length || typeof IntersectionObserver === 'undefined') return
    const obs: IntersectionObserver[] = []
    groups.forEach(g => {
      const el = sectionRefs.current[g.category.id]; if (!el) return
      const o = new IntersectionObserver(([e]) => { if (e?.isIntersecting) setActive(g.category.id) }, { rootMargin: '-25% 0px -60% 0px' })
      o.observe(el); obs.push(o)
    })
    return () => obs.forEach(o => o.disconnect())
  }, [groups])

  const scrollTo = (id: string) => sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const filtered = query.trim()
    ? allDishes.filter((d) => matchesQuery([d.name, d.description], query))
    : null

  return (
    <div style={{ background: PAPER, minHeight: '100svh', color: INK, fontFamily: BODY, fontSize: tc.textScale }}>
      <AnnouncementBar branding={tenant.branding} tc={tc} />
      <OrderButton branding={tenant.branding} tc={tc} />

      {/* ── Hero ── */}
      <header className="relative shrink-0 overflow-hidden" style={{ height: heroH, backgroundColor: '#0f2d0f' }}>
        {tenant.branding.coverImageUrl ? (
          <img src={tenant.branding.coverImageUrl} alt={tenant.name} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: tenant.branding.coverOpacity }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 75%, ${accent}4d 0%, transparent 60%), linear-gradient(165deg, #123512 0%, #0c240c 100%)` }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.72) 100%)' }} />

        {/* Costa Rica flag stripe accent */}
        <div className="absolute top-0 left-0 right-0" style={{ height: 5, background: 'linear-gradient(90deg, #001489 33%, #FFFFFF 33%, #FFFFFF 40%, #CF0C0C 40%, #CF0C0C 60%, #FFFFFF 60%, #FFFFFF 67%, #001489 67%)' }} />

        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-4 px-5 pb-5">
          {tenant.branding.logoUrl ? (
            <img src={tenant.branding.logoUrl} alt={tenant.name} className="h-[60px] w-[60px] shrink-0 object-cover" style={{ borderRadius: '50%', border: `2.5px solid rgba(255,255,255,0.85)`, boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }} />
          ) : (
            <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)`, border: `2.5px solid rgba(255,255,255,0.85)`, boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}>
              <Coffee size={24} className="text-white" />
            </div>
          )}
          <div className="min-w-0 pb-0.5">
            <h1 style={{ fontFamily: DISPLAY, fontSize: 'clamp(1.7rem,5.5vw,2.4rem)', color: '#fff', margin: 0, lineHeight: 1.1, textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>{tenant.name}</h1>
            {tenant.branding.tagline && <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: '0.8rem', color: 'rgba(255,255,255,0.72)', marginTop: 3 }}>{tenant.branding.tagline}</p>}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 9, fontFamily: BODY, fontWeight: 700, fontSize: '0.64rem', background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(6px)', color: '#fff', padding: '4px 11px', borderRadius: 999, letterSpacing: '0.03em', border: '1px solid rgba(255,255,255,0.25)' }}>🪑 {tableLabel}</span>
          </div>
        </div>
      </header>

      {/* ── Sticky category nav ── */}
      {/* ── Sticky search & category nav ── */}
      <div className="sticky top-0 z-30 flex flex-col" style={{ background: 'rgba(250,248,244,0.92)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${HAIR}` }}>
        {tenant.branding.showSearch && (
          <div style={{ padding: '11px 16px 3px' }}>
            <div className="flex items-center gap-2.5" style={{ background: CARD, border: `1px solid ${HAIR}`, borderRadius: 14, padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <Search size={15} style={{ color: accent, flexShrink: 0 }} />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar platillo…" className="flex-1 bg-transparent focus:outline-none placeholder:opacity-45" style={{ color: INK, fontSize: '0.88rem', fontFamily: BODY }} />
            {query && <button onClick={() => setQuery('')}><X size={14} style={{ color: MUTED }} /></button>}
          </div>
          </div>
        )}
        <nav style={{ background: 'rgba(250, 248, 244, 0.92)', backdropFilter: 'blur(10px)' }}>
          <div className="flex overflow-x-auto scrollbar-hide" style={{ padding: '0 10px' }}>
          {groups.map(g => {
            const isActive = active === g.category.id
            return (
              <button key={g.category.id} onClick={() => scrollTo(g.category.id)} className="shrink-0 transition-all duration-150" style={{ padding: '13px 12px 11px', background: 'none', border: 'none', fontFamily: BODY, fontWeight: isActive ? 800 : 600, fontSize: '0.86rem', color: isActive ? accent : MUTED, cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: `2.5px solid ${isActive ? accent : 'transparent'}` }}>
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

      {/* ── Dishes ── */}
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 90px' }}>
        {filtered ? (
          <>
            <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: '0.8rem', color: MUTED, padding: '6px 2px 12px' }}>🔍 {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
            <MenuCard dishes={filtered} tenantId={tenantId} menuId={menu.id} accent={accent} />
          </>
        ) : groups.map((group) => (
          <section key={group.category.id} ref={el => { sectionRefs.current[group.category.id] = el }} style={{ paddingTop: 26, scrollMarginTop: 56 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12, padding: '0 2px' }}>
              <div style={{ width: 5, alignSelf: 'stretch', minHeight: 22, background: accent, borderRadius: 3, flexShrink: 0 }} />
              <h2 style={{ fontFamily: BODY, fontWeight: 900, fontSize: '1.18rem', color: INK, margin: 0, lineHeight: 1.15, letterSpacing: '-0.01em' }}>{group.category.name}</h2>
              <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.72rem', color: MUTED, marginLeft: 'auto' }}>{group.dishes.length}</span>
            </div>
            {group.category.description && <p style={{ fontFamily: BODY, fontSize: '0.8rem', color: MUTED, margin: '0 0 12px', padding: '0 2px' }}>{group.category.description}</p>}
            <MenuCard dishes={group.dishes} tenantId={tenantId} menuId={menu.id} accent={accent} />
          </section>
        ))}
      </main>

      <div style={{ borderTop: `1px solid ${HAIR}` }}>
        <SocialsBar branding={tenant.branding} tc={tc} />
        <InfoFooter branding={tenant.branding} tc={tc} />
        <p style={{ textAlign: 'center', fontFamily: DISPLAY, fontSize: '1rem', color: accent, padding: '14px 0 26px' }}>{tenant.name} · ¡Pura Vida!</p>
      </div>
    </div>
  )
}

// ── Menu card: a category grouped as elegant rows (premium, photo-optional) ──
function MenuCard({ dishes, tenantId, menuId, accent }: { dishes: Dish[]; tenantId: string; menuId: string; accent: string }) {
  return (
    <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${HAIR}`, boxShadow: '0 2px 10px rgba(31,36,24,0.05)', overflow: 'hidden' }}>
      {dishes.map((dish, i) => (
        <DishRow key={dish.id} dish={dish} tenantId={tenantId} menuId={menuId} accent={accent} divider={i < dishes.length - 1} />
      ))}
    </div>
  )
}

function DishRow({ dish, tenantId, menuId, accent, divider }: { dish: Dish; tenantId: string; menuId: string; accent: string; divider: boolean }) {
  const unavail = dish.status === 'unavailable'
  const hasImg  = Boolean(dish.assets.imageUrl)
  return (
    <Link
      to={`/${tenantId}/menu/${menuId}/dish/${dish.id}`}
      className={cn('group flex items-stretch gap-3.5 transition-colors duration-150 active:bg-black/[0.03]', unavail && 'opacity-50')}
      style={{ textDecoration: 'none', padding: '13px 14px', borderBottom: divider ? `1px solid ${HAIR}` : 'none' }}
    >
      {hasImg && (
        <div className="relative shrink-0 overflow-hidden" style={{ width: 64, height: 64, borderRadius: 12 }}>
          <img src={dish.assets.imageUrl ?? ''} alt={dish.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {dish.assets.hasAR && (
            <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: `${accent}e6` }}><Cuboid size={7} />AR</span>
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 style={{ fontFamily: BODY, fontWeight: 800, fontSize: '0.95rem', color: INK, margin: 0, lineHeight: 1.25 }} className="min-w-0 flex-1">{dish.name}</h3>
          <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: '0.95rem', color: accent, whiteSpace: 'nowrap' }}>{fmt(dish.price.amount, dish.price.currency)}</span>
        </div>
        {dish.description && (
          <p style={{ fontFamily: BODY, fontSize: '0.78rem', color: MUTED, margin: '3px 0 0', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{dish.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5" style={{ marginTop: (dish.nutrition.isVegan || dish.nutrition.isVegetarian || dish.nutrition.isGlutenFree || (!hasImg && dish.assets.hasAR) || unavail) ? 7 : 0 }}>
          {!hasImg && dish.assets.hasAR && <Badge accent={accent}><Cuboid size={9} />AR 3D</Badge>}
          {dish.nutrition.isVegan && <Badge accent={accent}>🌱 Vegano</Badge>}
          {!dish.nutrition.isVegan && dish.nutrition.isVegetarian && <Badge accent={accent}>🥦 Veggie</Badge>}
          {dish.nutrition.isGlutenFree && <Badge accent={accent}>🌾 Sin gluten</Badge>}
          {unavail && <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: '#b91c1c', background: 'rgba(185,28,28,0.08)', padding: '2px 8px', borderRadius: 999 }}>Agotado</span>}
        </div>
      </div>
    </Link>
  )
}

function Badge({ children, accent }: { children: ReactNode; accent: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: accent, background: `${accent}14`, padding: '2px 8px', borderRadius: 999 }}>{children}</span>
  )
}
