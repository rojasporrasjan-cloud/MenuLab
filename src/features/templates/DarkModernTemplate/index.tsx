import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Cuboid, Utensils, Search } from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { getThemeColors } from '@shared/utils/colorScale'
import { matchesQuery } from '@shared/utils/menuSearch'
import { AnnouncementBar, SocialsBar, InfoFooter, OrderButton, ReservationSection, PromoSection, FeaturedSection, ScheduleBanner } from '../sections'
import type { MenuTemplateProps } from '../types'
import type { Dish } from '@core/domain/entities/Dish'

const fmt = (n: number, c: string) =>
  new Intl.NumberFormat('es-CR', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n)

export default function DarkModernTemplate({ tenant, menu, table, groups, tenantId, featured }: MenuTemplateProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const tc = getThemeColors(tenant.branding)

  // Derivado: si el usuario no ha elegido categoría, cae a la primera disponible.
  const activeCategory = selectedCategory ?? groups[0]?.category.id ?? null
  const activeGroup = groups.find((g) => g.category.id === activeCategory) ?? groups[0]
  const heroH = { compact: 160, normal: 240, tall: 320 }[tenant.branding.heroHeight] ?? 240
  const allDishes = groups.flatMap((g) => g.dishes)
  const tableLabel = table.label ?? `Mesa ${table.number}`
  const [searchQuery, setSearchQuery] = useState('')
  const filteredDishes = searchQuery.trim()
    ? (activeGroup?.dishes ?? []).filter((d) => matchesQuery([d.name, d.description], searchQuery))
    : activeGroup?.dishes ?? []

  return (
    <div
      className="flex flex-col"
      style={{ background: tc.gradient, color: tc.text, fontFamily: tc.font, fontSize: tc.textScale, minHeight: '100svh' }}
    >
      <AnnouncementBar branding={tenant.branding} tc={tc} />
      <ScheduleBanner branding={tenant.branding} tc={tc} />
      <OrderButton branding={tenant.branding} tc={tc} />

      {/* ── Cinematic hero ─────────────────────────────────────────── */}
      <header className="relative shrink-0 overflow-hidden" style={{ height: heroH, backgroundColor: '#070709' }}>
        {tenant.branding.coverImageUrl ? (
          /\.(mp4|webm|mov)/i.test(tenant.branding.coverImageUrl)
            ? <video src={tenant.branding.coverImageUrl} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" style={{ opacity: tenant.branding.coverOpacity }} />
            : <img src={tenant.branding.coverImageUrl} alt={tenant.name} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: tenant.branding.coverOpacity }} />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse at 25% 60%, ${tc.primary}45 0%, transparent 65%), radial-gradient(ellipse at 80% 20%, ${tc.primary}18 0%, transparent 55%)` }}
          />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.92) 100%)' }} />

        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-3.5 px-5 pb-5">
          {tenant.branding.logoUrl ? (
            <img src={tenant.branding.logoUrl} alt={tenant.name} className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-2xl" style={{ border: '2px solid rgba(255,255,255,0.14)' }} />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-2xl" style={{ background: `linear-gradient(135deg, ${tc.primary}, ${tc.primary}99)`, border: '2px solid rgba(255,255,255,0.12)' }}>
              <Utensils size={22} className="text-white" />
            </div>
          )}
          <div className="min-w-0 pb-0.5">
            <h1 className="text-2xl font-black leading-tight tracking-tight text-white" style={{ textShadow: '0 2px 14px rgba(0,0,0,0.7)' }}>
              {tenant.name}
            </h1>
            {tenant.branding.tagline && (
              <p className="mt-0.5 text-sm leading-snug text-white/65">{tenant.branding.tagline}</p>
            )}
            <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999 }}>
              🪑 {tableLabel}
            </span>
          </div>
        </div>
      </header>

      {/* ── Top category bar ─────────────────────────────────────── */}
      <nav
        className="flex shrink-0 gap-0 overflow-x-auto scrollbar-hide z-10 shadow-sm"
        style={{ backgroundColor: `${tc.bg}f2`, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${tc.border}` }}
      >
        {groups.map((g) => {
          const isActive = activeCategory === g.category.id
          return (
            <button
              key={g.category.id}
              onClick={() => setSelectedCategory(g.category.id)}
              className="flex min-w-[76px] shrink-0 flex-1 flex-col items-center justify-center gap-0.5 px-3 py-3 transition-all duration-200"
              style={{ borderBottom: `2px solid ${isActive ? tc.primary : 'transparent'}` }}
            >
              <span
                className="line-clamp-1 text-center text-xs font-bold leading-tight"
                style={{ color: isActive ? tc.primary : tc.textMuted }}
              >
                {g.category.name}
              </span>
            </button>
          )
        })}
      </nav>

      {/* ── Scrollable content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {featured}
      <FeaturedSection branding={tenant.branding} tc={tc} dishes={allDishes} tenantId={tenantId} menuId={menu.id} />
        <ReservationSection branding={tenant.branding} tc={tc} />
        <PromoSection branding={tenant.branding} tc={tc} />

        {/* Search */}
        {tenant.branding.showSearch && (
          <div className="px-4 pt-4 pb-1">
            <div className="flex items-center gap-2.5 rounded-xl px-3.5 py-3" style={{ backgroundColor: tc.surface, border: `1px solid ${tc.border}` }}>
              <Search size={15} style={{ color: tc.primary }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar platillo…"
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:opacity-40"
                style={{ color: tc.text }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs" style={{ color: tc.textMuted }}>✕</button>
              )}
            </div>
          </div>
        )}

        {/* Section header */}
        {activeGroup && !searchQuery && (
          <div className="flex items-baseline gap-3 px-5 pb-2 pt-5">
            <h2 className="text-lg font-black tracking-tight" style={{ color: tc.text }}>{activeGroup.category.name}</h2>
            <div className="h-px flex-1" style={{ backgroundColor: tc.border }} />
            <span className="text-[11px] font-semibold" style={{ color: tc.textMuted }}>{activeGroup.dishes.length} platos</span>
          </div>
        )}

        {/* Dish rows grouped in a surface card */}
        <div className="px-4 pb-5 pt-2">
          <div style={{ background: tc.surface, border: `1px solid ${tc.border}`, borderRadius: tc.cardRadius, overflow: 'hidden' }}>
            {filteredDishes.map((dish, i) => (
              <DishRow
                key={dish.id}
                dish={dish}
                tenantId={tenantId}
                menuId={menu.id}
                tc={tc}
                showPrices={tenant.branding.showPrices}
                showDietaryBadges={tenant.branding.showDietaryBadges}
                divider={i < filteredDishes.length - 1}
              />
            ))}
          </div>
          {searchQuery && filteredDishes.length === 0 && (
            <p className="py-8 text-center text-sm" style={{ color: tc.textMuted }}>Sin resultados para "{searchQuery}"</p>
          )}
        </div>

        <SocialsBar branding={tenant.branding} tc={tc} />
        <InfoFooter branding={tenant.branding} tc={tc} />
      </div>

    </div>
  )
}

