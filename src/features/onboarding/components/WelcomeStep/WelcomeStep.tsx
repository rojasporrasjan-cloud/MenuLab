import { useState } from 'react'
import { UtensilsCrossed, Sparkles, QrCode, BarChart3, FileText } from 'lucide-react'
import { Button } from '@shared/ui/components/Button'
import type { Tenant } from '@core/domain/entities/Tenant'
import { MenuDigitizerModal } from '../MenuDigitizerModal/MenuDigitizerModal'

interface WelcomeStepProps {
  tenant: Tenant
  onNext: () => void
  onSkip: () => void
  isSkipping: boolean
}

const HIGHLIGHTS = [
  {
    icon: QrCode,
    title: 'Tu menú en cada mesa',
    body:  'Genera códigos QR únicos por mesa y comparte tu carta sin papel.',
  },
  {
    icon: Sparkles,
    title: 'Vista 3D y AR',
    body:  'Tus comensales podrán ver los platos en realidad aumentada.',
  },
  {
    icon: BarChart3,
    title: 'Analíticas en vivo',
    body:  'Mide vistas, escaneos y los platos más populares en tiempo real.',
  },
]

export function WelcomeStep({ tenant, onNext }: WelcomeStepProps) {
  const [isDigitizerOpen, setIsDigitizerOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">

      {/* Hero */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 shadow-lg">
          <UtensilsCrossed size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-surface-900">
            Bienvenido, {tenant.name}
          </h2>
          <p className="mt-1.5 text-sm text-surface-500">
            Vamos a configurar tu menú digital en menos de 2 minutos.
          </p>
        </div>
      </div>

      {/* Highlights */}
      <ul className="flex flex-col gap-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="flex items-start gap-3 rounded-2xl border border-surface-100 bg-surface-50 px-4 py-3"
          >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Icon size={17} />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-surface-900">{title}</p>
              <p className="text-xs text-surface-500">{body}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onNext}
          className="text-xs text-surface-500 hover:text-surface-700 hover:underline flex items-center gap-1"
        >
          <FileText size={14} />
          Ingresar platos manualmente
        </button>
        <Button onClick={() => setIsDigitizerOpen(true)} className="px-6 w-full sm:w-auto flex items-center gap-2">
          <Sparkles size={16} />
          Escanear Menú Físico
        </Button>
      </div>

      <MenuDigitizerModal
        isOpen={isDigitizerOpen}
        onClose={() => setIsDigitizerOpen(false)}
        tenantId={tenant.id}
        tenantName={tenant.name}
        onSuccessNavigate={() => {
          setIsDigitizerOpen(false)
          onNext()
        }}
      />
    </div>
  )
}
