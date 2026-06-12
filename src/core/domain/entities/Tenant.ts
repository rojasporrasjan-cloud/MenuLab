export type TenantPlan = 'free' | 'starter' | 'pro' | 'enterprise'
export type TenantStatus = 'active' | 'suspended' | 'trial'

export type CardStyle    = 'sharp' | 'rounded' | 'pill'
export type TextScale   = 'sm' | 'md' | 'lg'
export type ShadowDepth = 'flat' | 'soft' | 'deep'
export type HeroHeight  = 'compact' | 'normal' | 'tall'
export type ImageRounding = 'none' | 'sm' | 'lg' | 'xl'
export type GradientDirection = '180deg' | '135deg' | '90deg'

// ── Page section objects ───────────────────────────────────────────────────────

export interface TenantAnnouncement {
  enabled: boolean
  text: string
  emoji: string
  bgColor: string | null  // null = use primary color
}

export interface TenantSocials {
  enabled: boolean
  instagram: string
  facebook: string
  tiktok: string
  whatsapp: string
}

export interface TenantInfoFooter {
  enabled: boolean
  hours: string
  address: string
  phone: string
}

/** Disposición visual del botón de pedidos por WhatsApp. */
export type OrderButtonVariant = 'floating' | 'bar'

export interface TenantOrderButton {
  enabled: boolean
  whatsapp: string
  label: string
  /** Flotante (píldora/FAB) o barra fija a lo ancho. Default: 'floating'. */
  variant?: OrderButtonVariant
  /** Mostrar solo el ícono de WhatsApp, sin texto. Default: false. */
  iconOnly?: boolean
}

export interface TenantBgGradient {
  enabled: boolean
  from: string
  to: string
  direction: GradientDirection
}

export interface TenantReservation {
  enabled: boolean
  title: string
  phone: string
  bookingUrl: string
  buttonLabel: string
}

export interface TenantPromo {
  enabled: boolean
  title: string
  description: string
  imageUrl: string | null
  ctaLabel: string
  ctaLink: string
}

export interface TenantFeatured {
  enabled: boolean
  title: string
  dishIds: string[]
}

export interface TenantBranding {
  primaryColor: string
  backgroundColor: string
  fontFamily: string
  logoUrl: string | null
  coverImageUrl: string | null
  tagline: string | null
  cardStyle: CardStyle
  coverOpacity: number
  textScale: TextScale
  shadowDepth: ShadowDepth
  heroHeight: HeroHeight
  showPrices: boolean
  showDietaryBadges: boolean
  imageRounding: ImageRounding
  showSearch: boolean
  bgGradient: TenantBgGradient
  detailsCardStyle?: 'glass' | 'solid'
  detailsCardOptionStyle?: 'list' | 'pills'
  detailsCardShowImage?: boolean
  defaultLanguage?: MenuLanguage
  // Page sections
  announcement: TenantAnnouncement
  socials: TenantSocials
  infoFooter: TenantInfoFooter
  orderButton: TenantOrderButton
  reservation: TenantReservation
  promo: TenantPromo
  featuredSection: TenantFeatured
}

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Outfit', label: 'Outfit' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Playfair Display', label: 'Playfair Display' },
] as const

export type FontFamily = (typeof FONT_OPTIONS)[number]['value']

export interface TenantFeatureFlags {
  arEnabled: boolean
  analyticsEnabled: boolean
  multiLanguageEnabled: boolean
  loyaltyEnabled: boolean
  qrGeneratorEnabled: boolean
  orderingEnabled: boolean
  reservationsEnabled: boolean
}

/** Configuración del programa de lealtad (sellos digitales). */
export interface LoyaltyConfig {
  readonly stampsForReward: number
  readonly rewardDescription: string
  readonly stampLabel: string
}

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  stampsForReward: 10,
  rewardDescription: 'Recompensa gratis',
  stampLabel: '⭐',
}

export type MenuLanguage = 'es' | 'en'

export type TemplateId =
  | 'dark-modern' | 'light-minimal' | 'warm-bistro'
  | 'carta-negra' | 'menu-autor'
  | 'neon-ramen' | 'taqueria-viva' | 'la-trattoria' | 'cafe-parisien' | 'burger-joint'
  | 'sushi-zen' | 'mediterraneo' | 'steakhouse' | 'vegan-garden' | 'retro-diner'
  | 'artisan-coffee' | 'pizza-rustica' | 'patisserie' | 'wine-bodega' | 'tapas-bar'
  | 'soda-tica' | 'marisqueria' | 'cevicheria' | 'comida-corrida' | 'panaderia' | 'heladeria'

export interface Tenant {
  id: string
  slug: string
  name: string
  plan: TenantPlan
  status: TenantStatus
  templateId: TemplateId
  branding: TenantBranding
  features: TenantFeatureFlags
  timezone: string
  locale: string
  employeePinHash: string | null
  loyaltyConfig: LoyaltyConfig
  onboardingCompletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
