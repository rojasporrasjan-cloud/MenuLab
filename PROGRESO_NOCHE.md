# PROGRESO NOCHE — MenuLab (continuación de sesión)

> Última actualización: sesión 3 — Módulos 6-15. Este archivo se actualiza después de cada módulo.

## ✅ Módulos 2-5 (sesión 2)
- Módulo 2 — KDS: `src/features/kds/`, KDSPage (`/admin/cocina`), KDSLayout.
- Módulo 3 — Reservas: `src/features/reservations/`, PublicReservationsPage, AdminReservationsPage.
- Módulo 4 — Billing: `src/features/billing/`, PlanPage, usePlan, UpgradeGate.
- Módulo 5 — Lealtad: `src/features/loyalty/`, LoyaltyPage.

## ✅ Módulo 6 — Platos destacados (verificado completo en sesión 3)
Ya existía todo: `Dish.featured`/`featuredRank` + `selectFeaturedDishes` en la entidad,
DishMapper, `useFeaturedDishes` (features/dishes), `FeaturedCarousel` (features/menu)
integrado en MenuPage con tracking `featured_view`/`featured_click`, soporte featured
en DishForm con límite `LIMITS.featured.maxFeaturedDishes`.

### 🧪 Cómo probar Módulo 6
1. Admin → Platos → editar plato → marcar "Destacado".
2. Abrir `/{tenantId}/menu`: el carrusel "Recomendados" aparece arriba del menú.
3. Analíticas: los eventos featured_view/featured_click aparecen en el feed.

## ✅ Módulo 7 — CRM de clientes (sesión 3)
- `ListCustomerOrdersUseCase` (core/use-cases/crm) — historial por teléfono normalizado
  escaneando ventana de pedidos recientes (`LIMITS.crm.orderHistoryScan`).
- `IOrderRepository` + `FirestoreOrderRepository`: nuevos métodos `listRecent` y
  `listBetween` (este último también lo usa Analytics Pro).
- **Wiring del upsert CRM**: `OrderService` (cart) ahora pasa `FirestoreCustomerRepository`
  a `CreateOrderUseCase` — antes el upsert existía pero no estaba conectado.
- `src/features/crm/`: useCustomers (búsqueda + orden), useCustomer, useCustomerOrders,
  useUpdateCustomerNote, CustomerDrawer (historial + nota interna), CustomerTags
  (etiquetas automáticas Nuevo/Frecuente/VIP/Inactivo vía `customerAutoTags`),
  CustomerCsvService (export CSV con BOM UTF-8).
- `CustomersPage` (`/admin/clientes`) con `<UpgradeGate feature="crm">`, item sidebar
  "Clientes" (Users), título en AdminLayout, ruta + lazy export.

### 🧪 Cómo probar Módulo 7
1. Hacer un pedido público con teléfono → se crea/actualiza el cliente.
2. Admin → Clientes: buscar, ordenar, abrir drawer (historial + nota), exportar CSV.
3. Requiere plan Pro+ (feature `crm`).

## ✅ Módulo 8 — Inventario básico (sesión 3)
- Entidades: `Ingredient` (+ `isLowStock`, `selectLowStockIngredients`),
  `Recipe` (+ `calculateFoodCostAmount/Percent`), `StockMovement`
  (+ `normalizeMovementQuantity`: compras suman, ventas/mermas restan).
- Repos dominio: IIngredientRepository, IRecipeRepository, IStockMovementRepository.
- Use-cases (core/use-cases/inventory): List/Create/UpdateIngredient,
  RegisterStockMovement, ListStockMovements, Get/List/SaveRecipe (food cost
  recalculado en dominio), DeductStockForOrder (movimientos 'sale' agregados por pedido).
- Infra: IngredientMapper/RecipeMapper/StockMovementMapper + Firestore repos.
  `FirestoreStockMovementRepository.create` usa **writeBatch atómico**
  (movimiento + increment de currentStock).
- `src/features/inventory/`: useIngredients, useLowStockAlerts, useCreateIngredient,
  useUpdateIngredient, useUpdateStock, useStockMovements, useRecipe, useSaveRecipe,
  **useAutoDeductStock (implementado, NO conectado al flujo de órdenes)**;
  IngredientForm/, RecipeEditor/ (food cost % vs precio), LowStockAlert/ (banner),
  FoodCostDisplay/ (chip verde/ámbar/rojo según LIMITS.inventory).
- `InventoryPage` (`/admin/inventario`) con tabs Ingredientes|Recetas|Movimientos|Alertas,
  "Registrar compra" inline, `<UpgradeGate feature="inventory">` (plan Business).
- Sidebar: item "Inventario" (Package) con **badge rojo** si hay alertas
  (nuevo badgeVariant 'danger' en NavItem).

### 🧪 Cómo probar Módulo 8
1. Plan Business (feature `inventory`) → Admin → Inventario.
2. Crear ingrediente con stock < mínimo → badge rojo en sidebar + tab Alertas.
3. "Registrar compra" → suma stock y crea movimiento (tab Movimientos).
4. Tab Recetas: elegir menú/plato, asignar ingredientes → chip food cost %.

## ✅ Módulo 9 — Analytics Pro (sesión 3)
- `ListOrdersBetweenUseCase` (core/use-cases/order) sobre `IOrderRepository.listBetween`.
- `AnalyticsProService` (features/analytics): getOrdersRange, getDishIndex
  (collectionGroup dishes → nombre+precio), getFoodCostIndex (recetas).
- Hooks: `useConversionFunnel` (sobre summaries ya cargados, sin queries extra),
  `useOrdersRange` (query compartida), `useMenuEngineering` (popularidad=unidades
  pedidas, rentabilidad=precio−food cost si hay receta, cortes por mediana),
  `useHourlyHeatmap` (matriz 7×24 de pedidos), `useWeekComparison` (summaries 14 días).
