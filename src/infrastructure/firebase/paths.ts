/**
 * Centralized Firestore path builder.
 * Single source of truth for all collection paths.
 * Never use raw string paths outside this file.
 */
export const firestorePaths = {
  // ── Tenant ────────────────────────────────────────────────────────────────
  tenant: (tenantId: string) =>
    `tenants/${tenantId}`,

  tenants: () => 'tenants',

  // ── User accounts (top-level uid → tenantId mapping, written by backend) ────
  userAccount: (userId: string) =>
    `users/${userId}`,

  // ── Quotes (leads del flujo "Cotizar con nosotros") ─────────────────────────
  quotes: () => 'quotes',

  quote: (quoteId: string) =>
    `quotes/${quoteId}`,

  // ── Members ───────────────────────────────────────────────────────────────
  members: (tenantId: string) =>
    `tenants/${tenantId}/members`,

  member: (tenantId: string, userId: string) =>
    `tenants/${tenantId}/members/${userId}`,

  // ── Menus ─────────────────────────────────────────────────────────────────
  menus: (tenantId: string) =>
    `tenants/${tenantId}/menus`,

  menu: (tenantId: string, menuId: string) =>
    `tenants/${tenantId}/menus/${menuId}`,

  // ── Categories ────────────────────────────────────────────────────────────
  categories: (tenantId: string, menuId: string) =>
    `tenants/${tenantId}/menus/${menuId}/categories`,

  category: (tenantId: string, menuId: string, categoryId: string) =>
    `tenants/${tenantId}/menus/${menuId}/categories/${categoryId}`,

  // ── Dishes ────────────────────────────────────────────────────────────────
  dishes: (tenantId: string, menuId: string) =>
    `tenants/${tenantId}/menus/${menuId}/dishes`,

  dish: (tenantId: string, menuId: string, dishId: string) =>
    `tenants/${tenantId}/menus/${menuId}/dishes/${dishId}`,

  // ── Tables ────────────────────────────────────────────────────────────────
  tables: (tenantId: string) =>
    `tenants/${tenantId}/tables`,

  table: (tenantId: string, tableId: string) =>
    `tenants/${tenantId}/tables/${tableId}`,

  // ── Analytics ─────────────────────────────────────────────────────────────
  analyticsEvents: (tenantId: string) =>
    `tenants/${tenantId}/analyticsEvents`,

  analyticsEvent: (tenantId: string, eventId: string) =>
    `tenants/${tenantId}/analyticsEvents/${eventId}`,

  analyticsDailySummaries: (tenantId: string) =>
    `tenants/${tenantId}/analyticsDailySummaries`,

  analyticsDailySummary: (tenantId: string, date: string) =>
    `tenants/${tenantId}/analyticsDailySummaries/${date}`,

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: (tenantId: string) =>
    `tenants/${tenantId}/settings/config`,

  // ── Orders (pedidos en línea / POS) ───────────────────────────────────────
  orders: (tenantId: string) =>
    `tenants/${tenantId}/orders`,

  order: (tenantId: string, orderId: string) =>
    `tenants/${tenantId}/orders/${orderId}`,

  // ── Reservations ──────────────────────────────────────────────────────────
  reservations: (tenantId: string) =>
    `tenants/${tenantId}/reservations`,

  reservation: (tenantId: string, reservationId: string) =>
    `tenants/${tenantId}/reservations/${reservationId}`,

  // ── Loyalty (sellos digitales) ────────────────────────────────────────────
  loyaltyCards: (tenantId: string) =>
    `tenants/${tenantId}/loyalty_cards`,

  loyaltyCard: (tenantId: string, cardId: string) =>
    `tenants/${tenantId}/loyalty_cards/${cardId}`,

  // ── CRM Customers ─────────────────────────────────────────────────────────
  customers: (tenantId: string) =>
    `tenants/${tenantId}/customers`,

  customer: (tenantId: string, customerId: string) =>
    `tenants/${tenantId}/customers/${customerId}`,

  // ── Inventory ─────────────────────────────────────────────────────────────
  ingredients: (tenantId: string) =>
    `tenants/${tenantId}/ingredients`,

  ingredient: (tenantId: string, ingredientId: string) =>
    `tenants/${tenantId}/ingredients/${ingredientId}`,

  recipes: (tenantId: string) =>
    `tenants/${tenantId}/recipes`,

  recipe: (tenantId: string, dishId: string) =>
    `tenants/${tenantId}/recipes/${dishId}`,

  stockMovements: (tenantId: string) =>
    `tenants/${tenantId}/stock_movements`,

  stockMovement: (tenantId: string, movementId: string) =>
    `tenants/${tenantId}/stock_movements/${movementId}`,

  // ── Payments (POS) ────────────────────────────────────────────────────────
  payments: (tenantId: string) =>
    `tenants/${tenantId}/payments`,

  payment: (tenantId: string, paymentId: string) =>
    `tenants/${tenantId}/payments/${paymentId}`,

  // ── Cash sessions (cierre de caja / arqueo) ───────────────────────────────
  cashSessions: (tenantId: string) =>
    `tenants/${tenantId}/cashSessions`,

  cashSession: (tenantId: string, sessionId: string) =>
    `tenants/${tenantId}/cashSessions/${sessionId}`,

  // ── Facturas electrónicas (Hacienda CR) ───────────────────────────────────
  invoices: (tenantId: string) =>
    `tenants/${tenantId}/invoices`,

  invoice: (tenantId: string, invoiceId: string) =>
    `tenants/${tenantId}/invoices/${invoiceId}`,

  // ── Employees ─────────────────────────────────────────────────────────────
  employees: (tenantId: string) =>
    `tenants/${tenantId}/employees`,

  employee: (tenantId: string, employeeId: string) =>
    `tenants/${tenantId}/employees/${employeeId}`,

  // ── Notifications (in-app, admin) ─────────────────────────────────────────
  notifications: (tenantId: string) =>
    `tenants/${tenantId}/notifications`,

  notification: (tenantId: string, notificationId: string) =>
    `tenants/${tenantId}/notifications/${notificationId}`,

  // ── Subscription (billing — doc singleton) ────────────────────────────────
  subscription: (tenantId: string) =>
    `tenants/${tenantId}/billing/subscription`,
} as const
