import { useMemo, useState } from 'react'
import { CalendarCheck, Phone, Plus, StickyNote, Users, X } from 'lucide-react'

import { useTenantContext } from '@app/providers/TenantProvider'
import {
  useReservationsByDate,
  useCreateReservation,
  useUpdateReservationStatus,
  ReservationForm,
  ReservationStatusBadge,
} from '@features/reservations'
import type { ReservationFormValues } from '@features/reservations'
import type { Reservation, ReservationStatus } from '@core/domain/entities/Reservation'
import { calculateReservationStats } from '@core/domain/entities/Reservation'
import { UpgradeGate } from '@features/billing'
import { COPY } from '@shared/copy/ui.copy'

type StatusFilter = ReservationStatus | 'all'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: COPY.reservations.status.pending },
  { value: 'confirmed', label: COPY.reservations.status.confirmed },
  { value: 'seated', label: COPY.reservations.status.seated },
  { value: 'cancelled', label: COPY.reservations.status.cancelled },
  { value: 'no_show', label: COPY.reservations.status.no_show },
]

/** Acciones disponibles según el estado actual de la reserva. */
const NEXT_ACTIONS: Partial<Record<ReservationStatus, { label: string; status: ReservationStatus }[]>> = {
  pending: [
    { label: COPY.reservations.actions.confirm, status: 'confirmed' },
    { label: COPY.reservations.actions.cancel, status: 'cancelled' },
  ],
  confirmed: [
    { label: COPY.reservations.actions.seat, status: 'seated' },
    { label: COPY.reservations.actions.noShow, status: 'no_show' },
    { label: COPY.reservations.actions.cancel, status: 'cancelled' },
  ],
}

function todayISO(): string {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

// ─── Reservation card ─────────────────────────────────────────────────────────

function ReservationCard({
  reservation,
  onUpdateStatus,
  isUpdating,
}: {
  reservation: Reservation
  onUpdateStatus: (status: ReservationStatus) => void
  isUpdating: boolean
}) {
  const actions = NEXT_ACTIONS[reservation.status] ?? []

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-14 shrink-0 text-base font-black tabular-nums text-neutral-900">
          {reservation.time}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold text-neutral-800">{reservation.customerName}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[12px] text-neutral-500">
            <a
              href={`tel:${reservation.customerPhone}`}
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
            >
              <Phone size={11} /> {reservation.customerPhone}
            </a>
            <span className="inline-flex items-center gap-1">
              <Users size={11} /> {COPY.reservations.people(reservation.partySize)}
            </span>
            {reservation.note && (
              <span className="inline-flex items-center gap-1">
                <StickyNote size={11} /> {reservation.note}
              </span>
            )}
          </div>
        </div>
        <ReservationStatusBadge status={reservation.status} />
      </div>

      {actions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/[0.05] pt-3">
          {actions.map((action) => (
            <button
              key={action.status}
              type="button"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(action.status)}
              className={`rounded-xl px-3.5 py-1.5 text-[12px] font-black transition-all active:scale-95 disabled:opacity-50 ${
                action.status === 'cancelled' || action.status === 'no_show'
                  ? 'border border-red-200 text-red-600 hover:bg-red-50'
                  : 'bg-neutral-900 text-white hover:bg-neutral-700'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── New reservation modal ────────────────────────────────────────────────────

function NewReservationModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: ReservationFormValues) => void
  isSubmitting: boolean
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-black text-neutral-900">
            {COPY.reservations.actions.newReservation}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] text-neutral-500 transition-colors hover:bg-neutral-100"
          >
            <X size={15} />
          </button>
        </div>
        <ReservationForm
          variant="light"
          accentColor="#171717"
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  return (
    <UpgradeGate feature="reservations">
      <ReservationsPageContent />
    </UpgradeGate>
  )
}

function ReservationsPageContent() {
  const { tenantId } = useTenantContext()
  const [date, setDate] = useState(todayISO())
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: reservations = [], isLoading } = useReservationsByDate(tenantId, date)
  const updateStatus = useUpdateReservationStatus()
  const createReservation = useCreateReservation()

  const stats = useMemo(() => calculateReservationStats(reservations), [reservations])
  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? reservations
        : reservations.filter((r) => r.status === statusFilter),
    [reservations, statusFilter],
  )

  function handleUpdateStatus(reservation: Reservation, status: ReservationStatus): void {
    updateStatus.mutate({ tenantId, reservationId: reservation.id, date, status })
  }

  async function handleCreate(values: ReservationFormValues): Promise<void> {
    await createReservation.mutateAsync({
      tenantId,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      partySize: values.partySize,
      date: values.date,
      time: values.time,
      note: values.note.trim() || null,
      status: 'confirmed',
      source: 'admin',
    })
    setIsModalOpen(false)
    setDate(values.date)
  }

  const statCards = [
    { label: COPY.reservations.stats.total, value: String(stats.total) },
    { label: COPY.reservations.stats.pending, value: String(stats.pending) },
    { label: COPY.reservations.stats.guests, value: String(stats.totalGuests) },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Filters + new */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[13px] font-semibold text-neutral-700 shadow-sm outline-none focus:border-neutral-400"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} // safe: opciones generadas desde STATUS_FILTERS tipado
            className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[13px] font-semibold text-neutral-700 shadow-sm outline-none focus:border-neutral-400"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-[12.5px] font-black text-white transition-all hover:bg-neutral-700 active:scale-95"
        >
          <Plus size={14} /> {COPY.reservations.actions.newReservation}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{s.label}</p>
            <p className="mt-1 text-xl font-black text-neutral-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-neutral-200/60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/[0.1] py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <CalendarCheck size={22} className="text-neutral-400" />
          </div>
          <p className="text-sm font-bold text-neutral-500">{COPY.reservations.empty}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onUpdateStatus={(status) => handleUpdateStatus(reservation, status)}
              isUpdating={updateStatus.isPending}
            />
          ))}
        </div>
      )}

      <NewReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(values) => void handleCreate(values)}
        isSubmitting={createReservation.isPending}
      />
    </div>
  )
}
