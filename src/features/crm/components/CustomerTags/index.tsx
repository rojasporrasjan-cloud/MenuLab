import type { CSSProperties } from 'react'

import type { Customer, CustomerAutoTag } from '@core/domain/entities/Customer'
import { customerAutoTags } from '@core/domain/entities/Customer'
import { LIMITS } from '@shared/constants/limits'

interface CustomerTagsProps {
  readonly customer: Customer
}

const TAG_STYLE: Record<CustomerAutoTag, CSSProperties> = {
  Nuevo: { color: '#2563eb', background: 'rgba(37,99,235,0.10)' },
  Frecuente: { color: '#b45309', background: 'rgba(180,83,9,0.10)' },
  VIP: { color: '#7c3aed', background: 'rgba(124,58,237,0.10)' },
  Inactivo: { color: '#737373', background: 'rgba(115,115,115,0.10)' },
}

/** Chips de etiquetas automáticas (Nuevo/Frecuente/VIP/Inactivo) + manuales. */
export function CustomerTags({ customer }: CustomerTagsProps) {
  const autoTags = customerAutoTags(customer, new Date(), LIMITS.crm)

  if (autoTags.length === 0 && customer.tags.length === 0) return null

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {autoTags.map((tag) => (
        <span
          key={tag}
          className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
          style={TAG_STYLE[tag]}
        >
          {tag}
        </span>
      ))}
      {customer.tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500"
        >
          {tag}
        </span>
      ))}
    </span>
  )
}
