import { Clock, MapPin, Phone, Calendar, Star, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { TenantBranding } from '@core/domain/entities/Tenant'
import type { ThemeColors } from '@shared/utils/colorScale'
import type { Dish } from '@core/domain/entities/Dish'
import { cn } from '@shared/utils/cn'
import { WhatsAppIcon } from '@shared/ui/icons/WhatsAppIcon'

// ── Announcement Bar ──────────────────────────────────────────────────────────

export function AnnouncementBar({ branding, tc }: { branding: TenantBranding; tc: ThemeColors }) {
  if (!branding.announcement.enabled || !branding.announcement.text.trim()) return null
  const bg = branding.announcement.bgColor ?? tc.primary
  return (
    <div
      className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 text-center"
      style={{ backgroundColor: bg }}
    >
      {branding.announcement.emoji && (
        <span className="text-sm leading-none">{branding.announcement.emoji}</span>
      )}
      <p className="text-xs font-semibold text-white leading-tight">{branding.announcement.text}</p>
    </div>
  )
}

// ── Social brand icons (not in lucide) ───────────────────────────────────────

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.88a8.13 8.13 0 004.76 1.52V7.01a4.85 4.85 0 01-.99-.32z"/>
    </svg>
  )
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  )
}

// ── Socials Bar ───────────────────────────────────────────────────────────────

export function SocialsBar(_props: { branding: TenantBranding; tc: ThemeColors }) {
  // Las redes ahora están integradas dentro de InfoFooter.
  return null
}

// ── Info Footer (Premium Card Design) ───────────────────────────────────────

