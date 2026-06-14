import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Search, Cuboid, X, Soup } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { getThemeColors } from '@shared/utils/colorScale';
import { matchesQuery } from '@shared/utils/menuSearch';
import { AnnouncementBar, SocialsBar, InfoFooter, OrderButton, ReservationSection, PromoSection, FeaturedSection } from '../sections';
import type { MenuTemplateProps } from '../types';
import type { Dish } from '@core/domain/entities/Dish';
import type { TenantBranding } from '@core/domain/entities/Tenant';

// Comida Corrida — honest LATAM lunch board, sturdy slab serif, warm efficiency.
const DISPLAY = '"Bitter", serif';
const BODY = 'var(--tenant-font, "Karla"), sans-serif';

const PAPER = '#fdf6ec';
const CARD = '#fffefb';
const INK = '#2b211b';
const MUTED = 'rgba(43,33,27,0.56)';
const HAIR = 'rgba(43,33,27,0.10)';

function loadFonts(): void {
  const id = 'cc-fonts';
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Bitter:wght@400;500;700;800;900&family=Karla:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
}

const fmt = (n: number, c: string): string =>
new Intl.NumberFormat('es-CR', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n);

export default function ComidaCorridaTemplate({ tenant, menu, table, groups, tenantId, featured }: MenuTemplateProps): ReactNode {
  useEffect(loadFonts, []);
  const tc = getThemeColors(tenant.branding);
  const accent = tc.primary;
  const heroH = { compact: 200, normal: 252, tall: 320 }[tenant.branding.heroHeight] ?? 252;
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

      <header className="relative shrink-0 overflow-hidden" style={{ height: heroH, backgroundColor: '#2a160c' }}>
        {tenant.branding.coverImageUrl ?
        <img src={tenant.branding.coverImageUrl} alt={tenant.name} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: tenant.branding.coverOpacity }} /> :

        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 18% 30%, ${accent}50 0%, transparent 58%), linear-gradient(160deg, #34190d 0%, #1f0f07 100%)` }} />
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(110deg, rgba(15,8,3,0.7) 0%, rgba(15,8,3,0.25) 55%, rgba(15,8,3,0.55) 100%)' }} />

        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-6">
          <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: BODY, fontWeight: 800, fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fff', background: accent, padding: '5px 12px', borderRadius: 4, marginBottom: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}>
            <Soup size={13} /> Menú del día
          </span>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 'clamp(1.9rem,6.5vw,2.7rem)', color: '#fff', margin: 0, lineHeight: 1.02, letterSpacing: '-0.015em', textShadow: '0 2px 14px rgba(0,0,0,0.5)' }}>{tenant.name}</h1>
          {tenant.branding.tagline ? <p style={{ fontFamily: BODY, fontWeight: 500, fontSize: '0.86rem', color: 'rgba(255,255,255,0.78)', marginTop: 6 }}>{tenant.branding.tagline}</p> : null}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start', fontFamily: BODY, fontWeight: 700, fontSize: '0.64rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', padding: '4px 11px', borderRadius: 4, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)' }}>🍽 {tableLabel}</span>
        </div>
      </header>

      {/* ── Sticky search & category nav ── */}
      <div className="sticky top-0 z-30 flex flex-col" style={{ background: 'rgba(253,246,236,0.94)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${HAIR}` }}>
        {tenant.branding.showSearch &&
        <div style={{ padding: '11px 16px 3px' }}>
            <div className="flex items-center gap-2.5" style={{ background: CARD, border: `1px solid ${HAIR}`, borderRadius: 8, padding: '10px 14px' }}>
            <Search size={15} style={{ color: accent, flexShrink: 0 }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar platillo…" className="flex-1 bg-transparent focus:outline-none placeholder:opacity-45" style={{ color: INK, fontSize: '0.88rem', fontFamily: BODY }} />
            {query ? <button onClick={() => setQuery('')}><X size={14} style={{ color: MUTED }} /></button> : null}
          </div>
          </div>
        }
        <nav style={{ background: 'rgba(253, 246, 236, 0.94)', backdropFilter: 'blur(10px)' }}>
          <div className="flex overflow-x-auto scrollbar-hide" style={{ padding: '11px 12px', gap: 8 }}>
          {groups.map((g) => {
              const isActive = active === g.category.id;
              return (
                <button key={g.category.id} onClick={() => scrollTo(g.category.id)} className="shrink-0 transition-all duration-150 active:scale-95" style={{ padding: '7px 15px', borderRadius: 6, border: `1.5px solid ${isActive ? accent : HAIR}`, background: isActive ? accent : 'transparent', fontFamily: BODY, fontWeight: 700, fontSize: '0.82rem', color: isActive ? '#fff' : MUTED, cursor: 'pointer', whiteSpace: 'nowrap' }}>
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
            <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: '0.8rem', color: MUTED, padding: '6px 2px 12px' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
            <MenuCard dishes={filtered} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </> :
        groups.map((group) =>
        <section key={group.category.id} ref={(el) => {sectionRefs.current[group.category.id] = el;}} style={{ paddingTop: 24, scrollMarginTop: 64 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, background: `${accent}12`, borderLeft: `4px solid ${accent}`, borderRadius: '0 6px 6px 0', padding: '9px 13px' }}>
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: '1.12rem', color: INK, margin: 0, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{group.category.name}</h2>
              <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.68rem', color: accent, marginLeft: 'auto', background: CARD, padding: '2px 9px', borderRadius: 999 }}>{group.dishes.length}</span>
            </div>
            {group.category.description ? <p style={{ fontFamily: BODY, fontSize: '0.82rem', color: MUTED, margin: '0 0 12px', padding: '0 2px' }}>{group.category.description}</p> : null}
            <MenuCard dishes={group.dishes} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </section>
        )}
      </main>

      <div style={{ borderTop: `1px solid ${HAIR}` }}>
        <SocialsBar branding={tenant.branding} tc={tc} />
        <InfoFooter branding={tenant.branding} tc={tc} />
        <p style={{ textAlign: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: '0.92rem', color: accent, padding: '16px 0 28px', letterSpacing: '0.02em' }}>{tenant.name} · Buen provecho</p>
      </div>
    </div>);

}

function MenuCard({ dishes, tenantId, menuId, accent, branding }: {dishes: Dish[];tenantId: string;menuId: string;accent: string;branding: TenantBranding;}): ReactNode {
  return (
    <div style={{ background: CARD, borderRadius: 10, border: `1px solid ${HAIR}`, boxShadow: '0 2px 10px rgba(43,33,27,0.05)', overflow: 'hidden' }}>
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
    <Link to={`/${tenantId}/menu/${menuId}/dish/${dish.id}`} className={cn('group flex items-stretch gap-3 transition-colors duration-150 active:bg-black/[0.03]', unavail && 'opacity-50')} style={{ textDecoration: 'none', padding: '13px 14px', borderBottom: divider ? `1px solid ${HAIR}` : 'none' }}>
      {hasImg ?
      <div className="relative shrink-0 overflow-hidden" style={{ width: 60, height: 60, borderRadius: 8 }}>
          <img src={dish.assets.imageUrl ?? ''} alt={dish.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {dish.assets.hasAR ? <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: `${accent}e6` }}><Cuboid size={7} />AR</span> : null}
        </div> :
      null}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="min-w-0 flex-1" style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '0.96rem', color: INK, margin: 0, lineHeight: 1.22 }}>{dish.name}</h3>
          {branding.showPrices ? <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: '0.95rem', color: accent, whiteSpace: 'nowrap' }}>{fmt(dish.price.amount, dish.price.currency)}</span> : null}
        </div>
        {dish.description ?
        <p style={{ fontFamily: BODY, fontSize: '0.78rem', color: MUTED, margin: '3px 0 0', lineHeight: 1.42, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{dish.description}</p> :
        null}
        {showBadges || !hasImg && dish.assets.hasAR || unavail ?
        <div className="flex flex-wrap items-center gap-1.5" style={{ marginTop: 7 }}>
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
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: accent, background: `${accent}14`, padding: '2px 8px', borderRadius: 999 }}>{children}</span>;
}