import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'

import type { Dish } from '@core/domain/entities/Dish'
import type { Ingredient } from '@core/domain/entities/Ingredient'
import type { RecipeItem } from '@core/domain/entities/Recipe'
import {
  calculateFoodCostAmount,
  calculateFoodCostPercent,
} from '@core/domain/entities/Recipe'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { COPY } from '@shared/copy/ui.copy'

import { useRecipe } from '../../hooks/useRecipe'
import { useSaveRecipe } from '../../hooks/useSaveRecipe'
import { INGREDIENT_UNIT_LABELS } from '../../types/inventory.types'
import { FoodCostDisplay } from '../FoodCostDisplay'

interface RecipeEditorProps {
  readonly tenantId: string
  readonly dish: Dish
  readonly ingredients: readonly Ingredient[]
}

const DEFAULT_YIELD = 1

/** Editor de receta: ingredientes + cantidades → food cost vs precio del plato. */
export function RecipeEditor({ tenantId, dish, ingredients }: RecipeEditorProps) {
  const { data: recipe, isLoading } = useRecipe(tenantId, dish.id)
  const saveRecipe = useSaveRecipe()

  const [items, setItems] = useState<RecipeItem[]>([])
  const [recipeYield, setRecipeYield] = useState(DEFAULT_YIELD)

  // Sembrar los campos editables cuando cambia el plato o cuando llega la receta
  // async por primera vez — ajustar estado durante el render (sin useEffect, y
  // sin pisar las ediciones del usuario en refetches de fondo).
  const [syncedFor, setSyncedFor] = useState<string | null>(null)
  const syncKey = `${dish.id}:${recipe ? 'loaded' : 'empty'}`
  if (syncKey !== syncedFor) {
    setSyncedFor(syncKey)
    setItems(recipe ? [...recipe.items] : [])
    setRecipeYield(recipe?.yield ?? DEFAULT_YIELD)
  }

  const available = useMemo(
    () => ingredients.filter((i) => !items.some((item) => item.ingredientId === i.id)),
    [ingredients, items],
  )

  // Preview en vivo — el valor final lo recalcula el use-case al guardar.
  const foodCostAmount = calculateFoodCostAmount(items, ingredients, recipeYield)
  const foodCostPercent = calculateFoodCostPercent(foodCostAmount, dish.price.amount)

  function handleAddIngredient(ingredientId: string) {
    const ingredient = ingredients.find((i) => i.id === ingredientId)
    if (!ingredient) return
    setItems((prev) => [
      ...prev,
      {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        quantity: 1,
        unit: ingredient.unit,
      },
    ])
  }

  function handleQuantityChange(ingredientId: string, quantity: number) {
    setItems((prev) =>
      prev.map((item) => (item.ingredientId === ingredientId ? { ...item, quantity } : item)),
    )
  }

  function handleRemove(ingredientId: string) {
    setItems((prev) => prev.filter((item) => item.ingredientId !== ingredientId))
  }

  function handleSave() {
    saveRecipe.mutate({
      tenantId,
      dishId: dish.id,
      items,
      yield: recipeYield,
      dishPrice: dish.price.amount,
      ingredients,
    })
  }

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
  }

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      {/* Header: plato + food cost */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-black text-neutral-900">{dish.name}</h3>
          <p className="text-[12px] text-neutral-400">
            {formatCurrency(dish.price.amount, dish.price.currency)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-neutral-500">
          <span>
            {COPY.inventory.recipes.foodCost}:{' '}
            <strong className="font-black text-neutral-800">
              {formatCurrency(foodCostAmount, dish.price.currency)}
            </strong>{' '}
            {COPY.inventory.recipes.perPortion}
          </span>
          <FoodCostDisplay percent={foodCostPercent} />
        </div>
      </div>

      {/* Items */}
      <div className="mt-4 flex flex-col gap-2">
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-black/[0.1] px-4 py-5 text-center text-[12px] text-neutral-400">
            {COPY.inventory.recipes.noIngredients}
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.ingredientId}
            className="flex items-center gap-3 rounded-xl border border-black/[0.05] bg-neutral-50/70 px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-neutral-700">
              {item.ingredientName}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(item.ingredientId, Number(e.target.value) || 0)}
              aria-label={COPY.inventory.movements.quantity}
              className="w-20 rounded-lg border border-black/[0.08] bg-white px-2 py-1 text-right text-[13px] tabular-nums outline-none focus:border-neutral-400"
            />
            <span className="w-14 text-[12px] text-neutral-400">
              {INGREDIENT_UNIT_LABELS[item.unit]}
            </span>
            <button
              type="button"
              onClick={() => handleRemove(item.ingredientId)}
              aria-label={`${COPY.inventory.recipes.remove} ${item.ingredientName}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Add ingredient + yield */}
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <label
            className="text-[11px] font-black uppercase tracking-wider text-neutral-400"
            htmlFor="recipe-add-ingredient"
          >
            {COPY.inventory.recipes.addIngredient}
          </label>
          <select
            id="recipe-add-ingredient"
            value=""
            onChange={(e) => handleAddIngredient(e.target.value)}
            disabled={available.length === 0}
            className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-neutral-700 outline-none focus:border-neutral-400 disabled:opacity-40"
          >
            <option value="" disabled>
              {COPY.inventory.recipes.addIngredient}…
            </option>
            {available.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name} ({INGREDIENT_UNIT_LABELS[ingredient.unit]})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="text-[11px] font-black uppercase tracking-wider text-neutral-400"
            htmlFor="recipe-yield"
          >
            {COPY.inventory.recipes.yield}
          </label>
          <input
            id="recipe-yield"
            type="number"
            min="1"
            step="1"
            value={recipeYield}
            onChange={(e) => setRecipeYield(Math.max(1, Number(e.target.value) || 1))}
            className="mt-1 w-28 rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[13px] tabular-nums outline-none focus:border-neutral-400"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saveRecipe.isPending}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-[12.5px] font-black text-white transition-all hover:bg-neutral-700 active:scale-95 disabled:opacity-40"
        >
          {COPY.inventory.recipes.save}
        </button>
        {saveRecipe.isSuccess && (
          <span className="pb-2 text-[11px] font-bold text-emerald-600">
            {COPY.inventory.recipes.saved}
          </span>
        )}
      </div>
    </div>
  )
}
