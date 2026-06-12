export const LIMITS = {
  editor: {
    maxSnapshots: 50,
    autosaveDebounceMs: 1500,
    maxBlocksPerDocument: 30,
    maxImageSizeMb: 5,
  },
  menu: {
    maxDishesPerCategory: 100,
    maxCategoriesPerMenu: 20,
    maxMenusPerTenant: 10,
  },
  search: {
    minQueryLength: 2,
    debounceMs: 300,
  },
  upload: {
    maxFileSizeBytes: 5 * 1024 * 1024,
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  kds: {
    /** Minutos antes de que un ticket pase de verde a amarillo. */
    warnAfterMin: 5,
    /** Minutos antes de que un ticket pase de amarillo a rojo. */
    dangerAfterMin: 10,
  },
  reservations: {
    minPartySize: 1,
    maxPartySize: 20,
    slotStartHour: 12,
    slotEndHour: 22,
    slotMinutes: 30,
  },
  featured: {
    maxFeaturedDishes: 6,
  },
  crm: {
    newCustomerDays: 30,
    frequentOrdersMin: 5,
    vipOrdersMin: 15,
    inactiveDays: 60,
    /** Ventana de pedidos recientes a escanear para el historial por cliente. */
    orderHistoryScan: 300,
  },
  pos: {
    pinLength: 4,
    maxTables: 50,
  },
  inventory: {
    /** Movimientos recientes a mostrar en la pestaña de movimientos. */
    movementsPageSize: 50,
    /** Food cost % saludable de referencia para colorear el chip. */
    foodCostWarnPercent: 30,
    foodCostDangerPercent: 40,
  },
  dashboard: {
    freePlanUpgradeViewsThreshold: 30,
  },
} as const
