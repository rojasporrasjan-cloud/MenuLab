export type AnalyticsEventType =
  | 'qr_scan'
  | 'menu_view'
  | 'dish_view'
  | 'ar_launch'
  | 'ar_error'
  | 'cart_add'
  | 'order_created'
  | 'featured_view'
  | 'featured_click'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface AnalyticsEvent {
  id: string
  tenantId: string
  type: AnalyticsEventType
  menuId: string | null
  dishId: string | null
  tableId: string | null
  sessionId: string
  deviceType: DeviceType
  timestamp: Date
}
