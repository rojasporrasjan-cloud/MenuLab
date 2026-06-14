import { useMemo, useState } from 'react'
import { Package, Plus, ShoppingCart, AlertTriangle, ChefHat, ClipboardList } from 'lucide-react'
import { PageHeader } from '@shared/ui/components/PageHeader'

import type { Ingredient } from '@core/domain/entities/Ingredient'
import { isLowStock } from '@core/domain/entities/Ingredient'
import type { StockMovementType } from '@core/domain/entities/StockMovement'
import { STOCK_MOVEMENT_TYPE } from '@core/domain/entities/StockMovement'
import { useTenantContext } from '@app/providers/TenantProvider'
import { useAuth } from '@features/auth'
import {
  useIngredients,
  useLowStockAlerts,
  useCreateIngredient,
  useUpdateStock,
  useStockMovements,
  IngredientForm,
  RecipeEditor,
  LowStockAlert,
  INGREDIENT_UNIT_LABELS,
  INVENTORY_TAB,
} from '@features/inventory'
import type { InventoryTab } from '@features/inventory'
import { useAdminMenus, useAdminDishes } from '@features/dishes'
import { UpgradeGate } from '@features/billing'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { COPY } from '@shared/copy/ui.copy'
import { cn } from '@shared/utils/cn'

const DEFAULT_CURRENCY = 'CRC'

const TAB_LABELS: Record<InventoryTab, string> = {
  ingredients: COPY.inventory.tabs.ingredients,
  recipes: COPY.inventory.tabs.recipes,
  movements: COPY.inventory.tabs.movements,
  alerts: COPY.inventory.tabs.alerts,
}

