import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Search, Cuboid, X, Wheat } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { getThemeColors } from '@shared/utils/colorScale';
import { matchesQuery } from '@shared/utils/menuSearch';
import { AnnouncementBar, SocialsBar, InfoFooter, OrderButton, ReservationSection, PromoSection, FeaturedSection } from '../sections';
import type { MenuTemplateProps } from '../types';
import type { Dish } from '@core/domain/entities/Dish';
import type { TenantBranding } from '@core/domain/entities/Tenant';

// Panadería — hearty artisan bread, Vollkorn serif, wheat-gold, warm and homely.
const DISPLAY = '"Vollkorn", serif';
const BODY = 'var(--tenant-font, "Nunito Sans"), sans-serif';

const PAPER = '#fef6e6';
const CARD = '#fffdf7';
const INK = '#2f2414';
const MUTED = 'rgba(47,36,20,0.56)';
const HAIR = 'rgba(47,36,20,0.12)';

function loadFonts(): void {
  const id = 'pn-fonts';
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Vollkorn:ital,wght@0,500;0,600;0,700;0,800;1,500&family=Nunito+Sans:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
}

const fmt = (n: number, c: string): string =>
new Intl.NumberFormat('es-CR', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n);

export default function PanaderiaTemplate({ tenant, menu, table, groups, tenantId, featured }: MenuTemplateProps): ReactNode {
  useEffect(loadFonts, []);
  const tc = getThemeColors(tenant.branding);
  const accent = tc.primary;
  const heroH = { compact: 208, normal: 266, tall: 334 }[tenant.branding.heroHeight] ?? 266;
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

      <header className="relative shrink-0 overflow-hidden" style={{ height: heroH, background: hasCover ? '#231809' : `radial-gradient(ellipse at 50% 0%, ${accent}18 0%, transparent 55%), linear-gradient(180deg, #fdf3df 0%, #f3e2bf 100%)` }}>
        {hasCover ?
        <>
            <img src={tenant.branding.coverImageUrl ?? ''} alt={tenant.name} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: tenant.branding.coverOpacity }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(35,24,9,0.25) 0%, rgba(35,24,9,0.74) 100%)' }} />
          </> :
        null}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <Wheat size={26} style={{ color: hasCover ? '#fff' : accent, marginBottom: 10 }} />
          <span style={{ fontFamily: BODY, fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: hasCover ? 'rgba(255,255,255,0.82)' : MUTED, marginBottom: 8, paddingLeft: '0.38em' }}>Horno Artesanal</span>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(2rem,7.5vw,3rem)', color: hasCover ? '#fff' : INK, margin: 0, lineHeight: 1.04 }}>{tenant.name}</h1>
          {tenant.branding.tagline ? <p style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: '0.98rem', color: hasCover ? 'rgba(255,255,255,0.82)' : MUTED, marginTop: 6 }}>{tenant.branding.tagline}</p> : null}
          <span style={{ marginTop: 12, fontFamily: BODY, fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: hasCover ? 'rgba(255,255,255,0.8)' : INK, padding: '4px 12px', borderRadius: 999, border: `1px solid ${hasCover ? 'rgba(255,255,255,0.4)' : HAIR}` }}>{tableLabel}</span>
        </div>
      </header>

      {/* ── Sticky search & category nav ── */}
      <div className="sticky top-0 z-30 flex flex-col" style={{ background: 'rgba(254,246,230,0.95)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${HAIR}` }}>
        {tenant.branding.showSearch &&
        <div style={{ padding: '11px 16px 3px' }}>
            <div className="flex items-center gap-2.5" style={{ background: CARD, border: `1px solid ${HAIR}`, borderRadius: 12, padding: '11px 14px' }}>
            <Search size={15} style={{ color: accent, flexShrink: 0 }} />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar pan…" className="flex-1 bg-transparent focus:outline-none placeholder:opacity-45" style={{ color: INK, fontSize: '0.88rem', fontFamily: BODY }} />
            {query ? <button onClick={() => setQuery('')}><X size={14} style={{ color: MUTED }} /></button> : null}
          </div>
          </div>
        }
        <nav style={{ background: 'rgba(254, 246, 230, 0.95)', backdropFilter: 'blur(10px)' }}>
          <div className="flex overflow-x-auto scrollbar-hide" style={{ padding: '0 14px' }}>
          {groups.map((g) => {
              const isActive = active === g.category.id;
              return (
                <button key={g.category.id} onClick={() => scrollTo(g.category.id)} className="shrink-0 transition-all duration-150" style={{ padding: '14px 13px 12px', background: 'none', border: 'none', fontFamily: DISPLAY, fontWeight: isActive ? 700 : 500, fontSize: '0.92rem', color: isActive ? accent : MUTED, cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: `2px solid ${isActive ? accent : 'transparent'}` }}>
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

      <main style={{ maxWidth: 660, margin: '0 auto', padding: '14px 18px 96px' }}>
        {filtered ?
        <>
            <p style={{ fontFamily: BODY, fontWeight: 600, fontSize: '0.8rem', color: MUTED, padding: '10px 2px 14px' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
            <MenuCard dishes={filtered} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </> :
        groups.map((group) =>
        <section key={group.category.id} ref={(el) => {sectionRefs.current[group.category.id] = el;}} style={{ paddingTop: 30, scrollMarginTop: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14, padding: '0 2px' }}>
              <Wheat size={16} style={{ color: accent, flexShrink: 0 }} />
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.42rem', color: INK, margin: 0, lineHeight: 1.05 }}>{group.category.name}</h2>
              <span style={{ flex: 1, height: 1, background: HAIR }} />
              <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.7rem', color: MUTED }}>{group.dishes.length}</span>
            </div>
            {group.category.description ? <p style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: '0.9rem', color: MUTED, margin: '0 0 14px', padding: '0 2px' }}>{group.category.description}</p> : null}
            <MenuCard dishes={group.dishes} tenantId={tenantId} menuId={menu.id} accent={accent} branding={tenant.branding} />
          </section>
        )}
      </main>

      <div style={{ borderTop: `1px solid ${HAIR}` }}>
        <SocialsBar branding={tenant.branding} tc={tc} />
        <InfoFooter branding={tenant.branding} tc={tc} />
        <p style={{ textAlign: 'center', fontFamily: DISPLAY, fontStyle: 'italic', fontSize: '1.1rem', color: accent, padding: '16px 0 28px' }}>{tenant.name}</p>
      </div>
    </div>);

}

function MenuCard({ dishes, tenantId, menuId, accent, branding }: {dishes: Dish[];tenantId: string;menuId: string;accent: string;branding: TenantBranding;}): ReactNode {
  return (
    <div style={{ background: CARD, borderRadius: 14, border: `1px solid ${HAIR}`, boxShadow: '0 2px 12px rgba(47,36,20,0.05)', overflow: 'hidden' }}>
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
    <Link to={`/${tenantId}/menu/${menuId}/dish/${dish.id}`} className={cn('group flex items-stretch gap-3.5 transition-colors duration-150 active:bg-black/[0.03]', unavail && 'opacity-50')} style={{ textDecoration: 'none', padding: '14px 15px', borderBottom: divider ? `1px solid ${HAIR}` : 'none' }}>
      {hasImg ?
      <div className="relative shrink-0 overflow-hidden" style={{ width: 60, height: 60, borderRadius: 11 }}>
          <img src={dish.assets.imageUrl ?? ''} alt={dish.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {dish.assets.hasAR ? <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: `${accent}e6` }}><Cuboid size={7} />AR</span> : null}
        </div> :
      null}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="min-w-0 flex-1" style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.02rem', color: INK, margin: 0, lineHeight: 1.2 }}>{dish.name}</h3>
          {branding.showPrices ? <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '0.97rem', color: accent, whiteSpace: 'nowrap' }}>{fmt(dish.price.amount, dish.price.currency)}</span> : null}
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
            {unavail ? <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: '#b91c1c', background: 'rgba(185,28,28,0.08)', padding: '2px 8px', borderRadius: 999 }}>Agotado</span> : null}
          </div> :
        null}
      </div>
    </Link>);

}

function Badge({ children, accent }: {children: ReactNode;accent: string;}): ReactNode {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: BODY, fontWeight: 700, fontSize: '0.62rem', color: accent, background: `${accent}14`, padding: '2px 8px', borderRadius: 999 }}>{children}</span>;
}