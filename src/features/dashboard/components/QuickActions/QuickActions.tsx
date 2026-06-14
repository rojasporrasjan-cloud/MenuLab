import { memo }                                         from 'react'
import { Link }                                        from 'react-router-dom'
import { PlusCircle, QrCode, BarChart3, ArrowRight }  from 'lucide-react'
import { ROUTES }                                      from '@shared/constants/routes'

const ACTIONS = [
  {
    label:       'Nuevo plato',
    description: 'Agrega un platillo al menú',
    icon:        PlusCircle,
    to:          ROUTES.admin.dishes.new,
    chip:        'bg-brand-50 text-brand-600',
  },
  {
    label:       'Generar QR',
    description: 'Crea un código QR de mesa',
    icon:        QrCode,
    to:          ROUTES.admin.qr,
    chip:        'bg-blue-50 text-blue-600',
  },
  {
    label:       'Ver analíticas',
    description: 'Escaneos y vistas del menú',
    icon:        BarChart3,
    to:          ROUTES.admin.analytics,
    chip:        'bg-violet-50 text-violet-600',
  },
] as const

export const QuickActions = memo(function QuickActions() {
  return (
    <div className="rounded-2xl border border-surface-150 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-brand-600">
        Acciones rápidas
      </h3>

      <div className="flex flex-col gap-0.5">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-surface-50"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.chip}`}>
                <Icon size={16} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-surface-800">
                  {action.label}
                </p>
                <p className="text-[11px] text-surface-400">
                  {action.description}
                </p>
              </div>
              <ArrowRight
                size={14}
                className="shrink-0 text-surface-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
})
