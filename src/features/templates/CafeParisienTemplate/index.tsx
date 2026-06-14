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

// Café Parisién — art déco, geometric Poiret display, slate accent, symmetric deco rules.
const DISPLAY = '"Poiret One", sans-serif';
const BODY = 'var(--tenant-font, "Jost"), sans-serif';

const PAPER = '#faf6f1';
const CARD = '#fffdfa';
const INK = '#20242b';
const MUTED = 'rgba(32,36,43,0.55)';
const HAIR = 'rgba(32,36,43,0.12)';

function loadFonts(): void {
  const id = 'cp-fonts';
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Poiret+One&family=Jost:wght@300;400;500;600;700&display=swap';
  document.head.appendChild(link);
}

const fmt = (n: number, c: string): string =>
new Intl.NumberFormat('es-CR', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n);

const DecoBars = ({ color }: {color: string;}): ReactNode =>
<span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 3, height: 16 }}>
    <span style={{ width: 1.5, height: 8, background: color }} />
    <span style={{ width: 1.5, height: 16, background: color }} />
    <span style={{ width: 1.5, height: 8, background: color }} />
  </span>;


export default function CafeParisienTemplate({ tenant, menu, table, groups, tenantId, featured }: MenuTemplateProps): ReactNode {
  useEffect(loadFonts, []);
  const tc = getThemeColors(tenant.branding);
  const accent = tc.primary;
  const heroH = { compact: 218, normal: 282, tall: 348 }[tenant.branding.heroHeight] ?? 282;
  const allDishes = groups.flatMap((g) => g.dishes);
  const tableLabel = table.label ?? `Mesa ${table.number}`;
  const hasCover = Boolean(tenant.branding.coverImageUrl);

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
    <div style={{ background: PAPER, minHeight: '100svh', color: INK, fontFamily: BODY, fontSize: tc.textScale }}>
      <AnnouncementBar branding={tenant.branding} tc={tc} />
      <OrderButton branding={tenant.branding} tc={tc} />

      <header className="relative shrink-0 overflow-hidden" style={{ height: heroH, background: hasCover ? '#15181d' : `linear-gradient(180deg, #fdfaf6 0%, #f3ece2 100%)` }}>
        {hasCover ?
        <>
            <img src={tenant.branding.coverImageUrl ?? ''} alt={tenant.name} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: tenant.branding.coverOpacity }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(21,24,29,0.3) 0%, rgba(21,24,29,0.78) 100%)' }} />
          </> :
        null}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center" style={{ margin: 16, border: `1px solid ${hasCover ? 'rgba(255,255,255,0.28)' : `${accent}40`}` }}>
          <DecoBars color={hasCover ? 'rgba(255,255,255,0.85)' : accent} />
          <span style={{ fontFamily: BODY, fontWeight: 400, fontSize: '0.58rem', letterSpacing: '0.5em', textTransform: 'uppercase', color: hasCover ? 'rgba(255,255,255,0.78)' : MUTED, margin: '12px 0 6px', paddingLeft: '0.5em' }}>Café · Brasserie</span>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: 'clamp(2.2rem,8vw,3.3rem)', color: hasCover ? '#fff' : INK, margin: 0, lineHeight: 1.0, letterSpacing: '0.04em' }}>{tenant.name}</h1>
          {tenant.branding.tagline ? <p style={{ fontFamily: BODY, fontWeight: 300, fontSize: '0.92rem', color: hasCover ? 'rgba(255,255,255,0.8)' : MUTED, marginTop: 8, letterSpacing: '0.04em' }}>{tenant.branding.tagline}</p> : null}
          <span style={{ marginTop: 12, fontFamily: BODY, fontWeight: 500, fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: hasCover ? 'rgba(255,255,255,0.78)' : accent }}>{tableLabel}</span>
        </div>
      </header>

      {/* ── Sticky search & category nav ── */}
      <div className="sticky top-0 z-30 flex flex-col" style={{ background: 'rgba(250,246,241,0.94)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${HAIR}` }}>
        {tenant.branding.showSearch &&
        <div style={{ padding: '11px 16px 3px' }}>
            <div className="flex items-center gap-2.5" style={{ background: CARD, border: `1px solid ${HAIR}`, borderRadius: 8, padding: '11px 14px' }}>
            <Search size={15} style={{ color: accent, flexShrink: 0 }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="flex-1 bg-transparent focus:outline-none placeholder:opacity-45" style={{ color: INK, fontSize: '0.88rem', fontFamily: BODY }} />
            {query ? <button onClick={() => setQuery('')}><X size={14} style={{ color: MUTED }} /></button> : null}
          </div>
          </div>
        }
        <nav style={{ background: 'rgba(250, 246, 241, 0.94)', backdropFilter: 'blur(10px)' }}>
          <div className="flex overflow-x-auto scrollbar-hide" style={{ padding: '0 14px' }}>
          {groups.map((g) => {
              const isActive = active === g.category.id;
              return (
                <button key={g.category.id} onClick={() => scrollTo(g.category.id)} className="shrink-0 transition-all duration-150" style={{ padding: '14px 13px 12px', background: 'none', border: 'none', fontFamily: BODY, fontWeight: isActive ? 600 : 400, fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: isActive ? accent : MUTED, cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: `1.5px solid ${isActive ? accent : 'transparent'}` }}>
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

      <main style={{ maxWidth: 660, margin: '0 auto', padding: '12px 18px 96px' }}>
        {filtered ?
        <>
            <p style={{ fontFamily: BODY, fontWeight: 400, fontSize: '0.78rem', color: MUTED, padding: '12px 2px 14px', textAlign: 'center', letterSpacing: '0.04em' }}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</p>
            <MenuCard dishes={filtered} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </> :
        groups.map((group) =>
        <section key={group.category.id} ref={(el) => {sectionRefs.current[group.category.id] = el;}} style={{ paddingTop: 32, scrollMarginTop: 58 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '0 2px' }}>
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: '1.5rem', color: INK, margin: 0, lineHeight: 1.05, letterSpacing: '0.04em' }}>{group.category.name}</h2>
              <span style={{ flex: 1, height: 1, background: HAIR }} />
              <DecoBars color={`${accent}cc`} />
            </div>
            {group.category.description ? <p style={{ fontFamily: BODY, fontWeight: 300, fontSize: '0.86rem', color: MUTED, margin: '0 0 14px', padding: '0 2px' }}>{group.category.description}</p> : null}
            <MenuCard dishes={group.dishes} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </section>
        )}
      </main>

      <div style={{ borderTop: `1px solid ${HAIR}` }}>
        <SocialsBar branding={tenant.branding} tc={tc} />
        <InfoFooter branding={tenant.branding} tc={tc} />
        <p style={{ textAlign: 'center', fontFamily: DISPLAY, fontWeight: 400, fontSize: '1.1rem', color: accent, padding: '18px 0 30px', letterSpacing: '0.05em' }}>{tenant.name}</p>
      </div>
    </div>);

}

function MenuCard({ dishes, tenantId, menuId, accent, branding }: {dishes: Dish[];tenantId: string;menuId: string;accent: string;branding: TenantBranding;}): ReactNode {
  return (
    <div style={{ background: CARD, borderRadius: 10, border: `1px solid ${HAIR}`, boxShadow: '0 2px 12px rgba(32,36,43,0.04)', overflow: 'hidden' }}>
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
    <Link to={`/${tenantId}/menu/${menuId}/dish/${dish.id}`} className={cn('group flex items-stretch gap-4 transition-colors duration-150 active:bg-black/[0.02]', unavail && 'opacity-50')} style={{ textDecoration: 'none', padding: '15px 16px', borderBottom: divider ? `1px solid ${HAIR}` : 'none' }}>
      {hasImg ?
      <div className="relative shrink-0 overflow-hidden" style={{ width: 60, height: 60, borderRadius: 6 }}>
          <img src={dish.assets.imageUrl ?? ''} alt={dish.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {dish.assets.hasAR ? <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: `${accent}e6` }}><Cuboid size={7} />AR</span> : null}
        </div> :
      null}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <h3 className="min-w-0 flex-1" style={{ fontFamily: DISPLAY, fontWeight: 400, fontSize: '1.12rem', color: INK, margin: 0, lineHeight: 1.18, letterSpacing: '0.01em' }}>{dish.name}</h3>
          {branding.showPrices ? <span style={{ fontFamily: BODY, fontWeight: 600, fontSize: '0.92rem', color: accent, whiteSpace: 'nowrap' }}>{fmt(dish.price.amount, dish.price.currency)}</span> : null}
        </div>
        {dish.description ?
        <p style={{ fontFamily: BODY, fontWeight: 300, fontSize: '0.79rem', color: MUTED, margin: '4px 0 0', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{dish.description}</p> :
        null}
        {showBadges || !hasImg && dish.assets.hasAR || unavail ?
        <div className="flex flex-wrap items-center gap-1.5" style={{ marginTop: 8 }}>
            {!hasImg && dish.assets.hasAR ? <Badge accent={accent}><Cuboid size={9} />AR 3D</Badge> : null}
            {branding.showDietaryBadges && dish.nutrition.isVegan ? <Badge accent={accent}>🌱 Vegano</Badge> : null}
            {branding.showDietaryBadges && !dish.nutrition.isVegan && dish.nutrition.isVegetarian ? <Badge accent={accent}>🥦 Veggie</Badge> : null}
            {branding.showDietaryBadges && dish.nutrition.isGlutenFree ? <Badge accent={accent}>🌾 Sin gluten</Badge> : null}
            {unavail ? <span style={{ fontFamily: BODY, fontWeight: 500, fontSize: '0.62rem', color: '#b91c1c', background: 'rgba(185,28,28,0.08)', padding: '2px 8px', borderRadius: 999 }}>Agotado</span> : null}
          </div> :
        null}
      </div>
    </Link>);

}

function Badge({ children, accent }: {children: ReactNode;accent: string;}): ReactNode {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: BODY, fontWeight: 500, fontSize: '0.62rem', color: accent, background: `${accent}12`, padding: '2px 8px', borderRadius: 999 }}>{children}</span>;
}