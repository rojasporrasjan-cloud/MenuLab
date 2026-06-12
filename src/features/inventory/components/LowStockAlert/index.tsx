import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight } from 'lucide-react'

import type { Ingredient } from '@core/domain/entities/Ingredient'
import { ROUTES } from '@shared/constants/routes'
import { COPY } from '@shared/copy/ui.copy'

interface LowStockAlertProps {
  readonly alerts: readonly Ingredient[]
  /** Oculta el link cuando ya estás dentro de la página de inventario. */
  readonly showLink?: boolean
}

/** Banner rojo con los ingredientes bajo mínimo. */
export function LowStockAlert({ alerts, showLink = true }: LowStockAlertProps) {
  if (alerts.length === 0) return null

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle size={16} className="text-red-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-black text-red-700">
          {COPY.inventory.alerts.banner(alerts.length)}
        </p>
        <p className="truncate text-[12px] text-red-500">
          {alerts.map((a) => a.name).join(', ')}
        </p>
      </div>
      {showLink && (
        <Link
          to={ROUTES.admin.inventory}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-[12px] font-black text-white transition-transform active:scale-95"
        >
          {COPY.inventory.alerts.viewInventory} <ChevronRight size={12} />
        </Link>
      )}
    </div>
  )
}