const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  purchase: COPY.inventory.movements.types.purchase,
  sale: COPY.inventory.movements.types.sale,
  waste: COPY.inventory.movements.types.waste,
  adjustment: COPY.inventory.movements.types.adjustment,
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('es-CR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Header Info ──────────────────────────────────────────────────────────────
function InventoryHeader() {
  return (
    <div className="mb-6">
      <PageHeader
        eyebrow="Gestión"
        title="Inventario"
        subtitle="Controla ingredientes, el costo de tus platos y evita mermas."
      />
    </div>
  )
}

// ─── Registrar compra (inline) ────────────────────────────────────────────────

function PurchaseRow({
  tenantId,
  ingredient,
  createdBy,
  onDone,
}: {
  tenantId: string
  ingredient: Ingredient
  createdBy: string
  onDone: () => void
}) {
  const updateStock = useUpdateStock()
  const [quantity, setQuantity] = useState('')

  function handleSubmit() {
    const qty = Number(quantity)
    if (!qty || qty <= 0) return
    updateStock.mutate(
      {
        tenantId,
        ingredientId: ingredient.id,
        type: STOCK_MOVEMENT_TYPE.purchase,
        quantity: qty,
        note: null,
        orderId: null,
        createdBy,
      },
      { onSuccess: onDone },
    )
  }

  return (
    <div className="flex items-center gap-2 border-t border-black/[0.04] bg-emerald-50/50 px-4 py-3">
      <ShoppingCart size={14} className="shrink-0 text-emerald-600" />
      <input
        type="number"
        min="0"
        step="any"
        autoFocus
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder={`${COPY.inventory.movements.quantityPlaceholder} (${INGREDIENT_UNIT_LABELS[ingredient.unit]})`}
        className="w-48 rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[13px] tabular-nums outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={updateStock.isPending || !Number(quantity)}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-black text-white transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95 disabled:opacity-40"
      >
        {COPY.inventory.movements.submit}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="px-3 py-2 text-[13px] font-bold text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        {COPY.inventory.ingredients.cancel}
      </button>
    </div>
  )
}

// ─── Tab: Ingredientes ────────────────────────────────────────────────────────

function IngredientsTab({ tenantId, createdBy }: { tenantId: string; createdBy: string }) {
  const { data: ingredients = [], isLoading } = useIngredients(tenantId)
  const createIngredient = useCreateIngredient()
  const [isCreating, setIsCreating] = useState(false)
  const [purchaseFor, setPurchaseFor] = useState<string | null>(null)

  const currency = ingredients[0]?.currency ?? DEFAULT_CURRENCY

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 mt-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-[14px] font-black text-white shadow-md shadow-neutral-900/10 transition-all hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg active:scale-95"
        >
          <Plus size={16} /> {COPY.inventory.ingredients.add}
        </button>
      </div>

      {isCreating && (
        <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-md">
          <IngredientForm
            tenantId={tenantId}
            currency={currency}
            ingredient={null}
            isSaving={createIngredient.isPending}
            onSubmit={(values) =>
              createIngredient.mutate(values, { onSuccess: () => setIsCreating(false) })
            }
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {ingredients.length === 0 && !isCreating ? (
        <EmptyState
          icon={<Package size={32} strokeWidth={1.5} />}
          title={COPY.inventory.ingredients.empty}
          description={COPY.inventory.ingredients.emptyHint}
          action={null}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {ingredients.map((ingredient) => {
            const low = isLowStock(ingredient)
            return (
              <div key={ingredient.id} className="group overflow-hidden rounded-2xl border border-black/[0.04] bg-white shadow-sm transition-all duration-300 hover:border-neutral-200 hover:shadow-md">
                <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-400 border border-neutral-100 group-hover:bg-neutral-100 group-hover:text-neutral-600 transition-colors">
                    <Package size={18} />
                  </div>
                  
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-black text-neutral-900 group-hover:text-neutral-800">
                      {ingredient.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-[12.5px] font-medium text-neutral-500">
                      {ingredient.category ?? '—'} <span className="text-neutral-300">•</span>{' '}
                      {formatCurrency(ingredient.costPerUnit, ingredient.currency)} / {INGREDIENT_UNIT_LABELS[ingredient.unit]}
                    </span>
                  </span>

                  <div className="flex items-center gap-4">
                    <span
                      className={`shrink-0 text-right text-[15px] font-black tabular-nums ${
                        low ? 'text-red-600 bg-red-50 px-3 py-1 rounded-lg' : 'text-neutral-800 bg-neutral-50 px-3 py-1 rounded-lg border border-neutral-100'
                      }`}
                    >
                      {ingredient.currentStock} <span className="text-[12px] font-bold text-neutral-400 ml-1 uppercase tracking-wider">{INGREDIENT_UNIT_LABELS[ingredient.unit]}</span>
                    </span>

                    {low && (
                      <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-red-700">
                        <AlertTriangle size={12} /> {COPY.inventory.ingredients.lowStock}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setPurchaseFor(purchaseFor === ingredient.id ? null : ingredient.id)
                      }
                      className="shrink-0 rounded-xl bg-white border border-neutral-200 px-4 py-2 text-[13px] font-bold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 hover:-translate-y-0.5 active:scale-95"
                    >
                      + Comprar
                    </button>
                  </div>
                </div>

                {purchaseFor === ingredient.id && (
                  <PurchaseRow
                    tenantId={tenantId}
                    ingredient={ingredient}
                    createdBy={createdBy}
                    onDone={() => setPurchaseFor(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Recetas ─────────────────────────────────────────────────────────────

function RecipesTab({ tenantId }: { tenantId: string }) {
  const { data: menus = [] } = useAdminMenus(tenantId)
  const [menuId, setMenuId] = useState<string | null>(null)
  const effectiveMenuId = menuId ?? menus[0]?.id ?? null
  const { data: dishes = [] } = useAdminDishes(tenantId, effectiveMenuId)
  const { data: ingredients = [] } = useIngredients(tenantId)
  const [dishId, setDishId] = useState<string | null>(null)

  const selectedDish = useMemo(
    () => dishes.find((d) => d.id === dishId) ?? null,
    [dishes, dishId],
  )

  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="flex flex-wrap gap-4 rounded-3xl border border-black/[0.04] bg-white p-5 shadow-sm">
        <div className="min-w-[200px] flex-1">
          <label
            className="text-[12px] font-bold uppercase tracking-wider text-neutral-500 mb-2 block flex items-center gap-2"
            htmlFor="recipes-menu"
          >
             {COPY.inventory.recipes.selectMenu}
          </label>
          <select
            id="recipes-menu"
            value={effectiveMenuId ?? ''}
            onChange={(e) => {
              setMenuId(e.target.value)
              setDishId(null)
            }}
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-bold text-neutral-800 shadow-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100"
          >
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[240px] flex-[2]">
          <label
            className="text-[12px] font-bold uppercase tracking-wider text-neutral-500 mb-2 block flex items-center gap-2"
            htmlFor="recipes-dish"
          >
            {COPY.inventory.recipes.selectDish}
          </label>
          <select
            id="recipes-dish"
            value={dishId ?? ''}
            onChange={(e) => setDishId(e.target.value || null)}
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-bold text-neutral-800 shadow-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100"
          >
            <option value="">{COPY.inventory.recipes.selectDish}…</option>
            {dishes.map((dish) => (
              <option key={dish.id} value={dish.id}>
                {dish.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedDish ? (
        <RecipeEditor tenantId={tenantId} dish={selectedDish} ingredients={ingredients} />
      ) : (
        <EmptyState
          icon={<ChefHat size={32} strokeWidth={1.5} />}
          title={COPY.inventory.recipes.empty}
          description="Selecciona un menú y un plato arriba para ver y editar su receta con los ingredientes disponibles en el inventario."
          action={null}
        />
      )}
    </div>
  )
}

// ─── Tab: Movimientos ─────────────────────────────────────────────────────────

const MOVEMENT_TYPE_STYLE: Record<StockMovementType, string> = {
  purchase: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  sale: 'bg-blue-50 text-blue-700 border border-blue-100',
  waste: 'bg-red-50 text-red-700 border border-red-100',
  adjustment: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
}

function MovementsTab({ tenantId }: { tenantId: string }) {
  const { data: movements = [], isLoading } = useStockMovements(tenantId, null)
  const { data: ingredients = [] } = useIngredients(tenantId)

  const nameIndex = useMemo(
    () => new Map(ingredients.map((i) => [i.id, i.name])),
    [ingredients],
  )

  if (isLoading) {
    return <div className="mt-4 flex flex-col gap-3">
       {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
    </div>
  }

  if (movements.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList size={32} strokeWidth={1.5} />}
        title={COPY.inventory.movements.empty}
        description="Aquí aparecerá el historial de compras, ventas y ajustes de tu inventario."
        action={null}
      />
    )
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {/* Header Desktop */}
      <div className="hidden items-center gap-4 px-6 py-2 text-[11px] font-black uppercase tracking-widest text-neutral-400 sm:flex">
          <span className="w-24">Tipo</span>
          <span className="min-w-0 flex-1">Ingrediente & Nota</span>
          <span className="w-24 text-right">Cantidad</span>
          <span className="w-32 text-right">Fecha</span>
      </div>

      {movements.map((movement) => (
        <div
          key={movement.id}
          className="group flex flex-wrap items-center gap-4 rounded-2xl border border-black/[0.04] bg-white p-4 shadow-sm transition-all duration-300 hover:border-neutral-200 hover:-translate-y-0.5"
        >
          <div className="w-full sm:w-24">
            <span
              className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${MOVEMENT_TYPE_STYLE[movement.type]}`}
            >
              {MOVEMENT_TYPE_LABELS[movement.type]}
            </span>
          </div>

          <span className="min-w-0 flex-1">
             <span className="block truncate text-[14px] font-black text-neutral-900 group-hover:text-neutral-800">
               {nameIndex.get(movement.ingredientId) ?? movement.ingredientId}
             </span>
            {movement.note && (
              <span className="mt-0.5 block truncate text-[12.5px] font-medium text-neutral-500">{movement.note}</span>
            )}
          </span>
          <span
            className={`w-full sm:w-24 sm:text-right shrink-0 text-[15px] font-black tabular-nums ${
              movement.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {movement.quantity > 0 ? '+' : ''}
            {movement.quantity}
          </span>
          <span className="w-full sm:w-32 sm:text-right shrink-0 text-[12.5px] font-medium text-neutral-400">
            {formatDateTime(movement.createdAt)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Alertas ─────────────────────────────────────────────────────────────

function AlertsTab({ tenantId }: { tenantId: string }) {
  const { alerts, isLoading } = useLowStockAlerts(tenantId)

  if (isLoading) {
    return <div className="mt-4 h-24 animate-pulse rounded-2xl bg-neutral-100" />
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={<AlertTriangle size={32} strokeWidth={1.5} />}
        title={COPY.inventory.alerts.empty}
        description="Todo en orden. Te avisaremos cuando algún ingrediente esté por debajo de su mínimo."
        action={null}
      />
    )
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <LowStockAlert alerts={alerts} showLink={false} />
      
      <div className="flex flex-col gap-3 mt-2">
        {alerts.map((ingredient) => (
          <div
            key={ingredient.id}
            className="flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50/50 p-4 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 border border-red-200">
              <AlertTriangle size={18} />
            </div>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-black text-red-900">
                {ingredient.name}
              </span>
              <span className="text-[12.5px] font-medium text-red-700/80">Stock crítico</span>
            </span>
            <span className="shrink-0 rounded-lg bg-white border border-red-200 px-4 py-2 text-[15px] font-black tabular-nums text-red-600 shadow-sm">
              {ingredient.currentStock} <span className="text-[12px] font-bold text-red-400 ml-1 uppercase">{INGREDIENT_UNIT_LABELS[ingredient.unit]}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  return (
    <UpgradeGate feature="inventory">
      <InventoryPageContent />
    </UpgradeGate>
  )
}

function InventoryPageContent() {
  const { tenantId } = useTenantContext()
  const { user } = useAuth()
  const [tab, setTab] = useState<InventoryTab>(INVENTORY_TAB.ingredients)
  const { count: alertCount } = useLowStockAlerts(tenantId)

  const createdBy = user?.uid ?? 'admin'

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <InventoryHeader />

      {/* Segmented Control Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-black/[0.04] shadow-sm">
        {Object.values(INVENTORY_TAB).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 min-w-[120px] rounded-xl px-4 py-3 text-[13px] font-bold transition-all outline-none flex items-center justify-center gap-2",
              tab === t
                ? "bg-neutral-900 text-white shadow-md"
                : "bg-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            )}
          >
            {TAB_LABELS[t]}
            {t === INVENTORY_TAB.alerts && alertCount > 0 && (
              <span className={cn(
                "rounded-lg px-2 py-0.5 text-[11px] font-black ml-1 transition-colors",
                tab === t ? "bg-white text-red-600" : "bg-red-100 text-red-600"
              )}>
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {tab === INVENTORY_TAB.ingredients && (
          <IngredientsTab tenantId={tenantId} createdBy={createdBy} />
        )}
        {tab === INVENTORY_TAB.recipes && <RecipesTab tenantId={tenantId} />}
        {tab === INVENTORY_TAB.movements && <MovementsTab tenantId={tenantId} />}
        {tab === INVENTORY_TAB.alerts && <AlertsTab tenantId={tenantId} />}
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action: React.ReactNode
}) {
  return (
    <div className="mt-4 flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-100 text-neutral-400">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-black text-neutral-800">{title}</h3>
        <p className="mt-2 text-[14px] text-neutral-500 max-w-[320px] leading-relaxed mx-auto">
          {description}
        </p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
