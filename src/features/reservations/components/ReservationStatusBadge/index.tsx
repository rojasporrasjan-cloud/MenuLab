import type { ReservationStatus } from '@core/domain/entities/Reservation'
import { COPY } from '@shared/copy/ui.copy'

interface ReservationStatusBadgeProps {
  readonly status: ReservationStatus
}

const STATUS_STYLES: Record<ReservationStatus, { bg: string; text: string }> = {
  pending: { bg: 'rgba(234,179,8,0.12)', text: '#a16207' },
  confirmed: { bg: 'rgba(59,130,246,0.12)', text: '#1d4ed8' },
  seated: { bg: 'rgba(34,197,94,0.12)', text: '#15803d' },
  cancelled: { bg: 'rgba(115,115,115,0.12)', text: '#525252' },
  no_show: { bg: 'rgba(239,68,68,0.12)', text: '#b91c1c' },
}

export function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
  const style = STATUS_STYLES[status]
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide"
      style={{ background: style.bg, color: style.text }}
    >
      {COPY.reservations.status[status]}
    </span>
  )
}
