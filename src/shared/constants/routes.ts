export const ROUTES = {
  /* ── Marketing / acquisition (público, sin auth) ── */
  marketing: {
    landing: '/',
    templates: '/plantillas',
    quote: '/cotizar',
  },

  /* ── Public (customer-facing QR views) ── */
  public: {
    menu: '/:tenantId/menu',
    dish: '/:tenantId/menu/:menuId/dish/:dishId',
    reservations: '/:tenantId/reservar',
    loyalty: '/:tenantId/sellos',
    notFound: '/404',
  },

  /* ── Admin dashboard ── */
  admin: {
    root: '/admin',
    dashboard: '/admin/dashboard',
    editor: '/admin/editor',
    menu: {
      list: '/admin/menu',
      editor: '/admin/menu/:menuId',
    },
    dishes: {
      list: '/admin/dishes',
      editor: '/admin/dishes/:dishId',
      new: '/admin/dishes/new',
    },
    qr: '/admin/qr',
    templates: '/admin/templates',
    appearance: '/admin/appearance',
    analytics: '/admin/analytics',
    settings: '/admin/settings',
    orders: '/admin/pedidos',
    kds: '/admin/cocina',
    reservations: '/admin/reservaciones',
    plan: '/admin/plan',
    loyalty: '/admin/lealtad',
    customers: '/admin/clientes',
    inventory: '/admin/inventario',
    pos: '/admin/pos',
    cash: '/admin/caja',
    employees: '/admin/empleados',
    dispatcher: '/admin/envios',
  },

  /* ── Staff panel (trabajadores — entran con PIN por menú: /:tenantId/staff) ── */
  staff: {
    base: '/:tenantId/staff',
    home: (tenantId: string) => `/${tenantId}/staff`,
    segments: {
      waiter: 'tomar-pedido',
      orders: 'pedidos',
      availability: 'disponibilidad',
      promos: 'promos',
      tables: 'mesas',
    },
  },

  /* ── Auth ── */
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },

  /* ── Platform super-admin (solo owner de la plataforma) ── */
  platformAdmin: {
    root: '/platform-admin',
    dashboard: '/platform-admin/dashboard',
    tenants: '/platform-admin/tenants',
    tenantDetail: '/platform-admin/tenants/:tenantId',
    tenant: (tenantId: string) => `/platform-admin/tenants/${tenantId}`,
  },
} as const
