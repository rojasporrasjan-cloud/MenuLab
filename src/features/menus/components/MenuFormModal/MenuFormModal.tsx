import { useState } from 'react'
import { X, Clock } from 'lucide-react'
import { Button } from '@shared/ui/components/Button'
import { cn } from '@shared/utils/cn'
import { menuFormSchema, defaultMenuFormValues } from '../../types/menu.types'
import type { MenuFormValues, MenuScheduleValues } from '../../types/menu.types'
import type { Menu } from '@core/domain/entities/Menu'

interface MenuFormModalProps {
  initialMenu?: Menu | null
  isLoading: boolean
  error: string | null
  onSubmit: (values: MenuFormValues) => Promise<void>
  onClose: () => void
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo — visible en el menú público' },
  { value: 'draft', label: 'Borrador — solo visible en el admin' },
] as const

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const

function menuToFormValues(menu: Menu): MenuFormValues {
  const schedule: MenuScheduleValues = menu.schedule
    ? {
        enabled: true,
        daysOfWeek: menu.schedule.daysOfWeek,
        startTime: menu.schedule.startTime,
        endTime: menu.schedule.endTime,
      }
    : defaultMenuFormValues.schedule
  return {
    name: menu.name,
    description: menu.description ?? '',
    status: menu.status === 'archived' ? 'draft' : menu.status,
    schedule,
  }
}

export function MenuFormModal({
  initialMenu,
  isLoading,
  error,
  onSubmit,
  onClose,
}: MenuFormModalProps) {
  const [values, setValues] = useState<MenuFormValues>(
    initialMenu ? menuToFormValues(initialMenu) : defaultMenuFormValues,
  )
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof MenuFormValues, string>>>({})

  function set<K extends keyof MenuFormValues>(key: K, value: MenuFormValues[K]): void {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function setSchedule<K extends keyof MenuScheduleValues>(key: K, value: MenuScheduleValues[K]): void {
    setValues((prev) => ({ ...prev, schedule: { ...prev.schedule, [key]: value } }))
  }

  function toggleDay(day: number): void {
    const days = values.schedule.daysOfWeek
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b)
    setSchedule('daysOfWeek', next)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const result = menuFormSchema.safeParse(values)
    if (!result.success) {
      const errors: Partial<Record<keyof MenuFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof MenuFormValues
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    await onSubmit({ ...result.data, schedule: values.schedule })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface-0 p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-surface-900">
            {initialMenu ? 'Editar menú' : 'Nuevo menú'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-surface-400 hover:bg-surface-50 hover:text-surface-700"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-surface-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej: Menú del día"
              className={fieldInputClass(!!fieldErrors.name)}
            />
            {fieldErrors.name && (
              <p className="text-xs text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-surface-700">Descripción</label>
            <textarea
              value={values.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descripción opcional del menú..."
              rows={2}
              className={`${fieldInputClass(false)} resize-none`}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-surface-700">Estado</label>
            <select
              value={values.status}
              onChange={(e) => set('status', e.target.value as MenuFormValues['status'])}
              className={fieldInputClass(false)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Schedule */}
          <div className="flex flex-col gap-3 rounded-xl border border-surface-150 p-3.5">
            <button
              type="button"
              onClick={() => setSchedule('enabled', !values.schedule.enabled)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-surface-500" />
                <span className="text-xs font-medium text-surface-700">Horario programado</span>
              </div>
              <div className={cn(
                'relative h-5 w-9 rounded-full transition-colors',
                values.schedule.enabled ? 'bg-brand-500' : 'bg-surface-200',
              )}>
                <div className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                  values.schedule.enabled ? 'translate-x-4' : 'translate-x-0.5',
                )} />
              </div>
            </button>

            {values.schedule.enabled && (
              <div className="flex flex-col gap-3 pt-1">
                {/* Days */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-surface-600">Días activos</span>
                  <div className="flex gap-1 flex-wrap">
                    {DAY_LABELS.map((label, idx) => {
                      const active = values.schedule.daysOfWeek.includes(idx)
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleDay(idx)}
                          className={cn(
                            'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors border',
                            active
                              ? 'bg-brand-500 text-white border-brand-500'
                              : 'bg-surface-0 text-surface-600 border-surface-200 hover:border-surface-400',
                          )}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time range */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[11px] font-medium text-surface-600">Desde</span>
                    <input
                      type="time"
                      value={values.schedule.startTime}
                      onChange={(e) => setSchedule('startTime', e.target.value)}
                      className={fieldInputClass(false)}
                    />
                  </div>
                  <span className="mt-4 text-surface-400 text-xs">—</span>
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[11px] font-medium text-surface-600">Hasta</span>
                    <input
                      type="time"
                      value={values.schedule.endTime}
                      onChange={(e) => setSchedule('endTime', e.target.value)}
                      className={fieldInputClass(false)}
                    />
                  </div>
                </div>

                {values.schedule.daysOfWeek.length === 0 && (
                  <p className="text-[11px] text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5">
                    Selecciona al menos un día para activar el horario.
                  </p>
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              {initialMenu ? 'Guardar cambios' : 'Crear menú'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function fieldInputClass(hasError: boolean): string {
  return [
    'w-full rounded-xl border bg-surface-0 px-4 py-2.5 text-sm',
    'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
    hasError ? 'border-red-400' : 'border-surface-200',
  ].join(' ')
}
