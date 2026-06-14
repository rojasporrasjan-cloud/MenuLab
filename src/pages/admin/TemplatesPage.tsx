import { useState } from 'react'
import { CheckCircle2, ExternalLink, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@shared/utils/cn'
import { useTenantContext } from '@app/providers/TenantProvider'
import { TEMPLATE_DEFINITIONS } from '@features/templates'
import { useUpdateTemplate } from '@features/settings/hooks/useUpdateTemplate'
import { Button } from '@shared/ui/components/Button'
import { ROUTES } from '@shared/constants/routes'
import type { TemplateId } from '@core/domain/entities/Tenant'

export default function TemplatesPage() {
  const { tenant, tenantId } = useTenantContext()
  const { updateTemplate, isLoading, error } = useUpdateTemplate(tenantId)
  const [applying, setApplying] = useState<string | null>(null)

  const currentTemplateId = tenant?.templateId ?? 'dark-modern'

  const handleApply = async (templateId: string) => {
    if (templateId === currentTemplateId) return
    setApplying(templateId)
    await updateTemplate(templateId)
    setApplying(null)
  }

  const menuPreviewUrl = `/${tenantId}/menu`

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-600">
            Diseño
          </p>
          <h1 className="text-[22px] font-black leading-tight tracking-tight text-surface-900">
            Plantillas
          </h1>
          <p className="text-[13px] text-surface-500">
            Elige el diseño visual de tu menú público. El cambio se aplica de inmediato.
          </p>
        </div>
        <Button variant="secondary" size="sm" asChild className="rounded-xl shadow-sm">
          <Link to={menuPreviewUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} className="mr-1.5" />
            Ver menú
          </Link>
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Template grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.values(TEMPLATE_DEFINITIONS) as (typeof TEMPLATE_DEFINITIONS)[TemplateId][]).map((template) => {
          const isActive = currentTemplateId === template.id
          const isApplying = applying === template.id && isLoading

          return (
            <div
              key={template.id}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-200',
                isActive
                  ? 'border-amber-500 shadow-md ring-2 ring-amber-100'
                  : 'border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300',
              )}
            >
              {/* Active badge */}
              {isActive && (
                <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                  <CheckCircle2 size={10} />
                  Activa
                </div>
              )}

              {/* Visual preview mockup */}
              <TemplateMockup template={template} primaryColor={tenant?.branding.primaryColor ?? '#e11d48'} />

              {/* Info */}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-800">{template.name}</h3>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-150 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-650"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-auto pt-1">
                  {isActive ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700">
                      <Sparkles size={14} />
                      Plantilla activa
                    </div>
                  ) : (
                    <Button
                      className="w-full rounded-xl"
                      variant="secondary"
                      isLoading={isApplying}
                      onClick={() => void handleApply(template.id)}
                    >
                      Usar esta plantilla
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info banner */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
        <p className="text-xs text-zinc-500 leading-relaxed">
          <span className="font-semibold text-zinc-700">Tip:</span> El color principal, logo e
          imagen de portada que configuraste en{' '}
          <Link to={ROUTES.admin.settings} className="text-amber-600 hover:underline font-semibold">
            Configuración
          </Link>{' '}
          se aplican automáticamente en todas las plantillas.
        </p>
      </div>
    </div>
  )
}

// ── Template mockup visual ────────────────────────────────────────────────────

function TemplateMockup({
  template,
  primaryColor,
}: {
  template: (typeof TEMPLATE_DEFINITIONS)[TemplateId]
  primaryColor: string
}) {
  if (template.previewStyle === 'dark') {
    return (
      <div className="h-44 overflow-hidden" style={{ backgroundColor: template.previewBg }}>
        {/* Header bar */}
        <div className="h-16 bg-gradient-to-r from-neutral-800 to-neutral-700 flex items-end pb-2 px-3 gap-2">
          <div className="h-6 w-6 rounded-md bg-neutral-600" />
          <div className="flex flex-col gap-1">
            <div className="h-1.5 w-16 rounded-full bg-white/40" />
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>
        </div>
        {/* Category pills */}
        <div className="flex gap-1.5 px-3 py-2">
          <div className="h-5 w-14 rounded-full" style={{ backgroundColor: primaryColor }} />
          <div className="h-5 w-14 rounded-full bg-white/10" />
          <div className="h-5 w-14 rounded-full bg-white/10" />
        </div>
        {/* Cards */}
        <div className="grid grid-cols-2 gap-1.5 px-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-neutral-800/60 border border-white/10" />
          ))}
        </div>
      </div>
    )
  }

  if (template.previewStyle === 'light') {
    return (
      <div className="h-44 overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2.5">
          <div className="h-7 w-7 rounded-lg" style={{ backgroundColor: primaryColor }} />
          <div className="flex flex-col gap-1">
            <div className="h-1.5 w-16 rounded-full bg-neutral-300" />
            <div className="h-1 w-10 rounded-full bg-neutral-200" />
          </div>
        </div>
        {/* Category pills */}
        <div className="flex gap-1.5 border-b border-neutral-100 px-3 py-2">
          <div className="h-5 w-14 rounded-full" style={{ backgroundColor: primaryColor }} />
          <div className="h-5 w-14 rounded-full bg-neutral-100" />
          <div className="h-5 w-12 rounded-full bg-neutral-100" />
        </div>
        {/* List items */}
        <div className="flex flex-col gap-1.5 px-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-neutral-100 p-1.5">
              <div className="h-8 w-8 rounded-lg bg-neutral-100 shrink-0" />
              <div className="flex flex-1 flex-col gap-1">
                <div className="h-1.5 w-16 rounded-full bg-neutral-200" />
                <div className="h-1 w-10 rounded-full bg-neutral-100" />
              </div>
              <div className="h-1.5 w-8 rounded-full shrink-0" style={{ backgroundColor: `${primaryColor}80` }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // warm
  return (
    <div className="h-44 overflow-hidden" style={{ backgroundColor: '#FDF6EC' }}>
      {/* Hero image area */}
      <div className="h-16 flex items-end justify-center pb-2" style={{ backgroundColor: '#7C4A1E' }}>
        <div className="flex flex-col items-center gap-0.5">
          <div className="h-6 w-6 rounded-full bg-white/30 mb-0.5" />
          <div className="h-2 w-14 rounded-full bg-white/60" />
          <div className="h-1 w-8 rounded-full bg-white/40" />
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-0 border-b px-2 pt-1" style={{ borderColor: '#E8D5B7' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn('px-3 pb-1.5 pt-1', i === 1 ? 'border-b-2' : '')}
            style={i === 1 ? { borderColor: primaryColor } : undefined}
          >
            <div className={cn('h-1.5 rounded-full', i === 1 ? 'w-10 bg-neutral-700' : 'w-8 bg-neutral-300')} />
          </div>
        ))}
      </div>
      {/* 2-col grid */}
      <div className="grid grid-cols-2 gap-1.5 px-2 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: '#E8D5B7', backgroundColor: '#FFFBF5' }}>
            <div className="h-7" style={{ backgroundColor: '#E8D5B7' }} />
            <div className="flex flex-col gap-0.5 p-1">
              <div className="h-1.5 w-10 rounded-full bg-neutral-300" />
              <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: `${primaryColor}90` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
