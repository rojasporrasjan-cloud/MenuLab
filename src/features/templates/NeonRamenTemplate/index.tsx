import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Search, Cuboid, X } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { getThemeColors } from '@shared/utils/colorScale';
import { matchesQuery } from '@shared/utils/menuSearch';
import { AnnouncementBar, SocialsBar, InfoFooter, OrderButton, ReservationSection, PromoSection, FeaturedSection } from '../sections';
import type { MenuTemplateProps } from '../types';
import type { Dish } from '@core/domain/entities/Dish';
import type { TenantBranding } from '@core/domain/entities/Tenant';

// Neon Ramen — total dark izakaya, Monoton neon sign, electric glow contained.
const DISPLAY = '"Monoton", sans-serif';
const BODY = 'var(--tenant-font, "Inter"), sans-serif';

const INKBG = '#121212';
const CARD = 'rgba(255,255,255,0.04)';
const TEXT = '#f4f4f5';
const MUTED = 'rgba(244,244,245,0.5)';
const HAIR = 'rgba(244,244,245,0.09)';

function loadFonts(): void {
  const id = 'nr-fonts';
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Monoton&family=Inter:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
}

const fmt = (n: number, c: string): string =>
new Intl.NumberFormat('es-CR', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n);

export default function NeonRamenTemplate({ tenant, menu, table, groups, tenantId, featured }: MenuTemplateProps): ReactNode {
  useEffect(loadFonts, []);
  const tc = getThemeColors(tenant.branding);
  const accent = tc.primary;
  const heroH = { compact: 212, normal: 276, tall: 344 }[tenant.branding.heroHeight] ?? 276;
  const allDishes = groups.flatMap((g) => g.dishes);
  const tableLabel = table.label ?? `Mesa ${table.number}`;
  const glow = `0 0 6px ${accent}, 0 0 18px ${accent}aa, 0 0 34px ${accent}66`;

  const [active, setActive] = useState<string | null>(groups[0]?.category.id ?? null);
  const [query, setQuery] = useState('');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({}); /* [COLMENA-FIX] SEM-003: TODO — Este useEffect + useState debería ser useMemo.
   // Ejemplo: const derivedValue = useMemo(() => transform(dep), [dep]);
   */useEffect(() => {
    if (!groups.length || typeof IntersectionObserver === 'undefined') return;
    const obs: IntersectionObserver[] = [];
    groups.forEach((g) => {
      const el = sectionRefs.current[g.category.id];
      if (!el) return;
      const o = new IntersectionObserver(([e]) => {if (e?.isIntersecting) setActive(g.category.id);}, { rootMargin: '-25% 0px -60% 0px' });
      o.observe(el);
      obs.push(o);
    });
    return () => obs.forEach((o) => o.disconnect());
  }, [groups]);

  const scrollTo = (id: string): void => sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const filtered = query.trim() ?
  allDishes.filter((d) => matchesQuery([d.name, d.description], query)) :
  null;

  return (
    <div style={{ background: INKBG, minHeight: '100svh', color: TEXT, fontFamily: BODY, fontSize: tc.textScale }}>
      <AnnouncementBar branding={tenant.branding} tc={tc} />
      <OrderButton branding={tenant.branding} tc={tc} />

      <header className="relative shrink-0 overflow-hidden" style={{ height: heroH, backgroundColor: '#0c0c0c' }}>
        {tenant.branding.coverImageUrl ?
        <img src={tenant.branding.coverImageUrl} alt={tenant.name} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: tenant.branding.coverOpacity }} /> :

        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 35%, ${accent}30 0%, transparent 58%), radial-gradient(ellipse at 80% 90%, #06b6d422 0%, transparent 50%), linear-gradient(180deg, #141414 0%, #0a0a0a 100%)` }} />
        }
        <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 3px)` }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center">
          <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.32em', textTransform: 'uppercase', color: accent, marginBottom: 16, paddingLeft: '0.32em', textShadow: `0 0 8px ${accent}aa` }}>営業中 · Open</span>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: 'clamp(1.9rem,7vw,2.9rem)', color: '#fff', margin: 0, lineHeight: 1.12, letterSpacing: '0.02em', textShadow: glow }}>{tenant.name}</h1>
          {tenant.branding.tagline ? <p style={{ fontFamily: BODY, fontWeight: 500, fontSize: '0.86rem', color: 'rgba(255,255,255,0.7)', marginTop: 14 }}>{tenant.branding.tagline}</p> : null}
          <span style={{ marginTop: 14, fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, padding: '4px 13px', borderRadius: 4, border: `1px solid ${accent}`, boxShadow: `0 0 10px ${accent}55, inset 0 0 8px ${accent}33` }}>🍜 {tableLabel}</span>
        </div>
      </header>

      {/* ── Sticky search & category nav ── */}
      <div className="sticky top-0 z-30 flex flex-col" style={{ background: 'rgba(18,18,18,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${HAIR}` }}>
        {tenant.branding.showSearch &&
        <div style={{ padding: '11px 16px 3px' }}>
            <div className="flex items-center gap-2.5" style={{ background: CARD, border: `1px solid ${HAIR}`, borderRadius: 6, padding: '11px 14px' }}>
            <Search size={15} style={{ color: accent, flexShrink: 0 }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" className="flex-1 bg-transparent focus:outline-none placeholder:opacity-45" style={{ color: TEXT, fontSize: '0.88rem', fontFamily: BODY }} />
            {query ? <button onClick={() => setQuery('')}><X size={14} style={{ color: MUTED }} /></button> : null}
          </div>
          </div>
        }
        <nav style={{ background: 'rgba(18, 18, 18, 0.9)', backdropFilter: 'blur(12px)' }}>
          <div className="flex overflow-x-auto scrollbar-hide" style={{ padding: '11px 12px', gap: 8 }}>
          {groups.map((g) => {
              const isActive = active === g.category.id;
              return (
                <button key={g.category.id} onClick={() => scrollTo(g.category.id)} className="shrink-0 transition-all duration-150 active:scale-95" style={{ padding: '7px 15px', borderRadius: 4, border: `1px solid ${isActive ? accent : HAIR}`, background: isActive ? `${accent}1a` : 'transparent', fontFamily: BODY, fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: isActive ? accent : MUTED, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: isActive ? `0 0 10px ${accent}44` : 'none' }}>
                {g.category.name}
              </button>);

            })}
        </div>
        </nav>
      </div>

      {featured}
      <FeaturedSection branding={tenant.branding} tc={tc} dishes={allDishes} tenantId={tenantId} menuId={menu.id} />
      <ReservationSection branding={tenant.branding} tc={tc} />
      <PromoSection branding={tenant.branding} tc={tc} />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '14px 16px 96px' }}>
        {filtered ?
        <>
            <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: '0.8rem', color: MUTED, padding: '8px 2px 14px' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
            <MenuCard dishes={filtered} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </> :
        groups.map((group) =>
        <section key={group.category.id} ref={(el) => {sectionRefs.current[group.category.id] = el;}} style={{ paddingTop: 28, scrollMarginTop: 62 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '0 2px' }}>
              <span style={{ width: 4, height: 18, background: accent, borderRadius: 2, boxShadow: `0 0 8px ${accent}`, flexShrink: 0 }} />
              <h2 style={{ fontFamily: BODY, fontWeight: 800, fontSize: '1.16rem', color: TEXT, margin: 0, lineHeight: 1.1, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{group.category.name}</h2>
              <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.7rem', color: accent, marginLeft: 'auto' }}>{group.dishes.length}</span>
            </div>
            {group.category.description ? <p style={{ fontFamily: BODY, fontSize: '0.82rem', color: MUTED, margin: '0 0 14px', padding: '0 2px' }}>{group.category.description}</p> : null}
            <MenuCard dishes={group.dishes} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </section>
        )}
      </main>

      <div style={{ borderTop: `1px solid ${HAIR}` }}>
        <SocialsBar branding={tenant.branding} tc={tc} />
        <InfoFooter branding={tenant.branding} tc={tc} />
        <p style={{ textAlign: 'center', fontFamily: DISPLAY, fontWeight: 400, fontSize: '1.1rem', color: '#fff', padding: '20px 0 30px', textShadow: glow }}>{tenant.name}</p>
      </div>
    </div>);

}

