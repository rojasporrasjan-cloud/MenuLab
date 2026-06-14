# Progreso de Tests — Soda La Rustica SaaS

> Archivo de control para el loop autónomo de tests. Leer al inicio de cada turno.
> Runner: **Vitest** (`npm test`). Tests co-locados como `X.test.ts` junto al source.

## Estado: ✅ COMPLETO (lógica) — 126 tests en verde. Solo falta la capa de UI (requiere instalar RTL/jsdom — decisión del usuario).

## Plan por valor (orden de ataque)
- (a) Entidades de dominio puras
- (b) Use-cases
- (c) Utils compartidos
- (d) Mappers (toDomain con snapshots mock)
- (e) Editor (reducer/store) + ExportPDFService (lógica)
- (f) Hooks / componentes (React Testing Library)

## ✅ Cubierto
### Lote 1 — Dominio puro + utils base
- `core/domain/entities/CashSession.test.ts` — summarizePayments, calculateExpectedCash, calculateCashDifference
- `core/domain/entities/Payment.test.ts` — calculateCashChange
- `core/domain/entities/Subscription.test.ts` — trialDaysLeft
- `core/domain/entities/Customer.test.ts` — customerAutoTags, normalizeCustomerPhone
- `shared/utils/currency.test.ts` — currencyForLocale, currencySymbol
- `shared/utils/formatCurrency.test.ts` — formatCurrency

### Lote 2 — Dominio + utils (food cost, inventario, pedidos)
- `shared/utils/slug.test.ts` — slugify, uniqueSlug
- `shared/utils/datetime.test.ts` — greeting (con fake timers)
- `core/domain/entities/Order.test.ts` — nextOrderStatus, calculateOrderSubtotal
- `core/domain/entities/Recipe.test.ts` — calculateFoodCostAmount, calculateFoodCostPercent
- `core/domain/entities/Ingredient.test.ts` — isLowStock, selectLowStockIngredients

### Lote 3 — Use-cases (con repos fake en memoria)
- `core/use-cases/cash/OpenCashSessionUseCase.test.ts` — abre / valida fondo / rechaza doble apertura
- `core/use-cases/cash/CloseCashSessionUseCase.test.ts` — esperado/diferencia/totales, sobrante y faltante, validaciones
- `core/use-cases/tenant/UpdateTenantSubscriptionUseCase.test.ts` — cambia plan y/o estado

### Lote 4 — Dominio restante (✅ TODO el dominio puro cubierto)
- `core/domain/entities/LoyaltyCard.test.ts` — canRedeemReward, normalizeLoyaltyPhone, calculateLoyaltyStats
- `core/domain/entities/Reservation.test.ts` — calculateReservationStats
- `core/domain/entities/StockMovement.test.ts` — normalizeMovementQuantity
- `core/domain/entities/Employee.test.ts` — employeeHasPermission, DEFAULT_PERMISSIONS_BY_ROLE
- `core/domain/entities/Dish.test.ts` — selectFeaturedDishes

### Lote 5 — Mappers (Firestore → dominio, con mock de snapshot)
- `infrastructure/mappers/CashSessionMapper.test.ts` — sesión abierta/cerrada, totales, defaults
- `infrastructure/mappers/CustomerMapper.test.ts` — ticket promedio derivado, tags filtrados, defaults
- `infrastructure/mappers/OrderMapper.test.ts` — items, tipo/estado, defaults

### Lote 6 — Editor reducer + TenantMapper
- `features/editor/store/__tests__/editorReducer.crud.test.ts` — ADD/REMOVE/TOGGLE/REORDER capas, SET_THEME, UNDO/REDO
- `infrastructure/mappers/TenantMapper.test.ts` — dueño (ownerId/ownerEmail) + defaults de branding

### Lote 7 — Use-cases de menú + util cn
- `core/use-cases/menu/GetActiveDishesUseCase.test.ts` — agrupar por categoría, orden, omitir vacías
- `core/use-cases/menu/GetMenuByTableUseCase.test.ts` — resuelve mesa → menú
- `shared/utils/cn.test.ts` — merge de clases Tailwind

### Lote 8 — Use-cases con lógica real (stock, lealtad, POS)
- `core/use-cases/inventory/DeductStockForOrderUseCase.test.ts` — agrega insumos por receta, ventas negativas, ignora sin receta
- `core/use-cases/loyalty/RedeemRewardUseCase.test.ts` — canje válido / rechazo sin sellos
- `core/use-cases/pos/CloseCheckUseCase.test.ts` — total, vuelto, pago por pedido, validaciones

## ✅ Estado FINAL: 31 archivos de test, 126 tests en verde.

## ⏳ Pendiente (próximos lotes)
### Revisar si tienen lógica pura testeable
- Menu, Dish, Table, Loyalty (loyalty config / sellos) — leer y testear si hay funciones puras
### Lote 3 — Use-cases
- cash: OpenCashSessionUseCase, CloseCashSessionUseCase (con repos fake en memoria)
- tenant: UpdateTenantSubscriptionUseCase, GetTenantByIdUseCase
- menu: GetActiveDishesUseCase, GetMenuByTableUseCase
### Lote 4 — Mappers
- TenantMapper, CashSessionMapper, CustomerMapper, OrderMapper (toDomain con doc snapshot mock)
### Lote 5 — Editor + PDF
- editorReducer (ya hay 1 test — ampliar), ExportPDFService (formato/geometría/filename)
### Lote 6 — Hooks/componentes (RTL)
- useConversionFunnel, hooks de tiempo real (con mocks), componentes clave

## 🐛 Bugs encontrados por los tests
- (ninguno aún)

## ✅ LOOP CONCLUIDO
Toda la lógica testeable sin dependencias nuevas está cubierta: dominio puro (todas las
entidades), use-cases con lógica real (caja, suscripción, menú, stock, lealtad, POS),
utils, mappers y editor reducer. **126 tests en verde.**

### Lo único pendiente (requiere decisión del usuario)
1. **Componentes/hooks (capa UI):** necesita `npm i -D @testing-library/react @testing-library/jest-dom jsdom`
   + `test: { environment: 'jsdom', setupFiles }` en vite.config.ts. NO se instaló (agrega deps).
2. **Delegadores triviales** (~30 use-cases List*/Get*/Update* que solo llaman a un repo):
   bajo valor de test; se pueden cubrir si se quiere 100% de archivos.
3. **Deuda:** ExportPDFService — sus funciones puras (fitInsidePage, safeFilename) NO están
   exportadas → requieren un pequeño refactor para testear.

## ⛔ Decisión pendiente del usuario (NO auto-instalar de noche)
Los tests de COMPONENTES/HOOKS necesitan agregar dependencias + configurar vitest:
- `npm i -D @testing-library/react @testing-library/jest-dom jsdom`
- En vite.config.ts: `test: { environment: 'jsdom', setupFiles: [...] }`
No se hace solo (agrega dependencias). Con el OK del usuario se cubre la capa de UI.

## Deuda documentada
- ExportPDFService: funciones puras (fitInsidePage, safeFilename) NO exportadas → requieren refactor para testear. No tocar producción.
