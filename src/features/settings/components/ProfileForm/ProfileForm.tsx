import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@shared/ui/components/Button'
import {
  profileFormSchema,
  TIMEZONE_OPTIONS,
  LOCALE_OPTIONS,
} from '../../types/settings.types'
import type { ProfileFormValues } from '../../types/settings.types'
import type { Tenant } from '@core/domain/entities/Tenant'

interface ProfileFormProps {
  tenant: Tenant
  isLoading: boolean
  error: string | null
  success: boolean
  onSubmit: (values: ProfileFormValues) => void
}

const inputClass = (hasError: boolean) =>
  [
    'w-full rounded-xl border bg-surface-0 px-4 py-2.5 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
    hasError ? 'border-red-400' : 'border-surface-200',
  ].join(' ')

export function ProfileForm({
  tenant,
  isLoading,
  error,
  success,
  onSubmit,
}: ProfileFormProps) {
  const [values, setValues] = useState<ProfileFormValues>({
    name: tenant.name,
    timezone: tenant.timezone,
    locale: tenant.locale,
  })
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ProfileFormValues, string>>
  >({})

  // Sincroniza el formulario cuando el tenant se recarga (patrón React
  // "adjust state during render" — sin useEffect, sin render extra visible).
  const [syncedTenant, setSyncedTenant] = useState(tenant)
  if (tenant !== syncedTenant) {
    setSyncedTenant(tenant)
    setValues({ name: tenant.name, timezone: tenant.timezone, locale: tenant.locale })
  }

  const set = <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = profileFormSchema.safeParse(values)
    if (!result.success) {
      const errors: Partial<Record<keyof ProfileFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ProfileFormValues
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    onSubmit(result.data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Read-only slug */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-surface-700">Slug / identificador</label>
        <div className="flex items-center gap-2 rounded-xl border border-surface-100 bg-surface-50 px-4 py-2.5">
          <span className="text-sm font-mono text-surface-500">{tenant.slug}</span>
          <span className="ml-auto text-xs text-surface-400">Solo lectura</span>
        </div>
        <p className="text-xs text-surface-400">
          Usado en URLs de tu menú público. No se puede cambiar.
        </p>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-surface-700">
          Nombre del restaurante <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Ej: Soda La Rústica"
          className={inputClass(!!fieldErrors.name)}
        />
        {fieldErrors.name && <p className="text-xs text-red-600">{fieldErrors.name}</p>}
      </div>

      {/* Timezone */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-surface-700">Zona horaria</label>
        <select
          value={values.timezone}
          onChange={(e) => set('timezone', e.target.value)}
          className={inputClass(false)}
        >
          {TIMEZONE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p className="text-xs text-surface-400">
          Afecta cómo se muestran las fechas y horas en el panel.
        </p>
      </div>

      {/* Locale */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-surface-700">Idioma / formato regional</label>
        <select
          value={values.locale}
          onChange={(e) => set('locale', e.target.value)}
          className={inputClass(false)}
        >
          {LOCALE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Feedback */}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={15} />
          Perfil guardado correctamente.
        </div>
      )}

      <Button type="submit" isLoading={isLoading} className="self-start px-6">
        Guardar cambios
      </Button>
    </form>
  )
}