function MenuCard({ dishes, tenantId, menuId, accent, branding }: {dishes: Dish[];tenantId: string;menuId: string;accent: string;branding: TenantBranding;}): ReactNode {
  return (
    <div style={{ background: CARD, borderRadius: 8, border: `1px solid ${HAIR}`, overflow: 'hidden' }}>
      {dishes.map((dish, i) =>
      <DishRow key={dish.id} dish={dish} tenantId={tenantId} menuId={menuId} accent={accent} branding={branding} divider={i < dishes.length - 1} />
      )}
    </div>);

}

function DishRow({ dish, tenantId, menuId, accent, branding, divider }: {dish: Dish;tenantId: string;menuId: string;accent: string;branding: TenantBranding;divider: boolean;}): ReactNode {
  const unavail = dish.status === 'unavailable';
  const hasImg = Boolean(dish.assets.imageUrl);
  const showBadges = branding.showDietaryBadges && (dish.nutrition.isVegan || dish.nutrition.isVegetarian || dish.nutrition.isGlutenFree);
  return (
    <Link to={`/${tenantId}/menu/${menuId}/dish/${dish.id}`} className={cn('group flex items-stretch gap-3.5 transition-colors duration-150 active:bg-white/[0.03]', unavail && 'opacity-45')} style={{ textDecoration: 'none', padding: '14px 15px', borderBottom: divider ? `1px solid ${HAIR}` : 'none' }}>
      {hasImg ?
      <div className="relative shrink-0 overflow-hidden" style={{ width: 62, height: 62, borderRadius: 8 }}>
          <img src={dish.assets.imageUrl ?? ''} alt={dish.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {dish.assets.hasAR ? <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: `${accent}e6` }}><Cuboid size={7} />AR</span> : null}
        </div> :
      null}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="min-w-0 flex-1" style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.95rem', color: TEXT, margin: 0, lineHeight: 1.22 }}>{dish.name}</h3>
          {branding.showPrices ? <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: '0.93rem', color: accent, whiteSpace: 'nowrap', textShadow: `0 0 8px ${accent}66` }}>{fmt(dish.price.amount, dish.price.currency)}</span> : null}
        </div>
        {dish.description ?
        <p style={{ fontFamily: BODY, fontSize: '0.78rem', color: MUTED, margin: '3px 0 0', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{dish.description}</p> :
        null}
        {showBadges || !hasImg && dish.assets.hasAR || unavail ?
        <div className="flex flex-wrap items-center gap-1.5" style={{ marginTop: 7 }}>
            {!hasImg && dish.assets.hasAR ? <Badge accent={accent}><Cuboid size={9} />AR 3D</Badge> : null}
            {branding.showDietaryBadges && dish.nutrition.isVegan ? <Badge accent={accent}>🌱 Vegano</Badge> : null}
            {branding.showDietaryBadges && !dish.nutrition.isVegan && dish.nutrition.isVegetarian ? <Badge accent={accent}>🥦 Veggie</Badge> : null}
            {branding.showDietaryBadges && dish.nutrition.isGlutenFree ? <Badge accent={accent}>🌾 Sin gluten</Badge> : null}
            {unavail ? <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: '#fca5a5', background: 'rgba(248,113,113,0.12)', padding: '2px 8px', borderRadius: 999 }}>Agotado</span> : null}
          </div> :
        null}
      </div>
    </Link>);

}

function Badge({ children, accent }: {children: ReactNode;accent: string;}): ReactNode {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: accent, background: `${accent}1a`, border: `1px solid ${accent}33`, padding: '1px 8px', borderRadius: 999 }}>{children}</span>;
}