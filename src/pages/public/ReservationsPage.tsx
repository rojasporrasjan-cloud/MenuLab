import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CalendarCheck, UtensilsCrossed } from 'lucide-react'

import { useTenantContext } from '@app/providers/TenantProvider'
import { useCreateReservation, ReservationForm } from '@features/reservations'
import type { ReservationFormValues } from '@features/reservations'
import type { Reservation } from '@core/domain/entities/Reservation'
import { buildWhatsAppUrl } from '@shared/utils/whatsapp'
import { COPY } from '@shared/copy/ui.copy'

const PAGE_BG = '#0c0c0e'
const CONFIRMATION_NUMBER_CHARS = 4

function buildReservationMessage(values: ReservationFormValues, restaurantName: string): string {
  const divider = '──────────────────'
  const parts = [
    `📅 *${COPY.reservations.whatsappMessage}* — ${restaurantName}`,
    divider,
    `👤 ${values.customerName.trim()}`,
    `📞 ${values.customerPhone.trim()}`,
    `🗓 ${values.date} · ${values.time}`,
    `👥 ${COPY.reservations.people(values.partySize)}`,
  ]
  if (values.note.trim()) parts.push(`📝 ${values.note.trim()}`)
  parts.push(divider)
  parts.push('_Enviada desde la carta digital_')
  return parts.join('\n')
}

export default function ReservationsPage() {
  const { tenantId = '' } = useParams<{ tenantId: string }>()
  const { tenant, isLoading } = useTenantContext()
  const createReservation = useCreateReservation()
  const [confirmed, setConfirmed] = useState<Reservation | null>(null)

  const bookingUrl = tenant?.branding.reservation.bookingUrl ?? ''
  const accentColor = tenant?.branding.primaryColor ?? '#e99a0e'
  const reservationPhone =
    tenant?.branding.reservation.phone ||
    tenant?.branding.infoFooter.phone ||
    tenant?.branding.socials.whatsapp ||
    ''

  // Si el restaurante usa un sistema externo de reservas, redirigimos ahí.
  useEffect(() => {
    if (bookingUrl) window.location.replace(bookingUrl)
  }, [bookingUrl])

  async function handleSubmit(values: ReservationFormValues): Promise<void> {
    let reservation: Reservation | null = null
    try {
      reservation = await createReservation.mutateAsync({
        tenantId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        partySize: values.partySize,
        date: values.date,
        time: values.time,
        note: values.note.trim() || null,
        status: 'pending',
        source: 'qr',
      })
    } catch (error) {
      // Si Firestore falla la reserva igual se envía por WhatsApp —
      // el restaurante no pierde al cliente.
      void error
    }

    if (reservationPhone && tenant) {
      const message = buildReservationMessage(values, tenant.name)
      window.open(buildWhatsAppUrl(reservationPhone, message), '_blank', 'noopener,noreferrer')
    }

    if (reservation) setConfirmed(reservation)
  }

  if (!tenantId || (!tenant && !isLoading)) {
    return (
      <div className="flex min-h-svh items-center justify-center" style={{ background: PAGE_BG }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{COPY.errors.notFound}</p>
      </div>
    )
  }

  if (bookingUrl) {
    return (
      <div className="flex min-h-svh items-center justify-center" style={{ background: PAGE_BG }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{COPY.auth.loading}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center px-5 py-10" style={{ background: PAGE_BG }}>
      <div className="w-full max-w-md">
        {/* Header: logo + nombre */}
        <header className="mb-8 flex flex-col items-center gap-3 text-center">
          {tenant?.branding.logoUrl ? (
            <img
              src={tenant.branding.logoUrl}
              alt={tenant.name}
              className="h-16 w-16 rounded-2xl object-contain"
              style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }}
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
            >
              <UtensilsCrossed size={26} style={{ color: accentColor }} />
            </div>
          )}
          <div>
            <h1 className="text-xl font-black text-white">{tenant?.name}</h1>
            <p className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {COPY.reservations.publicTitle} · {COPY.reservations.publicSubtitle}
            </p>
          </div>
        </header>

        {confirmed ? (
          <div
            className="flex flex-col items-center gap-4 rounded-3xl p-8 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
            >
              <CalendarCheck size={28} style={{ color: accentColor }} />
            </div>
            <h2 className="text-lg font-black text-white">{COPY.reservations.confirmation.title}</h2>
            <p
              className="rounded-full px-4 py-1.5 text-sm font-black tabular-nums"
              style={{ background: `${accentColor}1a`, color: accentColor }}
            >
              {COPY.reservations.confirmation.number(
                confirmed.id.slice(-CONFIRMATION_NUMBER_CHARS).toUpperCase(),
              )}
            </p>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {confirmed.date} · {confirmed.time} · {COPY.reservations.people(confirmed.partySize)}
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {COPY.reservations.confirmation.detail}
            </p>
            <Link
              to={`/${tenantId}/menu`}
              className="mt-2 rounded-2xl px-6 py-3 text-sm font-black text-white transition-transform active:scale-95"
              style={{ background: accentColor }}
            >
              {COPY.reservations.confirmation.backToMenu}
            </Link>
          </div>
        ) : (
          <div
            className="rounded-3xl p-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ReservationForm
              variant="dark"
              accentColor={accentColor}
              isSubmitting={createReservation.isPending}
              onSubmit={(values) => void handleSubmit(values)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
