import type { AnalyticsEventType } from '@core/domain/entities/AnalyticsEvent'

// ── Query keys ────────────────────────────────────────────────────────────────

export const analyticsQueryKeys = {
  summaries: (tenantId: string, days: number) =>
    ['analytics-summaries', tenantId, days] as const,
  dishNames: (tenantId: string) =>
    ['analytics-dish-names', tenantId] as const,
  ordersRange: (tenantId: string, days: number) =>
    ['analytics-orders-range', tenantId, days] as const,
  dishIndex: (tenantId: string) =>
    ['analytics-dish-index', tenantId] as const,
  recipes: (tenantId: string) =>
    ['analytics-recipes', tenantId] as const,
}

// ── Domain types ──────────────────────────────────────────────────────────────

export interface DailySummary {
  date: string
  totalEvents: number
  counts: Partial<Record<AnalyticsEventType, number>>
  dishes: Record<string, Partial<Record<AnalyticsEventType, number>>>
}

export interface ChartSeries {
  key: AnalyticsEventType
  label: string
  color: string
  data: number[]
}

export interface TopDishEntry {
  dishId: string
  dishName: string
  count: number
}

export type DateRange = 7 | 30 | 90

export const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
]

// ── Chart series config ───────────────────────────────────────────────────────

export const SERIES_CONFIG: Pick<ChartSeries, 'key' | 'label' | 'color'>[] = [
  { key: 'qr_scan', label: 'Escaneos QR', color: '#3b82f6' },
  { key: 'menu_view', label: 'Vistas menú', color: '#e85d04' },
  { key: 'dish_view', label: 'Vistas plato', color: '#10b981' },
  { key: 'ar_launch', label: 'Lanzamientos AR', color: '#8b5cf6' },
]

// ── Analytics Pro: funnel ─────────────────────────────────────────────────────

export interface FunnelStage {
  readonly key: AnalyticsEventType
  readonly label: string
  /** Total de eventos de la etapa en el rango. */
  readonly count: number
  /** % respecto a la etapa anterior (100 para la primera). */
  readonly conversionFromPrevious: number
}

export const FUNNEL_STAGES: readonly { key: AnalyticsEventType; label: string }[] = [
  { key: 'menu_view', label: 'Visitas' },
  { key: 'dish_view', label: 'Vistas plato' },
  { key: 'ar_launch', label: 'AR' },
  { key: 'cart_add', label: 'Cart adds' },
  { key: 'order_created', label: 'Pedidos' },
]

// ── Analytics Pro: menu engineering ───────────────────────────────────────────

export type MenuQuadrant = 'star' | 'cow' | 'question' | 'dog'

export interface MenuEngineeringPoint {
  readonly dishId: string
  readonly dishName: string
  /** Unidades pedidas en el rango. */
  readonly popularity: number
  /** Margen por unidad (precio − food cost si hay receta; si no, precio). */
  readonly profitability: number
  readonly quadrant: MenuQuadrant
}

export interface MenuQuadrantMeta {
  readonly emoji: string
  readonly label: string
  readonly recommendation: string
}

export const MENU_QUADRANT_META: Record<MenuQuadrant, MenuQuadrantMeta> = {
  star: {
    emoji: '⭐',
    label: 'Estrellas',
    recommendation: 'Populares y rentables: dales máxima visibilidad (destacados, fotos, AR).',
  },
  cow: {
    emoji: '🐄',
    label: 'Vacas',
    recommendation: 'Populares pero poco rentables: sube precio con cuidado o reduce costo de receta.',
  },
  question: {
    emoji: '❓',
    label: 'Interrogantes',
    recommendation: 'Rentables pero poco pedidos: promociónalos o reposiciónalos en la carta.',
  },
  dog: {
    emoji: '🐕',
    label: 'Perros',
    recommendation: 'Ni populares ni rentables: considera retirarlos o reinventarlos.',
  },
}

// ── Analytics Pro: heatmap & comparativa ─────────────────────────────────────

/** Matriz 7 días × 24 horas con conteo de pedidos. [día][hora], día 0 = lunes. */
export type HourlyHeatmapMatrix = readonly (readonly number[])[]

export const WEEKDAY_LABELS: readonly string[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export interface WeekComparison {
  /** Totales por día (índice 0 = lunes). */
  readonly thisWeek: readonly number[]
  readonly lastWeek: readonly number[]
}

export const EVENT_TYPE_LABELS: Record<AnalyticsEventType, string> = {
  qr_scan: 'Escaneos QR',
  menu_view: 'Vistas de menú',
  dish_view: 'Vistas de plato',
  ar_launch: 'Lanzamientos AR',
  ar_error: 'Errores AR',
  cart_add: 'Añadidos al carrito',
  order_created: 'Pedidos creados',
  featured_view: 'Vistas de destacados',
  featured_click: 'Clicks en destacados',
}
