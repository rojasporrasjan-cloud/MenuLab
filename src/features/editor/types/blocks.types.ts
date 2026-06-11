import type { TemplateId } from '@core/domain/entities/Tenant'

// ─── Legacy block system (v1) — kept for migration only ──────────────────────
// Do not use in new code. Will be removed when all tenants migrate to v2.

interface BlockBase<T extends string, D> {
  readonly id: string
  readonly type: T
  readonly visible: boolean
  readonly order: number
  readonly data: D
}

export interface HeroBlockData {
  readonly title: string
  readonly tagline: string | null
  readonly coverImageUrl: string | null
  readonly coverOpacity: number
  readonly logoUrl: string | null
  readonly heroHeight: 'compact' | 'normal' | 'tall'
}
export type HeroBlock = BlockBase<'hero', HeroBlockData>

export interface AnnouncementBlockData {
  readonly message: string
  readonly linkLabel: string | null
  readonly linkUrl: string | null
}
export type AnnouncementBlock = BlockBase<'announcement', AnnouncementBlockData>

export interface FeaturedBlockData {
  readonly title: string
  readonly dishIds: readonly string[]
  readonly maxItems: number
}
export type FeaturedBlock = BlockBase<'featured', FeaturedBlockData>

export interface MenuSectionBlockData {
  readonly categoryId: string
  readonly layout: 'grid' | 'list'
  readonly showDescription: boolean
  readonly showImages: boolean
}
export type MenuSectionBlock = BlockBase<'menu-section', MenuSectionBlockData>

export interface PromoBlockData {
  readonly headline: string
  readonly subtext: string | null
  readonly imageUrl: string | null
  readonly ctaLabel: string | null
  readonly ctaUrl: string | null
  readonly variant: 'banner' | 'card' | 'strip'
}
export type PromoBlock = BlockBase<'promo', PromoBlockData>

export interface ReservationBlockData {
  readonly title: string
  readonly description: string | null
  readonly phone: string | null
  readonly whatsapp: string | null
  readonly reservationUrl: string | null
}
export type ReservationBlock = BlockBase<'reservation', ReservationBlockData>

export interface Testimonial {
  readonly id: string
  readonly author: string
  readonly text: string
  readonly rating: 1 | 2 | 3 | 4 | 5
  readonly avatarUrl: string | null
}
export interface TestimonialBlockData {
  readonly title: string
  readonly items: readonly Testimonial[]
}
export type TestimonialBlock = BlockBase<'testimonial', TestimonialBlockData>

export interface SocialsBlockData {
  readonly instagram: string | null
  readonly facebook: string | null
  readonly tiktok: string | null
  readonly whatsapp: string | null
  readonly website: string | null
  readonly showIcons: boolean
}
export type SocialsBlock = BlockBase<'socials', SocialsBlockData>

export interface FooterBlockData {
  readonly restaurantName: string
  readonly address: string | null
  readonly phone: string | null
  readonly hours: string | null
  readonly showPoweredBy: boolean
}
export type FooterBlock = BlockBase<'footer', FooterBlockData>

export type Block =
  | HeroBlock | AnnouncementBlock | FeaturedBlock | MenuSectionBlock
  | PromoBlock | ReservationBlock | TestimonialBlock | SocialsBlock | FooterBlock

export type BlockType        = Block['type']
export type BlockOfType<T extends BlockType>     = Extract<Block, { type: T }>
export type BlockDataOfType<T extends BlockType> = BlockOfType<T>['data']
export type NeverBlock = never

// ─── Canva template reference (v2) ───────────────────────────────────────────
//
// A CanvaTemplateRef points to a Canva-designed background.
// The exported image is stored in Firebase Storage (never a direct Canva URL).
// width/height are the original design dimensions used to compute layer positions.

export interface CanvaTemplateRef {
  readonly canvaDesignId: string       // Canva's own design identifier
  readonly exportUrl: string           // Firebase Storage URL of the exported image
  readonly exportedAt: string          // ISO 8601 — when the export was last refreshed
  readonly widthPx: number             // original design width in pixels
  readonly heightPx: number            // original design height in pixels
}

// ─── DataLayer — positioned overlay bound to Firestore data (v2) ─────────────
//
// All positions are percentages (0–100) relative to the Canva template dimensions.
// This makes layers resolution-independent and responsive.

export interface DataLayerPosition {
  readonly x: number           // % from left edge  (0–100)
  readonly y: number           // % from top edge   (0–100)
  readonly width: number       // % of template width  (0–100)
  readonly height: number      // % of template height (0–100)
  readonly zIndex: number      // stacking order among layers
  readonly rotation: number    // degrees (0 = no rotation)
}

// What data source does this layer render?
export type DataLayerBinding =
  | {
      readonly type: 'dish-field'
      readonly dishId: string
      readonly field: 'name' | 'price' | 'description' | 'imageUrl'
    }
  | {
      readonly type: 'category-name'
      readonly categoryId: string
    }
  | {
      readonly type: 'dish-list'
      readonly categoryId: string
      readonly layout: 'grid' | 'list' | 'row'
      readonly maxItems: number
    }
  | {
      readonly type: 'static'
      readonly content: string          // plain text, no HTML
    }
  | {
      readonly type: 'tenant-field'
      readonly field: 'name' | 'logoUrl' | 'tagline' | 'phone' | 'address'
    }

// Text style for layers that render text content
export interface DataLayerTextStyle {
  readonly fontFamily: string | null    // null = inherit from EditorTheme
  readonly fontSize: number | null      // null = auto-fit within bounds
  readonly fontWeight: 400 | 600 | 700 | 800 | 900
  readonly color: string                // hex
  readonly align: 'left' | 'center' | 'right'
  readonly lineHeight: number           // unitless multiplier
  readonly backgroundColor: string | null  // null = transparent
  readonly paddingX: number             // px horizontal padding
  readonly paddingY: number             // px vertical padding
}

export interface DataLayer {
  readonly id: string
  readonly label: string | null         // human-readable name for editor UX
  readonly visible: boolean
  readonly position: DataLayerPosition
  readonly binding: DataLayerBinding
  readonly textStyle: DataLayerTextStyle | null   // null for image layers
  readonly opacity: number              // 0–1
  readonly borderRadius: number         // px, 0 = no rounding
}

// ─── Default factories ────────────────────────────────────────────────────────

export function defaultTextStyle(): DataLayerTextStyle {
  return {
    fontFamily: null,
    fontSize: null,
    fontWeight: 700,
    color: '#ffffff',
    align: 'left',
    lineHeight: 1.3,
    backgroundColor: null,
    paddingX: 0,
    paddingY: 0,
  }
}

export function defaultDataLayer(id: string, binding: DataLayerBinding): DataLayer {
  return {
    id,
    label: null,
    visible: true,
    position: { x: 10, y: 10, width: 30, height: 10, zIndex: 1, rotation: 0 },
    binding,
    textStyle: defaultTextStyle(),
    opacity: 1,
    borderRadius: 0,
  }
}

export function defaultHeroData(): HeroBlockData {
  return {
    title: 'Mi Restaurante',
    tagline: null,
    coverImageUrl: null,
    coverOpacity: 0.85,
    logoUrl: null,
    heroHeight: 'normal',
  }
}

export function defaultFooterData(restaurantName: string): FooterBlockData {
  return {
    restaurantName,
    address: null,
    phone: null,
    hours: null,
    showPoweredBy: true,
  }
}

export type { TemplateId }