function DishRow({ dish, tenantId, menuId, tc, showPrices, showDietaryBadges, divider }: { dish: Dish; tenantId: string; menuId: string; tc: ReturnType<typeof getThemeColors>; showPrices: boolean; showDietaryBadges: boolean; divider: boolean }) {
  const unavailable = dish.status === 'unavailable'
  const hasImg = Boolean(dish.assets.imageUrl)
  return (
    <Link
      to={`/${tenantId}/menu/${menuId}/dish/${dish.id}`}
      className={cn('group flex items-stretch gap-3.5 transition-colors duration-150 active:bg-white/[0.03]', unavailable && 'opacity-45')}
      style={{ textDecoration: 'none', padding: '13px 14px', borderBottom: divider ? `1px solid ${tc.border}` : 'none' }}
    >
      {hasImg && (
        <div className="relative shrink-0 overflow-hidden" style={{ width: 64, height: 64, borderRadius: 12 }}>
          <img src={dish.assets.imageUrl ?? ''} alt={dish.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {dish.assets.hasAR && (
            <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white" style={{ background: `${tc.primary}e6` }}><Cuboid size={7} />AR</span>
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="min-w-0 flex-1 text-[0.95rem] font-bold leading-tight" style={{ color: tc.text }}>{dish.name}</h3>
          {showPrices && (
            <span className="whitespace-nowrap text-[0.95rem] font-extrabold" style={{ color: tc.primary }}>{fmt(dish.price.amount, dish.price.currency)}</span>
          )}
        </div>
        {dish.description && (
          <p className="mt-1 text-xs leading-relaxed" style={{ color: tc.textMuted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{dish.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5" style={{ marginTop: (showDietaryBadges && (dish.nutrition.isVegan || dish.nutrition.isVegetarian || dish.nutrition.isGlutenFree)) || (!hasImg && dish.assets.hasAR) || unavailable ? 7 : 0 }}>
          {!hasImg && dish.assets.hasAR && <Tag color={tc.primary}><Cuboid size={9} />AR 3D</Tag>}
          {showDietaryBadges && dish.nutrition.isVegan && <Tag color="#22c55e">🌱 Vegano</Tag>}
          {showDietaryBadges && !dish.nutrition.isVegan && dish.nutrition.isVegetarian && <Tag color="#10b981">🥦 Veggie</Tag>}
          {showDietaryBadges && dish.nutrition.isGlutenFree && <Tag color="#f59e0b">🌾 Sin gluten</Tag>}
          {unavailable && <span className="rounded-full px-2 py-0.5 text-[0.62rem] font-bold" style={{ color: '#fca5a5', background: 'rgba(248,113,113,0.12)' }}>Agotado</span>}
        </div>
      </div>
    </Link>
  )
}

function Tag({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.62rem] font-bold" style={{ color, background: `${color}1f`, border: `1px solid ${color}33` }}>
      {children}
    </span>
  )
}
