import { useMemo, useState } from 'react'
import { CalendarCheck, Phone, Plus, StickyNote, Users, X, CalendarDays, UserCheck, Clock } from 'lucide-react'
import { PageHeader } from '@shared/ui/components/PageHeader'

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

// ─── Header Info ──────────────────────────────────────────────────────────────
function ReservationsHeader() {
  return (
    <div className="mb-6">
      <PageHeader
        eyebrow="Clientes"
        title="Reservas"
        subtitle="Administra las reservas para que el salón esté siempre listo."
      />
    </div>
  )
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
    <div className="group relative overflow-hidden rounded-2xl border border-black/[0.04] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-neutral-200">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col items-center justify-center shrink-0 w-[4.5rem] rounded-xl bg-neutral-100 py-2 ring-1 ring-black/5">
          <Clock size={14} className="text-neutral-400 mb-1" />
          <span className="text-[15px] font-black tabular-nums tracking-tight text-neutral-800">
            {reservation.time}
          </span>
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-1.5">
            <h3 className="truncate text-[15px] font-bold text-neutral-900">{reservation.customerName}</h3>
            <ReservationStatusBadge status={reservation.status} />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-neutral-500 font-medium">
            <a
              href={`tel:${reservation.customerPhone}`}
              className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Phone size={12} /> {reservation.customerPhone}
            </a>
            <span className="inline-flex items-center gap-1 rounded-md bg-neutral-50 px-2 py-1 text-neutral-600 border border-neutral-100">
              <Users size={12} className="text-neutral-400" /> {COPY.reservations.people(reservation.partySize)}
            </span>
          </div>
        </div>
      </div>

      {reservation.note && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[13px] text-amber-800 border border-amber-100/50">
          <StickyNote size={15} className="shrink-0 mt-0.5 text-amber-500" />
          <p className="font-medium leading-relaxed">{reservation.note}</p>
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-black/[0.04] pt-4">
          {actions.map((action) => (
            <button
              key={action.status}
              type="button"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(action.status)}
              className={`rounded-xl px-4 py-2 text-[13px] font-bold transition-all active:scale-95 disabled:opacity-50 ${
                action.status === 'cancelled' || action.status === 'no_show'
                  ? 'border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300'
                  : 'bg-neutral-900 text-white shadow-md shadow-neutral-900/10 hover:bg-neutral-800 hover:-translate-y-0.5'
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
      <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
        <div className="mb-5 flex items-center justify-between border-b border-neutral-100 pb-4">
          <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
            <CalendarCheck size={20} className="text-neutral-400" />
            {COPY.reservations.actions.newReservation}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900"
          >
            <X size={16} />
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
    { label: COPY.reservations.stats.total, value: String(stats.total), icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: COPY.reservations.stats.pending, value: String(stats.pending), icon: CalendarCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: COPY.reservations.stats.guests, value: String(stats.totalGuests), icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <ReservationsHeader />

      <div className="flex flex-col gap-6">
        {/* Filters + new */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] font-bold text-neutral-700 shadow-sm outline-none transition-colors focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} // safe: opciones generadas desde STATUS_FILTERS tipado
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[14px] font-bold text-neutral-700 shadow-sm outline-none transition-colors focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-[14px] font-black text-white shadow-md shadow-neutral-900/10 transition-all hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg active:scale-95"
          >
            <Plus size={16} /> {COPY.reservations.actions.newReservation}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statCards.map((s) => (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-black/[0.04] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[11.5px] font-bold uppercase tracking-wider text-neutral-400">{s.label}</p>
                  <p className="mt-1 text-2xl font-black tracking-tight text-neutral-900">{s.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.bg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <s.icon size={22} className={s.color} />
                </div>
              </div>
              <div className="absolute -right-6 -top-6 z-0 h-24 w-24 rounded-full bg-gradient-to-br from-black/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-100">
              <CalendarCheck size={28} className="text-neutral-300" />
            </div>
            <div>
              <h3 className="text-lg font-black text-neutral-800">No hay reservas</h3>
              <p className="mt-1 text-[14px] font-medium text-neutral-500">{COPY.reservations.empty}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
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
    </div>
  )
}
