import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@shared/ui/components/Button'
import { categoryFormSchema, defaultCategoryFormValues } from '../../types/menu.types'
import type { CategoryFormValues } from '../../types/menu.types'
import type { Category } from '@core/domain/entities/Category'

interface CategoryFormModalProps {
  initialCategory?: Category | null
  isLoading: boolean
  error: string | null
  onSubmit: (values: CategoryFormValues) => Promise<void>
  onClose: () => void
}

export function CategoryFormModal({
  initialCategory,
  isLoading,
  error,
  onSubmit,
  onClose,
}: CategoryFormModalProps) {
  const [values, setValues] = useState<CategoryFormValues>(
    initialCategory
      ? { name: initialCategory.name, description: initialCategory.description ?? '' }
      : defaultCategoryFormValues,
  )
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CategoryFormValues, string>>>({})

  const set = <K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = categoryFormSchema.safeParse(values)
    if (!result.success) {
      const errors: Partial<Record<keyof CategoryFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CategoryFormValues
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    await onSubmit(result.data)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface-0 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-surface-900">
            {initialCategory ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-surface-400 hover:bg-surface-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-surface-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej: Entradas, Platos fuertes..."
              className={fieldInputClass(!!fieldErrors.name)}
              autoFocus
            />
            {fieldErrors.name && (
              <p className="text-xs text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-surface-700">Descripción</label>
            <input
              type="text"
              value={values.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descripción opcional..."
              className={fieldInputClass(false)}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              {initialCategory ? 'Guardar' : 'Agregar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function fieldInputClass(hasError: boolean) {
  return [
    'w-full rounded-xl border bg-surface-0 px-4 py-2.5 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
    hasError ? 'border-red-400' : 'border-surface-200',
  ].join(' ')
}
