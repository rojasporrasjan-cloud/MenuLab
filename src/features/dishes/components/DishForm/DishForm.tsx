import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@shared/ui/components/Button'
import { LIMITS } from '@shared/constants/limits'
import { DishImageUpload } from '../DishImageUpload'
import { dishFormSchema, defaultDishFormValues } from '../../types/dish.types'
import type { DishFormValues, DishFormSchemaValues } from '../../types/dish.types'
import type { Category } from '@core/domain/entities/Category'
import type { Dish } from '@core/domain/entities/Dish'
import type { DishVariantGroup, DishVariantOption } from '@core/domain/entities/Dish'

// ── Helpers ───────────────────────────────────────────────────────────────────

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function formatPriceDelta(delta: number, currency: string): string {
  if (delta === 0) return 'Incluido'
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₡'
  return `+${sym}${delta.toLocaleString()}`
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DishFormProps {
  initialDish?: Dish | null
  categories: Category[]
  isLoading: boolean
  error: string | null
  previewUrl: string | null
  uploadProgress: number
  isUploading: boolean
  onFileSelect: (file: File) => void
  onFileClear: () => void
  onSubmit: (values: DishFormValues) => void
  /** Ya hay 6+ destacados en el menú (aviso al marcar otro). */
  featuredLimitReached?: boolean
}

const STATUS_OPTIONS = [
  { value: 'available',   label: 'Disponible'     },
  { value: 'unavailable', label: 'No disponible'  },
  { value: 'seasonal',    label: 'De temporada'   },
] as const

const MAX_FEATURED = LIMITS.featured.maxFeaturedDishes

// ── Main form ─────────────────────────────────────────────────────────────────

export function DishForm({
  initialDish,
  categories,
  isLoading,
  error,
  previewUrl,
  uploadProgress,
  isUploading,
  onFileSelect,
  onFileClear,
  onSubmit,
  featuredLimitReached = false,
}: DishFormProps) {
  const [values, setValues] = useState<DishFormSchemaValues>(() =>
    initialDish ? dishToSchemaValues(initialDish) : defaultDishFormValues,
  )
  const [variantGroups, setVariantGroups] = useState<DishVariantGroup[]>(
    () => initialDish?.variantGroups ?? [],
  )
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof DishFormSchemaValues, string>>>({})
  const [showNutrition, setShowNutrition] = useState(() => Boolean(initialDish?.nutrition.calories))
  const [showVariants, setShowVariants] = useState(() => (initialDish?.variantGroups ?? []).length > 0)

  const addPresetGroup = (type: 'extras' | 'sides' | 'protein' | 'drinks') => {
    let name = ''
    let required = false
    let multiSelect = false
    let options: DishVariantOption[] = []

    if (type === 'extras') {
      name = 'Extras y Adicionales'
      required = false
      multiSelect = true
      options = [
        { id: nanoid(), name: 'Queso Extra', priceDelta: 500, available: true },
        { id: nanoid(), name: 'Tocineta', priceDelta: 800, available: true },
        { id: nanoid(), name: 'Salsa Especial', priceDelta: 300, available: true },
      ]
    } else if (type === 'sides') {
      name = 'Elige tu Acompañamiento'
      required = true
      multiSelect = false
      options = [
        { id: nanoid(), name: 'Papas Fritas', priceDelta: 0, available: true },
        { id: nanoid(), name: 'Ensalada Verde', priceDelta: 0, available: true },
        { id: nanoid(), name: 'Puré de papa', priceDelta: 0, available: true },
      ]
    } else if (type === 'protein') {
      name = 'Tipo de Proteína'
      required = true
      multiSelect = false
      options = [
        { id: nanoid(), name: 'Carne de Res', priceDelta: 0, available: true },
        { id: nanoid(), name: 'Pollo a la plancha', priceDelta: 0, available: true },
        { id: nanoid(), name: 'Torta Vegana', priceDelta: 500, available: true },
      ]
    } else if (type === 'drinks') {
      name = 'Selecciona tu Bebida'
      required = false
      multiSelect = false
      options = [
        { id: nanoid(), name: 'Refresco Natural', priceDelta: 800, available: true },
        { id: nanoid(), name: 'Gaseosa', priceDelta: 1000, available: true },
        { id: nanoid(), name: 'Agua embotellada', priceDelta: 600, available: true },
      ]
    }

    setVariantGroups((prev) => [
      ...prev,
      {
        id: nanoid(),
        name,
        required,
        multiSelect,
        options,
      },
    ])
    setShowVariants(true)
  }

  const set = <K extends keyof DishFormSchemaValues>(key: K, value: DishFormSchemaValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = dishFormSchema.safeParse(values)
    if (!result.success) {
      const errors: Partial<Record<keyof DishFormSchemaValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof DishFormSchemaValues
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    onSubmit({ ...result.data, variantGroups })
  }

  const isBusy = isLoading || isUploading

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Image */}
      <DishImageUpload
        previewUrl={previewUrl}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        onFileSelect={onFileSelect}
        onClear={onFileClear}
      />

      {/* ── Basic info ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-surface-400">
          Información básica
        </h3>

        <Field label="Nombre *" error={fieldErrors.name}>
          <input
            type="text"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ej: Casado de pollo"
            className={inputClass(!!fieldErrors.name)}
          />
        </Field>

        <Field label="Descripción" error={fieldErrors.description}>
          <textarea
            value={values.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Descripción breve del plato..."
            rows={3}
            className={`${inputClass(!!fieldErrors.description)} resize-none`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio *" error={fieldErrors.priceAmount}>
            <input
              type="number"
              min="0"
              step="50"
              value={values.priceAmount}
              onChange={(e) => set('priceAmount', e.target.value)}
              placeholder="0"
              className={inputClass(!!fieldErrors.priceAmount)}
            />
          </Field>

          <Field label="Moneda">
            <select
              value={values.priceCurrency}
              onChange={(e) => set('priceCurrency', e.target.value)}
              className={inputClass(false)}
            >
              <option value="CRC">₡ CRC</option>
              <option value="USD">$ USD</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Estado" error={fieldErrors.status}>
            <select
              value={values.status}
              onChange={(e) => set('status', e.target.value as DishFormSchemaValues['status'])}
              className={inputClass(!!fieldErrors.status)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Categoría">
            <select
              value={values.categoryId ?? ''}
              onChange={(e) => set('categoryId', e.target.value)}
              className={inputClass(false)}
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* ── Dietary & tags ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-surface-400">
          Dieta & etiquetas
        </h3>

        <div className="flex gap-4">
          <CheckboxField label="Vegetariano" checked={values.isVegetarian} onChange={(v) => set('isVegetarian', v)} />
          <CheckboxField label="Vegano"      checked={values.isVegan}      onChange={(v) => { set('isVegan', v); if (v) set('isVegetarian', true) }} />
          <CheckboxField label="Sin gluten"  checked={values.isGlutenFree} onChange={(v) => set('isGlutenFree', v)} />
        </div>

        {/* ── Destacado en el carrusel ─────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <CheckboxField
            label="Destacar ⭐"
            checked={values.featured}
            onChange={(v) => set('featured', v)}
          />
          {values.featured && featuredLimitReached && (
            <p className="text-xs font-semibold text-amber-600">
              Ya tienes {MAX_FEATURED} platos destacados — el carrusel muestra máximo {MAX_FEATURED}.
            </p>
          )}
        </div>

        <Field label="Etiquetas" hint="Separadas por coma">
          <input
            type="text"
            value={values.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="Ej: picante, popular, chef recomienda"
            className={inputClass(false)}
          />
        </Field>

        <Field label="Alérgenos" hint="Separados por coma">
          <input
            type="text"
            value={values.allergens}
            onChange={(e) => set('allergens', e.target.value)}
            placeholder="Ej: maní, mariscos, lácteos"
            className={inputClass(false)}
          />
        </Field>
      </section>

      {/* ── Variants ───────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-surface-100">
        <button
          type="button"
          onClick={() => setShowVariants((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-surface-400">
              Variantes y extras
            </span>
            {variantGroups.length > 0 && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                {variantGroups.length}
              </span>
            )}
          </div>
          {showVariants
            ? <ChevronUp size={15} className="text-surface-400" />
            : <ChevronDown size={15} className="text-surface-400" />}
        </button>

        {showVariants && (
          <div className="border-t border-surface-100 px-4 pb-4 pt-3 flex flex-col gap-4">
            <p className="text-[11px] text-surface-400 leading-relaxed">
              Agrega grupos de opciones: tamaños, personalizaciones, extras con precio adicional, etc.
            </p>

            {variantGroups.map((group, gi) => (
              <VariantGroupEditor
                key={group.id}
                group={group}
                currency={values.priceCurrency}
                onChange={(updated) =>
                  setVariantGroups((prev) => prev.map((g, i) => (i === gi ? updated : g)))
                }
                onDelete={() =>
                  setVariantGroups((prev) => prev.filter((_, i) => i !== gi))
                }
              />
            ))}

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setVariantGroups((prev) => [
                    ...prev,
                    {
                      id:          nanoid(),
                      name:        '',
                      required:    false,
                      multiSelect: false,
                      options:     [],
                    },
                  ])
                }
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-200 px-4 py-2.5 text-xs font-semibold text-surface-500 transition-colors hover:border-brand-300 hover:text-brand-600 grow"
              >
                <Plus size={13} />
                Agregar personalizado
              </button>
            </div>

            <div className="flex flex-col gap-2 bg-surface-50 border border-surface-150 rounded-xl p-3">
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">
                Plantillas rápidas predefinidas:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addPresetGroup('extras')}
                  className="inline-flex items-center gap-1 rounded-lg bg-white border border-surface-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 text-[11px] font-semibold text-surface-600 px-2.5 py-1.5 transition-all cursor-pointer"
                >
                  ✨ + Extras / Adicionales
                </button>
                <button
                  type="button"
                  onClick={() => addPresetGroup('sides')}
                  className="inline-flex items-center gap-1 rounded-lg bg-white border border-surface-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 text-[11px] font-semibold text-surface-600 px-2.5 py-1.5 transition-all cursor-pointer"
                >
                  ✨ + Acompañamientos
                </button>
                <button
                  type="button"
                  onClick={() => addPresetGroup('protein')}
                  className="inline-flex items-center gap-1 rounded-lg bg-white border border-surface-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 text-[11px] font-semibold text-surface-600 px-2.5 py-1.5 transition-all cursor-pointer"
                >
                  ✨ + Carnes / Proteínas
                </button>
                <button
                  type="button"
                  onClick={() => addPresetGroup('drinks')}
                  className="inline-flex items-center gap-1 rounded-lg bg-white border border-surface-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 text-[11px] font-semibold text-surface-600 px-2.5 py-1.5 transition-all cursor-pointer"
                >
                  ✨ + Bebidas
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Nutrition (collapsible) ─────────────────────────────────────────── */}
      <section className="rounded-xl border border-surface-100">
        <button
          type="button"
          onClick={() => setShowNutrition((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-surface-400">
            Información nutricional
          </span>
          {showNutrition
            ? <ChevronUp size={15} className="text-surface-400" />
            : <ChevronDown size={15} className="text-surface-400" />}
        </button>

        {showNutrition && (
          <div className="border-t border-surface-100 px-4 pb-4 pt-3">
            <Field label="Calorías (kcal)">
              <input
                type="number"
                min="0"
                value={values.calories ?? ''}
                onChange={(e) => set('calories', e.target.value)}
                placeholder="Ej: 450"
                className={inputClass(false)}
              />
            </Field>
          </div>
        )}
      </section>

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" isLoading={isBusy} className="w-full">
        {isUploading
          ? `Subiendo imagen... ${uploadProgress}%`
          : isLoading
            ? 'Guardando...'
            : initialDish
              ? 'Guardar cambios'
              : 'Crear plato'}
      </Button>
    </form>
  )
}

// ── VariantGroupEditor ─────────────────────────────────────────────────────────

interface VariantGroupEditorProps {
  readonly group:    DishVariantGroup
  readonly currency: string
  readonly onChange: (updated: DishVariantGroup) => void
  readonly onDelete: () => void
}

function VariantGroupEditor({ group, currency, onChange, onDelete }: VariantGroupEditorProps) {
  const setGroup = (patch: Partial<DishVariantGroup>) =>
    onChange({ ...group, ...patch })

  const addOption = () =>
    setGroup({
      options: [
        ...group.options,
        { id: nanoid(), name: '', priceDelta: 0, available: true },
      ],
    })

  const updateOption = (index: number, patch: Partial<DishVariantOption>) =>
    setGroup({
      options: group.options.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    })

  const deleteOption = (index: number) =>
    setGroup({ options: group.options.filter((_, i) => i !== index) })

  return (
    <div className="rounded-xl border border-surface-150 bg-surface-50/50">
      {/* Group header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-surface-100">
        <GripVertical size={13} className="text-surface-300 shrink-0" />
        <input
          type="text"
          value={group.name}
          onChange={(e) => setGroup({ name: e.target.value })}
          placeholder="Nombre del grupo (ej: Tamaño, Extras...)"
          className="flex-1 bg-transparent text-sm font-semibold text-surface-800 placeholder:text-surface-300 focus:outline-none"
        />
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded-lg p-1 text-surface-300 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Group settings */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-surface-100">
        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-surface-500">
          <input
            type="checkbox"
            checked={group.required}
            onChange={(e) => setGroup({ required: e.target.checked })}
            className="h-3.5 w-3.5 rounded accent-brand-500"
          />
          Obligatorio
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-surface-500">
          <input
            type="checkbox"
            checked={group.multiSelect}
            onChange={(e) => setGroup({ multiSelect: e.target.checked })}
            className="h-3.5 w-3.5 rounded accent-brand-500"
          />
          Selección múltiple
        </label>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-1 p-2">
        {group.options.map((opt, oi) => (
          <div key={opt.id} className="flex items-center gap-2 rounded-lg bg-white border border-surface-100 px-2.5 py-1.5">
            <input
              type="text"
              value={opt.name}
              onChange={(e) => updateOption(oi, { name: e.target.value })}
              placeholder="Opción (ej: Grande)"
              className="flex-1 bg-transparent text-xs text-surface-700 placeholder:text-surface-300 focus:outline-none"
            />
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-surface-400">+</span>
              <input
                type="number"
                min="0"
                step="100"
                value={opt.priceDelta}
                onChange={(e) => updateOption(oi, { priceDelta: parseFloat(e.target.value) || 0 })}
                className="w-20 rounded-lg border border-surface-200 bg-surface-0 px-2 py-0.5 text-right text-xs font-mono text-surface-700 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
              <span className="text-[10px] text-surface-400 w-7">
                {currency === 'USD' ? 'USD' : currency === 'EUR' ? 'EUR' : 'CRC'}
              </span>
            </div>
            <span className="text-[9px] text-surface-300 shrink-0 w-14 text-right">
              {formatPriceDelta(opt.priceDelta, currency)}
            </span>
            <button
              type="button"
              onClick={() => deleteOption(oi)}
              className="shrink-0 text-surface-200 hover:text-red-400 transition-colors"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addOption}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-surface-400 transition-colors hover:bg-white hover:text-brand-600"
        >
          <Plus size={11} />
          Agregar opción
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Field({
  label, hint, error, children,
}: {
  label: string; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-surface-700">{label}</label>
        {hint && <span className="text-xs text-surface-400">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function CheckboxField({
  label, checked, onChange,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-surface-300 accent-brand-500"
      />
      <span className="text-sm text-surface-700">{label}</span>
    </label>
  )
}

function inputClass(hasError: boolean): string {
  return [
    'w-full rounded-xl border bg-surface-0 px-4 py-2.5 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
    hasError
      ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
      : 'border-surface-200',
  ].join(' ')
}

// ── Converter ──────────────────────────────────────────────────────────────────

function dishToSchemaValues(dish: Dish): DishFormSchemaValues {
  return {
    name:          dish.name,
    description:   dish.description ?? '',
    priceAmount:   String(dish.price.amount),
    priceCurrency: dish.price.currency,
    categoryId:    dish.categoryId ?? '',
    status:        dish.status,
    isVegetarian:  dish.nutrition.isVegetarian,
    isVegan:       dish.nutrition.isVegan,
    isGlutenFree:  dish.nutrition.isGlutenFree,
    tags:          dish.tags.join(', '),
    allergens:     dish.nutrition.allergens.join(', '),
    calories:      dish.nutrition.calories != null ? String(dish.nutrition.calories) : '',
    featured:      dish.featured,
  }
}
