import { useState } from 'react'
import type { FormEvent } from 'react'

import type { Ingredient, IngredientUnit, NewIngredient } from '@core/domain/entities/Ingredient'
import { INGREDIENT_UNIT } from '@core/domain/entities/Ingredient'
import { COPY } from '@shared/copy/ui.copy'

import { INGREDIENT_UNIT_LABELS } from '../../types/inventory.types'

interface IngredientFormProps {
  readonly tenantId: string
  readonly currency: string
  /** null = crear; con valor = editar datos maestros. */
  readonly ingredient: Ingredient | null
  readonly isSaving: boolean
  readonly onSubmit: (values: NewIngredient) => void
  readonly onCancel: () => void
}

interface FormState {
  readonly name: string
  readonly unit: IngredientUnit
  readonly currentStock: string
  readonly minimumStock: string
  readonly costPerUnit: string
  readonly category: string
}

const INPUT_CLASS =
  'w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-neutral-800 outline-none transition-colors focus:border-neutral-400'

const LABEL_CLASS = 'text-[11px] font-black uppercase tracking-wider text-neutral-400'

/** Formulario de creación/edición de ingrediente. */
export function IngredientForm({
  tenantId,
  currency,
  ingredient,
  isSaving,
  onSubmit,
  onCancel,
}: IngredientFormProps) {
  const [form, setForm] = useState<FormState>({
    name: ingredient?.name ?? '',
    unit: ingredient?.unit ?? INGREDIENT_UNIT.unit,
    currentStock: ingredient ? String(ingredient.currentStock) : '0',
    minimumStock: ingredient ? String(ingredient.minimumStock) : '0',
    costPerUnit: ingredient ? String(ingredient.costPerUnit) : '0',
    category: ingredient?.category ?? '',
  })

  const isEditing = ingredient !== null

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      tenantId,
      name: form.name,
      unit: form.unit,
      currentStock: Number(form.currentStock) || 0,
      minimumStock: Number(form.minimumStock) || 0,
      costPerUnit: Number(form.costPerUnit) || 0,
      currency,
      category: form.category.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className={LABEL_CLASS} htmlFor="ingredient-name">
          {COPY.inventory.ingredients.name}
        </label>
        <input
          id="ingredient-name"
          type="text"
          required
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder={COPY.inventory.ingredients.namePlaceholder}
          className={`mt-1 ${INPUT_CLASS}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS} htmlFor="ingredient-unit">
            {COPY.inventory.ingredients.unit}
          </label>
          <select
            id="ingredient-unit"
            value={form.unit}
            onChange={(e) => setField('unit', e.target.value as IngredientUnit)} // safe: <select> solo contiene opciones de INGREDIENT_UNIT
            className={`mt-1 ${INPUT_CLASS}`}
          >
            {Object.values(INGREDIENT_UNIT).map((unit) => (
              <option key={unit} value={unit}>
                {INGREDIENT_UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="ingredient-cost">
            {COPY.inventory.ingredients.costPerUnit} ({currency})
          </label>
          <input
            id="ingredient-cost"
            type="number"
            min="0"
            step="any"
            value={form.costPerUnit}
            onChange={(e) => setField('costPerUnit', e.target.value)}
            className={`mt-1 ${INPUT_CLASS}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS} htmlFor="ingredient-stock">
            {COPY.inventory.ingredients.currentStock}
          </label>
          <input
            id="ingredient-stock"
            type="number"
            min="0"
            step="any"
            value={form.currentStock}
            onChange={(e) => setField('currentStock', e.target.value)}
            disabled={isEditing}
            title={isEditing ? COPY.inventory.movements.types.adjustment : undefined}
            className={`mt-1 ${INPUT_CLASS} disabled:bg-neutral-50 disabled:text-neutral-400`}
          />
        </div>
        <div>
          <label className={LABEL_CLASS} htmlFor="ingredient-min">
            {COPY.inventory.ingredients.minimumStock}
          </label>
          <input
            id="ingredient-min"
            type="number"
            min="0"
            step="any"
            value={form.minimumStock}
            onChange={(e) => setField('minimumStock', e.target.value)}
            className={`mt-1 ${INPUT_CLASS}`}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="ingredient-category">
          {COPY.inventory.ingredients.category}
        </label>
        <input
          id="ingredient-category"
          type="text"
          value={form.category}
          onChange={(e) => setField('category', e.target.value)}
          placeholder={COPY.inventory.ingredients.categoryPlaceholder}
          className={`mt-1 ${INPUT_CLASS}`}
        />
      </div>

      <div className="mt-1 flex items-center gap-2">
        <button
          type="submit"
          disabled={isSaving || !form.name.trim()}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-[12.5px] font-black text-white transition-all hover:bg-neutral-700 active:scale-95 disabled:opacity-40"
        >
          {isSaving ? COPY.inventory.ingredients.saving : COPY.inventory.ingredients.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-black/[0.08] px-4 py-2 text-[12.5px] font-bold text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          {COPY.inventory.ingredients.cancel}
        </button>
      </div>
    </form>
  )
}