export function InfoFooter({ branding, tc }: { branding: TenantBranding; tc: ThemeColors }) {
  if (!branding.infoFooter.enabled) return null
  const info = branding.infoFooter
  const socials = branding.socials

  // Generar URL del mapa a partir de la dirección
  const mapEmbedUrl = info.address
    ? `https://www.google.com/maps?q=${encodeURIComponent(info.address)}&output=embed`
    : null

  const hasContactLinks = info.phone || socials.whatsapp || socials.instagram || socials.facebook || socials.tiktok

  return (
    <div
      className="shrink-0 flex flex-col items-center px-4 py-10"
      style={{ borderTop: `1px solid ${tc.border}` }}
    >
      {/* Título de la sección */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center justify-center h-8 w-8 rounded-full mb-2" style={{ backgroundColor: `${tc.primary}15`, border: `1px solid ${tc.primary}30` }}>
          <MapPin size={14} style={{ color: tc.primary }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: tc.primary, fontFamily: 'serif', fontStyle: 'italic' }}>
          Encuéntranos
        </h2>
      </div>

      {/* Tarjeta de Información Principal */}
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-xl flex flex-col"
        style={{
          backgroundColor: tc.surface,
          border: `1px solid ${tc.border}`,
          boxShadow: `0 10px 30px rgba(0,0,0,0.08)`,
        }}
      >
        {/* Mapa Incrustado */}
        {mapEmbedUrl && (
          <div className="w-full h-40 bg-zinc-100 relative">
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación en el mapa"
            />
          </div>
        )}

        <div className="p-5 flex flex-col gap-6">
          {/* Dirección */}
          {info.address && (
            <div className="flex items-start gap-4">
              <div className="mt-1 flex items-center justify-center h-8 w-8 rounded-full shrink-0" style={{ backgroundColor: `${tc.text}08` }}>
                <MapPin size={14} style={{ color: tc.primary }} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: tc.textMuted }}>Dirección</span>
                <span className="text-sm font-semibold leading-snug" style={{ color: tc.text }}>{info.address}</span>
              </div>
            </div>
          )}

          {/* Horario */}
          {info.hours && (
            <div className="flex items-start gap-4">
              <div className="mt-1 flex items-center justify-center h-8 w-8 rounded-full shrink-0" style={{ backgroundColor: `${tc.text}08` }}>
                <Clock size={14} style={{ color: tc.textMuted }} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: tc.textMuted }}>Horario de Atención</span>
                <span className="text-sm font-semibold leading-snug" style={{ color: tc.text }}>{info.hours}</span>
              </div>
            </div>
          )}

          {/* Contacto & Redes (Píldoras) */}
          {hasContactLinks && (
            <div className="flex items-start gap-4">
              <div className="mt-1 flex items-center justify-center h-8 w-8 rounded-full shrink-0" style={{ backgroundColor: `${tc.text}08` }}>
                <Phone size={14} style={{ color: tc.textMuted }} />
              </div>
              <div className="flex flex-col w-full">
                <span className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: tc.textMuted }}>Contacto</span>
                {info.phone && <span className="text-sm font-bold leading-snug mb-3" style={{ color: tc.text }}>{info.phone}</span>}
                
                <div className="flex flex-wrap gap-2 mt-1">
                  {socials.whatsapp && (
                    <a
                      href={`https://wa.me/${socials.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95"
                      style={{ backgroundColor: 'rgba(37, 211, 102, 0.1)', color: '#25D366', border: '1px solid rgba(37, 211, 102, 0.2)' }}
                    >
                      <WhatsAppIcon size={12} /> WhatsApp
                    </a>
                  )}
                  {info.phone && (
                    <a
                      href={`tel:${info.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95"
                      style={{ backgroundColor: `${tc.primary}15`, color: tc.primary, border: `1px solid ${tc.primary}30` }}
                    >
                      <Phone size={12} /> Llamar
                    </a>
                  )}
                  {socials.instagram && (
                    <a
                      href={`https://instagram.com/${socials.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95"
                      style={{ backgroundColor: 'rgba(225, 48, 108, 0.1)', color: '#E1306C', border: '1px solid rgba(225, 48, 108, 0.2)' }}
                    >
                      <InstagramIcon size={12} /> Instagram
                    </a>
                  )}
                  {socials.facebook && (
                    <a
                      href={socials.facebook.startsWith('http') ? socials.facebook : `https://facebook.com/${socials.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95"
                      style={{ backgroundColor: 'rgba(24, 119, 242, 0.1)', color: '#1877F2', border: '1px solid rgba(24, 119, 242, 0.2)' }}
                    >
                      <FacebookIcon size={12} /> Facebook
                    </a>
                  )}
                  {socials.tiktok && (
                    <a
                      href={`https://tiktok.com/@${socials.tiktok.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', color: tc.text, border: `1px solid ${tc.border}` }}
                    >
                      <TikTokIcon size={12} /> TikTok
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botones Flotantes de Navegación debajo de la tarjeta */}
      {(info.wazeUrl || info.googleMapsUrl) && (
        <div className="w-full max-w-lg mt-8 flex flex-col items-center">
          <p className="text-xs font-medium text-center mb-4 px-6" style={{ color: tc.textMuted }}>
            {info.address}
          </p>
          <div className="flex gap-3 w-full">
            {info.googleMapsUrl && (
              <a
                href={info.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all active:scale-95 shadow-md"
                style={{ backgroundColor: '#4285F4', color: '#ffffff', borderRadius: '14px' }}
              >
                <MapPin size={16} /> Google Maps
              </a>
            )}
            {info.wazeUrl && (
              <a
                href={info.wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all active:scale-95 shadow-md"
                style={{ backgroundColor: '#00c3ff', color: '#ffffff', borderRadius: '14px' }}
              >
                <MapPin size={16} /> Waze
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Reservation Section ───────────────────────────────────────────────────────

export function ReservationSection({ branding, tc }: { branding: TenantBranding; tc: ThemeColors }) {
  if (!branding.reservation.enabled) return null
  const { title, phone, bookingUrl, buttonLabel } = branding.reservation
  const hasPhone = phone.trim().length > 0
  const hasUrl = bookingUrl.trim().length > 0
  if (!hasPhone && !hasUrl) return null

  return (
    <div className="shrink-0 px-4 py-4" style={{ borderTop: `1px solid ${tc.border}` }}>
      <div
        className="flex flex-col gap-3 rounded-2xl px-5 py-4 overflow-hidden"
        style={{ backgroundColor: tc.surface, border: `1px solid ${tc.border}` }}
      >
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: tc.primary }} />
          <h3 className="text-sm font-bold" style={{ color: tc.text }}>{title || 'Reserva tu mesa'}</h3>
        </div>
        <div className="flex gap-2">
          {hasPhone && (
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all active:scale-95"
              style={{ backgroundColor: tc.surface, border: `1px solid ${tc.border}`, borderRadius: '999px', color: tc.text }}
            >
              <Phone size={13} style={{ color: tc.primary }} />
              Llamar
            </a>
          )}
          {hasUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white transition-all active:scale-95"
              style={{ backgroundColor: tc.primary, borderRadius: '999px' }}
            >
              <Calendar size={13} />
              {buttonLabel || 'Reservar'}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Promo Section ─────────────────────────────────────────────────────────────

export function PromoSection({ branding, tc }: { branding: TenantBranding; tc: ThemeColors }) {
  if (!branding.promo.enabled) return null
  const { title, description, imageUrl, ctaLabel, ctaLink } = branding.promo
  if (!title.trim()) return null

  return (
    <div className="shrink-0 px-4 py-4" style={{ borderTop: `1px solid ${tc.border}` }}>
      <div
        className="overflow-hidden"
        style={{ borderRadius: '20px', border: `1px solid ${tc.border}`, backgroundColor: tc.surface }}
      >
        {imageUrl && (
          <div className="relative h-32 overflow-hidden">
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
          </div>
        )}
        <div className="flex flex-col gap-2 px-4 py-4">
          <h3 className="text-sm font-bold" style={{ color: tc.text }}>{title}</h3>
          {description && <p className="text-xs leading-relaxed" style={{ color: tc.textMuted }}>{description}</p>}
          {ctaLabel && (
            <a
              href={ctaLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 self-start flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white transition-all active:scale-95"
              style={{ backgroundColor: tc.primary, borderRadius: '999px' }}
            >
              {ctaLabel}
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Featured Dishes Section ───────────────────────────────────────────────────

export function FeaturedSection({ branding, tc, dishes, tenantId, menuId }: {
  branding: TenantBranding
  tc: ThemeColors
  dishes: Dish[]
  tenantId: string
  menuId: string
}) {
  if (!branding.featuredSection.enabled) return null

  const featured = branding.featuredSection.dishIds.length > 0
    ? dishes.filter((d) => branding.featuredSection.dishIds.includes(d.id))
    : dishes.slice(0, 4)

  if (featured.length === 0) return null

  return (
    <div className="shrink-0 py-5" style={{ borderTop: `1px solid ${tc.border}` }}>
      <div className="flex items-center gap-2 px-5 mb-3">
        <Star size={14} style={{ color: tc.primary }} />
        <h3 className="text-sm font-bold" style={{ color: tc.text }}>
          {branding.featuredSection.title || 'Nuestros favoritos'}
        </h3>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {featured.map((dish) => (
          <Link
            key={dish.id}
            to={`/${tenantId}/menu/${menuId}/dish/${dish.id}`}
            className="shrink-0 flex flex-col overflow-hidden transition-all active:scale-95"
            style={{ width: 130, borderRadius: tc.cardRadius, backgroundColor: tc.surface, border: `1px solid ${tc.border}` }}
          >
            <div className="relative overflow-hidden" style={{ height: 100 }}>
              {dish.assets.imageUrl ? (
                <img src={dish.assets.imageUrl} alt={dish.name} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${tc.primary}12, ${tc.primary}28)` }}>
                  <span className="text-2xl opacity-30">🍽</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-0.5 px-2.5 py-2">
              <span className="text-[11px] font-semibold line-clamp-2 leading-tight" style={{ color: tc.text }}>{dish.name}</span>
              <span className="text-[11px] font-bold" style={{ color: tc.primary }}>
                {new Intl.NumberFormat('es-CR', { style: 'currency', currency: dish.price.currency, minimumFractionDigits: 0 }).format(dish.price.amount)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Order Floating Button ─────────────────────────────────────────────────────

export function OrderButton({ branding, tc }: { branding: TenantBranding; tc: ThemeColors }) {
  const ob = branding.orderButton
  if (!ob.enabled) return null

  const number = ob.whatsapp.replace(/\D/g, '')
  const href = number
    ? `https://wa.me/${number}?text=${encodeURIComponent('Hola, quiero hacer un pedido 🍽️')}`
    : '#'
  const label = ob.label || 'Ordenar ahora'
  const variant = ob.variant ?? 'floating'
  const iconOnly = ob.iconOnly ?? false

  // Barra fija a lo ancho de la pantalla (estilo "fijo").
  if (variant === 'bar') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2.5 px-5 py-4 font-bold text-sm text-white transition-all active:scale-[0.99]"
        style={{ backgroundColor: tc.primary, boxShadow: '0 -4px 20px rgba(0,0,0,0.18)' }}
      >
        <WhatsAppIcon size={20} />
        {!iconOnly && label}
      </a>
    )
  }

  // Flotante: píldora con texto o, si es solo ícono, FAB circular.
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center justify-center text-white transition-all active:scale-95 hover:opacity-90',
        iconOnly ? 'h-14 w-14 rounded-full' : 'gap-2 px-5 py-3 rounded-full font-bold text-sm',
      )}
      style={{
        backgroundColor: tc.primary,
        boxShadow: `0 4px 20px ${tc.primary}55, 0 2px 8px rgba(0,0,0,0.15)`,
      }}
    >
      <WhatsAppIcon size={iconOnly ? 26 : 18} />
      {!iconOnly && label}
    </a>
  )
}
