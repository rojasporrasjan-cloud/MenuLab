import { Link } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { useState } from 'react'

import { ROUTES } from '@shared/constants/routes'

interface UpgradeBannerProps {
  readonly message: string
  /** Permite ocultarlo durante la sesión. */
  readonly dismissible?: boolean
}

export function UpgradeBanner({ message, dismissible = true }: UpgradeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(124,58,237,0.05) 100%)',
        border: '1px solid rgba(139,92,246,0.25)',
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'rgba(139,92,246,0.15)' }}
      >
        <Sparkles size={15} style={{ color: '#7c3aed' }} />
      </div>
      <p className="min-w-0 flex-1 text-[13px] font-semibold" style={{ color: '#4c1d95' }}>
        {message}
      </p>
      <Link
        to={ROUTES.admin.plan}
        className="shrink-0 rounded-xl px-3.5 py-2 text-[12px] font-black text-white transition-transform active:scale-95"
        style={{ background: '#7c3aed' }}
      >
        Mejorar plan
      </Link>
      {dismissible && (
        <button
          type="button"
          aria-label="Ocultar"
          onClick={() => setIsDismissed(true)}
          className="shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5"
          style={{ color: '#7c3aed' }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
