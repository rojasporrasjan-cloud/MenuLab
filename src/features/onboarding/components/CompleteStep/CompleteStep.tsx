import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Palette, LayoutDashboard, AlertCircle, Copy, Check, ExternalLink, Sparkles } from 'lucide-react'
import { Button } from '@shared/ui/components/Button'
import { ROUTES } from '@shared/constants/routes'
import { MenuDigitizerModal } from '../MenuDigitizerModal/MenuDigitizerModal'

interface CompleteStepProps {
  readonly tenantId: string
  readonly tenantName: string
  readonly isLoading: boolean
  readonly error: string | null
  readonly onFinish: () => void
  readonly onBack: () => void
}

export function CompleteStep({ tenantId, tenantName, isLoading, error, onFinish, onBack }: CompleteStepProps) {
  const [copied, setCopied] = useState(false)
  const [isDigitizerOpen, setIsDigitizerOpen] = useState(false)
  const menuUrl = `${window.location.origin}/${tenantId}/menu`

  const handleCopy = () => {
    void navigator.clipboard.writeText(menuUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Hero */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 size={36} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-surface-900">¡Todo listo!</h2>
          <p className="mt-1.5 text-sm text-surface-500">
            Lo siguiente — elegí cómo se va a ver tu menú.
            Tenemos 26 plantillas listas para que solo cambies colores y subas fotos.
          </p>
        </div>
      </div>

      {/* Menu URL */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-800">
          Tu link del menú
        </p>
        <p className="mb-3 truncate font-mono text-[12px] font-semibold text-surface-900">
          {menuUrl}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all"
            style={{
              background: copied ? '#d1fae5' : '#fff',
              border: `1px solid ${copied ? '#6ee7b7' : 'rgba(217,119,6,0.3)'}`,
              color: copied ? '#065f46' : '#92400e',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-amber-800 transition-all hover:bg-amber-50"
          >
            <ExternalLink size={12} />
            Ver menú
          </a>
        </div>
      </div>

      {/* AI Scanner Banner */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/45 p-4 flex flex-col sm:flex-row items-center gap-4 hover:bg-amber-50 hover:border-amber-300 transition-all">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Sparkles size={22} className="animate-pulse" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h4 className="text-sm font-bold text-surface-900">¿Tienes un menú físico en papel?</h4>
          <p className="text-[11.5px] text-surface-500 mt-0.5 leading-relaxed">
            Sube una foto de tu menú y nuestra Inteligencia Artificial cargará tus platos, descripciones y precios al instante.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDigitizerOpen(true)}
          className="w-full sm:w-auto shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2.5 text-xs font-black text-white shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Escanear Menú Físico ⚡
        </button>
      </div>

      {/* Quick actions — primary action goes to Templates (visual decision first) */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to={ROUTES.admin.templates}
          onClick={onFinish}
          className="flex flex-col items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center transition-all hover:bg-amber-100 hover:border-amber-300"
        >
          <Palette size={20} className="text-amber-600" />
          <div>
            <p className="text-[13px] font-bold text-amber-900">Elige una plantilla</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Personaliza el diseño visual</p>
          </div>
        </Link>

        <Link
          to={ROUTES.admin.dashboard}
          onClick={onFinish}
          className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center transition-all hover:bg-zinc-100"
        >
          <LayoutDashboard size={20} className="text-zinc-600" />
          <div>
            <p className="text-[13px] font-bold text-zinc-800">Ir al dashboard</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Agrega platos y más</p>
          </div>
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-700 border border-red-200">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onBack} className="flex-1">
          Atrás
        </Button>
        <Button
          type="button"
          className="flex-1"
          isLoading={isLoading}
          onClick={onFinish}
        >
          Comenzar
        </Button>
      </div>

      <MenuDigitizerModal
        isOpen={isDigitizerOpen}
        onClose={() => setIsDigitizerOpen(false)}
        tenantId={tenantId}
        tenantName={tenantName}
      />
    </div>
  )
}