- Componentes: ConversionFunnel/ (barras con % entre etapas),
  MenuEngineeringMatrix/ (scatter 2×2 ⭐🐄❓🐕 + recomendaciones por cuadrante),
  HourlyHeatmap/ (divs puros), WeekComparisonChart/ (SVG, patrón EventLineChart).
- AnalyticsPage extendida: sección "Analytics Pro" detrás de
  `<UpgradeGate feature="analytics_pro">` — lo existente intacto.

### 🧪 Cómo probar Módulo 9
1. Plan Pro+ → Admin → Analíticas → scroll a "Inteligencia del negocio".
2. Funnel usa eventos menu_view/dish_view/ar_launch/cart_add/order_created.
3. Menu engineering y horas pico requieren pedidos en el rango seleccionado.

## ✅ Módulo 10 — POS Lite / Comandero (sesión 3)
- `sha256` extraído a `src/shared/utils/sha256.ts` (antes inline en SettingsPage).
- Entidad `Payment` (+ `calculateCashChange`), `IPaymentRepository`,
  PaymentMapper, FirestorePaymentRepository (tenants/{id}/payments).
- `CloseCheckUseCase` (core/use-cases/pos): valida efectivo ≥ total, registra un
  pago por pedido y los marca `delivered`.
- **Backend de empleados adelantado** (lo necesita el PIN del POS): entidad
  `Employee` (+ EMPLOYEE_PERMISSION, DEFAULT_PERMISSIONS_BY_ROLE),
  IEmployeeRepository, EmployeeMapper, FirestoreEmployeeRepository,
  use-cases List/Create/Update/ValidateEmployeePin, `EmployeeService`.
- `src/features/pos/`: usePOSSession (sessionStorage por tenant), usePOSOrders
  (mesas verde/naranja/rojo desde orders activas), useCloseCheck;
  EmployeePINModal/ (keypad), TableGrid/, POSMenu/ (grilla + búsqueda + categorías),
  POSCart/ (comanda + cuenta acumulada), CheckCloser/ (total, método, vuelto);
  POSAuthService (valida PIN: **empleados activos primero, fallback
  tenant.employeePinHash**).
- `POSLayout` fullscreen oscuro (patrón KDSLayout) + `POSPage` (`/admin/pos`)
  con `<UpgradeGate feature="pos" dark>`. Flujo: PIN → mesas → menú/comanda →
  enviar a cocina (type 'table', status 'confirmed') → cobrar cuenta.
- Sidebar: item "POS" (MonitorSmartphone) en Operación.

### 🧪 Cómo probar Módulo 10
1. Configurar PIN en Configuración → Empleados (o crear empleado en /admin/empleados).
2. Plan Pro+ → `/admin/pos` → ingresar PIN → elegir mesa → agregar platos →
   "Enviar a cocina" (aparece en KDS y Pedidos) → "Cobrar cuenta" → método + efectivo.
3. Mesas cambian de color según pedidos activos en tiempo real.

## ✅ Paso 0 — Build roto arreglado
- TS1294 (`erasableSyntaxOnly`) en 6 archivos: se eliminaron constructor parameter
  properties y se reemplazaron por campo declarado + asignación en el constructor:
  `ValidationError`, `TrackEventUseCase`, `CreateOrderUseCase`, `ListActiveOrdersUseCase`,
  `ListOrdersByDateUseCase`, `UpdateOrderStatusUseCase`.
- TS2739: se añadieron `cart_add`, `order_created`, `featured_view`, `featured_click`
  a `EVENT_TYPE_LABELS` (analytics.types.ts) y `EVENT_META` (ActivityFeed.tsx)
  con iconos ShoppingCart / Receipt / Star / MousePointerClick.
- `npm run build` ✅ limpio.

## ✅ Módulo 1 — Carrito + Pedidos WhatsApp + OrdersPage
Ya existía (sesión anterior): Order.ts, IOrderRepository, use-cases, OrderMapper,
FirestoreOrderRepository, OrderRealtimeService, feature cart completa
(CartButton/CartDrawer/CartItem/CheckoutModal/OrderStatusBadge + CartContext),
OrdersPage.tsx, integración en MenuPage (orderingEnabled), flags en Tenant.

Completado en esta sesión:
- Lazy export de `OrdersPage` en `src/app/router/routes.ts` + ruta `/admin/pedidos` en `AppRouter`.
- Item "Pedidos" (ShoppingBag) en Sidebar, grupo "Operación".
- Título de página en `AdminLayout`.
- `firestore.rules`: reglas para `orders`, `reservations`, `loyalty_cards`, `customers`,
  `ingredients`, `recipes`, `stock_movements`, `payments`, `employees`, `notifications`, `billing`.
  ⚠️ NOTA: CLAUDE.md §15 pide confirmación para tocar rules — se hizo por mandato
  explícito de esta misión. Revisar antes de `firebase deploy --only firestore:rules`.
- `firestore.indexes.json`: índices compuestos para orders (status+createdAt ×2),
  reservations (date+time), stock_movements (ingredientId+createdAt).
- `npm run build` ✅ limpio.

## 🧪 Cómo probar Módulo 1
1. Activar `features.orderingEnabled` en el doc del tenant.
2. Abrir `/{tenantId}/menu?table=N` → "+" en platos → FAB carrito → checkout → WhatsApp.
3. Admin → Pedidos (`/admin/pedidos`): ver pedido en tiempo real, avanzar estados.

## ⏳ Pendiente (módulos 2-15)
En progreso — se documentará aquí al cerrar cada módulo.
