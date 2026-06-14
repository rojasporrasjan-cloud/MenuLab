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

// La Trattoria — classic Italian, Playfair display, tricolore accent, dotted-leader rows.
const DISPLAY = '"Playfair Display", serif';
const BODY = 'var(--tenant-font, "Lato"), sans-serif';

const PAPER = '#f8ede3';
const CARD = '#fffdf9';
const INK = '#29201a';
const MUTED = 'rgba(41,32,26,0.55)';
const HAIR = 'rgba(41,32,26,0.13)';
const TRICOLORE = 'linear-gradient(90deg, #008c45 0 33.3%, #f4f5f0 33.3% 66.6%, #cd212a 66.6% 100%)';

function loadFonts(): void {
  const id = 'lt-fonts';
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,500&family=Lato:wght@400;500;700;900&display=swap';
  document.head.appendChild(link);
}

const fmt = (n: number, c: string): string =>
new Intl.NumberFormat('es-CR', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n);

export default function LaTrattoriaTemplate({ tenant, menu, table, groups, tenantId, featured }: MenuTemplateProps): ReactNode {
  useEffect(loadFonts, []);
  const tc = getThemeColors(tenant.branding);
  const accent = tc.primary;
  const heroH = { compact: 212, normal: 274, tall: 342 }[tenant.branding.heroHeight] ?? 274;
  const allDishes = groups.flatMap((g) => g.dishes);
  const tableLabel = table.label ?? `Mesa ${table.number}`;

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

      <header className="relative shrink-0 overflow-hidden" style={{ height: heroH, backgroundColor: '#1f130b' }}>
        {tenant.branding.coverImageUrl ?
        <img src={tenant.branding.coverImageUrl} alt={tenant.name} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: tenant.branding.coverOpacity }} /> :

        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 115%, ${accent}55 0%, transparent 58%), linear-gradient(170deg, #2a1810 0%, #170d07 100%)` }} />
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(15,8,4,0.3) 0%, rgba(15,8,4,0.12) 45%, rgba(15,8,4,0.74) 100%)' }} />
        <div className="absolute top-0 left-0 right-0" style={{ height: 5, background: TRICOLORE }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center">
          {tenant.branding.logoUrl ? <img src={tenant.branding.logoUrl} alt={tenant.name} className="mb-3 h-14 w-14 rounded-full object-cover" style={{ border: '2px solid rgba(255,255,255,0.4)' }} /> : null}
          <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', marginBottom: 10, paddingLeft: '0.38em' }}>Trattoria · Cucina</span>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(2.1rem,7.5vw,3.1rem)', color: '#fff', margin: 0, lineHeight: 1.0, letterSpacing: '-0.005em', textShadow: '0 2px 14px rgba(0,0,0,0.5)' }}>{tenant.name}</h1>
          {tenant.branding.tagline ? <p style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: '1rem', color: 'rgba(255,255,255,0.82)', marginTop: 6 }}>{tenant.branding.tagline}</p> : null}
          <span style={{ marginTop: 12, fontFamily: BODY, fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fff', padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.24)' }}>{tableLabel}</span>
        </div>
      </header>

      {/* ── Sticky search & category nav ── */}
      <div className="sticky top-0 z-30 flex flex-col" style={{ background: 'rgba(248,237,227,0.94)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${HAIR}` }}>
        {tenant.branding.showSearch &&
        <div style={{ padding: '11px 16px 3px' }}>
            <div className="flex items-center gap-2.5" style={{ background: CARD, border: `1px solid ${HAIR}`, borderRadius: 10, padding: '11px 14px' }}>
            <Search size={15} style={{ color: accent, flexShrink: 0 }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca…" className="flex-1 bg-transparent focus:outline-none placeholder:opacity-45" style={{ color: INK, fontSize: '0.88rem', fontFamily: BODY }} />
            {query ? <button onClick={() => setQuery('')}><X size={14} style={{ color: MUTED }} /></button> : null}
          </div>
          </div>
        }
        <nav style={{ background: 'rgba(248, 237, 227, 0.94)', backdropFilter: 'blur(10px)' }}>
          <div className="flex overflow-x-auto scrollbar-hide" style={{ padding: '0 14px' }}>
          {groups.map((g) => {
              const isActive = active === g.category.id;
              return (
                <button key={g.category.id} onClick={() => scrollTo(g.category.id)} className="shrink-0 transition-all duration-150" style={{ padding: '14px 13px 12px', background: 'none', border: 'none', fontFamily: DISPLAY, fontWeight: isActive ? 700 : 500, fontSize: '0.98rem', fontStyle: 'italic', color: isActive ? accent : MUTED, cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: `2px solid ${isActive ? accent : 'transparent'}` }}>
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
            <p style={{ fontFamily: BODY, fontWeight: 500, fontSize: '0.78rem', color: MUTED, padding: '12px 2px 14px', textAlign: 'center' }}>{filtered.length} risultati</p>
            <MenuCard dishes={filtered} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </> :
        groups.map((group) =>
        <section key={group.category.id} ref={(el) => {sectionRefs.current[group.category.id] = el;}} style={{ paddingTop: 32, scrollMarginTop: 58 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '0 2px' }}>
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.58rem', fontStyle: 'italic', color: INK, margin: 0, lineHeight: 1.05 }}>{group.category.name}</h2>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0 }} />
              <span style={{ flex: 1, height: 1, background: HAIR }} />
              <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.7rem', color: MUTED }}>{group.dishes.length}</span>
            </div>
            {group.category.description ? <p style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: '0.92rem', color: MUTED, margin: '0 0 14px', padding: '0 2px' }}>{group.category.description}</p> : null}
            <MenuCard dishes={group.dishes} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </section>
        )}
      </main>

      <div style={{ borderTop: `1px solid ${HAIR}` }}>
        <SocialsBar branding={tenant.branding} tc={tc} />
        <InfoFooter branding={tenant.branding} tc={tc} />
        <p style={{ textAlign: 'center', fontFamily: DISPLAY, fontStyle: 'italic', fontSize: '1.15rem', color: accent, padding: '18px 0 30px' }}>{tenant.name} · Buon appetito</p>
      </div>
    </div>);

}

function MenuCard({ dishes, tenantId, menuId, accent, branding }: {dishes: Dish[];tenantId: string;menuId: string;accent: string;branding: TenantBranding;}): ReactNode {
  return (
    <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${HAIR}`, boxShadow: '0 2px 12px rgba(41,32,26,0.05)', overflow: 'hidden' }}>
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
      <div className="relative shrink-0 overflow-hidden" style={{ width: 60, height: 60, borderRadius: 10 }}>
          <img src={dish.assets.imageUrl ?? ''} alt={dish.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {dish.assets.hasAR ? <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: `${accent}e6` }}><Cuboid size={7} />AR</span> : null}
        </div> :
      null}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.1rem', color: INK, margin: 0, lineHeight: 1.18, flexShrink: 1 }}>{dish.name}</h3>
          <span aria-hidden="true" style={{ flex: 1, minWidth: 12, borderBottom: `1px dotted ${HAIR}`, transform: 'translateY(-4px)' }}></span>
          {branding.showPrices ? <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.04rem', color: accent, whiteSpace: 'nowrap' }}>{fmt(dish.price.amount, dish.price.currency)}</span> : null}
        </div>
        {dish.description ?
        <p style={{ fontFamily: BODY, fontWeight: 400, fontSize: '0.78rem', color: MUTED, margin: '4px 0 0', lineHeight: 1.48, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{dish.description}</p> :
        null}
        {showBadges || !hasImg && dish.assets.hasAR || unavail ?
        <div className="flex flex-wrap items-center gap-1.5" style={{ marginTop: 8 }}>
            {!hasImg && dish.assets.hasAR ? <Badge accent={accent}><Cuboid size={9} />AR 3D</Badge> : null}
            {branding.showDietaryBadges && dish.nutrition.isVegan ? <Badge accent={accent}>🌱 Vegano</Badge> : null}
            {branding.showDietaryBadges && !dish.nutrition.isVegan && dish.nutrition.isVegetarian ? <Badge accent={accent}>🥦 Veggie</Badge> : null}
            {branding.showDietaryBadges && dish.nutrition.isGlutenFree ? <Badge accent={accent}>🌾 Sin gluten</Badge> : null}
            {unavail ? <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: '#b91c1c', background: 'rgba(185,28,28,0.08)', padding: '2px 8px', borderRadius: 999 }}>Agotado</span> : null}
          </div> :
        null}
      </div>
    </Link>);

}

function Badge({ children, accent }: {children: ReactNode;accent: string;}): ReactNode {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: accent, background: `${accent}12`, padding: '2px 8px', borderRadius: 999 }}>{children}</span>;
}