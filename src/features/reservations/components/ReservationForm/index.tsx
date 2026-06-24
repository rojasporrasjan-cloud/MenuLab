import { useState } from 'react'

import { LIMITS } from '@shared/constants/limits'
import { COPY } from '@shared/copy/ui.copy'

import { buildTimeSlots } from '../../types/reservations.types'

export interface ReservationFormValues {
  readonly customerName: string
  readonly customerPhone: string
  readonly partySize: number
  readonly date: string
  readonly time: string
  readonly note: string
  readonly tableId: string | null
  readonly tableLabel: string | null
}

interface ReservationFormProps {
  readonly accentColor: string
  readonly isSubmitting: boolean
  readonly onSubmit: (values: ReservationFormValues) => void
  /** Tema oscuro (página pública) o claro (modal admin). */
  readonly variant: 'dark' | 'light'
  readonly tables?: readonly { id: string; number: string; label: string | null }[]
  readonly defaultTableId?: string | null
  readonly initialValues?: ReservationFormValues
}

const TIME_SLOTS = buildTimeSlots(
  LIMITS.reservations.slotStartHour,
  LIMITS.reservations.slotEndHour,
  LIMITS.reservations.slotMinutes,
)

const PARTY_SIZES = Array.from(
  { length: LIMITS.reservations.maxPartySize - LIMITS.reservations.minPartySize + 1 },
  (_, i) => LIMITS.reservations.minPartySize + i,
)

function todayISO(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function ReservationForm({ accentColor, isSubmitting, onSubmit, variant, tables, defaultTableId, initialValues }: ReservationFormProps) {
  const [customerName, setCustomerName] = useState(initialValues?.customerName ?? '')
  const [customerPhone, setCustomerPhone] = useState(initialValues?.customerPhone ?? '')
  const [partySize, setPartySize] = useState(initialValues?.partySize ?? 2)
  const [date, setDate] = useState(initialValues?.date ?? todayISO())
  const [time, setTime] = useState(initialValues?.time ?? TIME_SLOTS[0] ?? '12:00')
  const [note, setNote] = useState(initialValues?.note ?? '')
  const [tableId, setTableId] = useState<string | null>(initialValues?.tableId ?? defaultTableId ?? null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const isDark = variant === 'dark'
  const inputClass = isDark
    ? 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-white/25'
    : 'w-full rounded-xl border border-black/[0.1] bg-white px-4 py-3 text-sm text-neutral-800 placeholder-neutral-400 outline-none focus:border-neutral-400'
  const labelClass = isDark
    ? 'text-[11px] font-bold uppercase tracking-wider text-neutral-400'
    : 'text-[11px] font-bold uppercase tracking-wider text-neutral-500'

  function handleSubmit(): void {
    if (!customerName.trim()) {
      setValidationMessage(COPY.reservations.form.nameRequired)
      return
    }
    if (!customerPhone.trim()) {
      setValidationMessage(COPY.reservations.form.phoneRequired)
      return
    }
    setValidationMessage(null)
    const tableLabel = tables?.find((t) => t.id === tableId)?.label || tables?.find((t) => t.id === tableId)?.number || null
    onSubmit({ customerName, customerPhone, partySize, date, time, note, tableId, tableLabel })
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{COPY.reservations.form.name} *</span>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder={COPY.reservations.form.namePlaceholder}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{COPY.reservations.form.phone} *</span>
        <input
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder={COPY.reservations.form.phonePlaceholder}
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{COPY.reservations.form.date} *</span>
          <input
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>{COPY.reservations.form.time} *</span>
          <select value={time} onChange={(e) => setTime(e.target.value)} className={inputClass}>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{COPY.reservations.form.partySize} *</span>
        <select
          value={partySize}
          onChange={(e) => setPartySize(Number(e.target.value))}
          className={inputClass}
        >
          {PARTY_SIZES.map((n) => (
            <option key={n} value={n}>{COPY.reservations.people(n)}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>{COPY.reservations.form.note}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={COPY.reservations.form.notePlaceholder}
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </label>

      {tables && tables.length > 0 && (
        <label className="flex flex-col gap-1.5 mt-2">
          <span className={labelClass}>Asignar Mesa (Opcional)</span>
          <select
            value={tableId ?? ''}
            onChange={(e) => setTableId(e.target.value || null)}
            className={inputClass}
          >
            <option value="">Sin asignar</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                Mesa {t.number} {t.label ? `(${t.label})` : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      {validationMessage && (
        <p className="text-xs font-semibold text-red-500">{validationMessage}</p>
      )}

      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleSubmit}
        className="mt-1 w-full rounded-2xl py-3.5 text-sm font-black text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
          boxShadow: `0 4px 18px ${accentColor}33`,
        }}
      >
        {isSubmitting ? COPY.reservations.form.sending : COPY.reservations.form.submit}
      </button>
    </div>
  )
}
