import { useMemo, useState } from 'react'
import { Package, Plus, ShoppingCart, AlertTriangle } from 'lucide-react'

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
    <div className="flex items-center gap-2 border-t border-black/[0.04] bg-emerald-50/50 px-4 py-2.5">
      <ShoppingCart size={13} className="shrink-0 text-emerald-600" />
      <input
        type="number"
        min="0"
        step="any"
        autoFocus
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder={`${COPY.inventory.movements.quantityPlaceholder} (${INGREDIENT_UNIT_LABELS[ingredient.unit]})`}
        className="w-44 rounded-lg border border-black/[0.08] bg-white px-2.5 py-1.5 text-[12.5px] tabular-nums outline-none focus:border-emerald-400"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={updateStock.isPending || !Number(quantity)}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-black text-white transition-all active:scale-95 disabled:opacity-40"
      >
        {COPY.inventory.movements.submit}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="px-2 text-[12px] font-bold text-neutral-400 hover:text-neutral-600"
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
          <div key={i} className="h-12 animate-pulse rounded-2xl bg-neutral-200/60" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-[12.5px] font-black text-white transition-all hover:bg-neutral-700 active:scale-95"
        >
          <Plus size={13} /> {COPY.inventory.ingredients.add}
        </button>
      </div>

      {isCreating && (
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
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
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/[0.1] py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <Package size={22} className="text-neutral-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-500">{COPY.inventory.ingredients.empty}</p>
            <p className="mt-1 text-[12px] text-neutral-400">
              {COPY.inventory.ingredients.emptyHint}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
          {ingredients.map((ingredient) => {
            const low = isLowStock(ingredient)
            return (
              <div key={ingredient.id} className="border-b border-black/[0.04] last:border-b-0">
                <div className="flex items-center gap-4 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-neutral-900">
                      {ingredient.name}
                    </span>
                    <span className="text-[11.5px] text-neutral-400">
                      {ingredient.category ?? '—'} ·{' '}
                      {formatCurrency(ingredient.costPerUnit, ingredient.currency)}/
                      {INGREDIENT_UNIT_LABELS[ingredient.unit]}
                    </span>
                  </span>

                  <span
                    className={`shrink-0 text-right text-[13px] font-black tabular-nums ${
                      low ? 'text-red-600' : 'text-neutral-800'
                    }`}
                  >
                    {COPY.inventory.alerts.stockOf(
                      `${ingredient.currentStock} ${INGREDIENT_UNIT_LABELS[ingredient.unit]}`,
                      String(ingredient.minimumStock),
                    )}
                  </span>

                  {low && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-red-600">
                      <AlertTriangle size={10} /> {COPY.inventory.ingredients.lowStock}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setPurchaseFor(purchaseFor === ingredient.id ? null : ingredient.id)
                    }
                    className="shrink-0 rounded-lg border border-black/[0.08] px-2.5 py-1.5 text-[11.5px] font-bold text-neutral-600 transition-colors hover:bg-neutral-50"
                  >
                    {COPY.inventory.ingredients.registerPurchase}
                  </button>
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[180px]">
          <label
            className="text-[11px] font-black uppercase tracking-wider text-neutral-400"
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
            className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-neutral-700 shadow-sm outline-none focus:border-neutral-400"
          >
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[220px] flex-1">
          <label
            className="text-[11px] font-black uppercase tracking-wider text-neutral-400"
            htmlFor="recipes-dish"
          >
            {COPY.inventory.recipes.selectDish}
          </label>
          <select
            id="recipes-dish"
            value={dishId ?? ''}
            onChange={(e) => setDishId(e.target.value || null)}
            className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-neutral-700 shadow-sm outline-none focus:border-neutral-400"
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
        <p className="rounded-2xl border border-dashed border-black/[0.1] px-4 py-12 text-center text-[13px] text-neutral-400">
          {COPY.inventory.recipes.empty}
        </p>
      )}
    </div>
  )
}

// ─── Tab: Movimientos ─────────────────────────────────────────────────────────

const MOVEMENT_TYPE_STYLE: Record<StockMovementType, string> = {
  purchase: 'bg-emerald-50 text-emerald-600',
  sale: 'bg-blue-50 text-blue-600',
  waste: 'bg-red-50 text-red-600',
  adjustment: 'bg-neutral-100 text-neutral-500',
}

function MovementsTab({ tenantId }: { tenantId: string }) {
  const { data: movements = [], isLoading } = useStockMovements(tenantId, null)
  const { data: ingredients = [] } = useIngredients(tenantId)

  const nameIndex = useMemo(
    () => new Map(ingredients.map((i) => [i.id, i.name])),
    [ingredients],
  )

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-neutral-200/60" />
  }

  if (movements.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/[0.1] px-4 py-12 text-center text-[13px] text-neutral-400">
        {COPY.inventory.movements.empty}
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      {movements.map((movement) => (
        <div
          key={movement.id}
          className="flex items-center gap-4 border-b border-black/[0.04] px-4 py-3 last:border-b-0"
        >
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${MOVEMENT_TYPE_STYLE[movement.type]}`}
          >
            {MOVEMENT_TYPE_LABELS[movement.type]}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-neutral-800">
            {nameIndex.get(movement.ingredientId) ?? movement.ingredientId}
            {movement.note && (
              <span className="ml-2 font-normal text-neutral-400">{movement.note}</span>
            )}
          </span>
          <span
            className={`shrink-0 text-[13px] font-black tabular-nums ${
              movement.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {movement.quantity > 0 ? '+' : ''}
            {movement.quantity}
          </span>
          <span className="shrink-0 text-[11.5px] text-neutral-400">
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
    return <div className="h-24 animate-pulse rounded-2xl bg-neutral-200/60" />
  }

  if (alerts.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/[0.1] px-4 py-12 text-center text-[13px] text-neutral-400">
        {COPY.inventory.alerts.empty}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <LowStockAlert alerts={alerts} showLink={false} />
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
        {alerts.map((ingredient) => (
          <div
            key={ingredient.id}
            className="flex items-center gap-4 border-b border-black/[0.04] px-4 py-3 last:border-b-0"
          >
            <AlertTriangle size={14} className="shrink-0 text-red-500" />
            <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-neutral-800">
              {ingredient.name}
            </span>
            <span className="shrink-0 text-[13px] font-black tabular-nums text-red-600">
              {COPY.inventory.alerts.stockOf(
                `${ingredient.currentStock} ${INGREDIENT_UNIT_LABELS[ingredient.unit]}`,
                String(ingredient.minimumStock),
              )}
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
    <div className="flex flex-col gap-5">
      {/* Tabs */}
      <div className="flex w-fit flex-wrap rounded-xl border border-black/[0.07] bg-white p-1 shadow-sm">
        {Object.values(INVENTORY_TAB).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[12.5px] font-bold transition-colors ${
              tab === t ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {TAB_LABELS[t]}
            {t === INVENTORY_TAB.alerts && alertCount > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-px text-[9.5px] font-black text-white">
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === INVENTORY_TAB.ingredients && (
        <IngredientsTab tenantId={tenantId} createdBy={createdBy} />
      )}
      {tab === INVENTORY_TAB.recipes && <RecipesTab tenantId={tenantId} />}
      {tab === INVENTORY_TAB.movements && <MovementsTab tenantId={tenantId} />}
      {tab === INVENTORY_TAB.alerts && <AlertsTab tenantId={tenantId} />}
    </div>
  )
}
