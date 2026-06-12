import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
import { SettingsService } from '@features/settings/services/SettingsService'
import { Spinner } from '@shared/ui/components/Spinner'
import type { TenantPromo, TenantInfoFooter } from '@core/domain/entities/Tenant'

function Field({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-surface-600">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
      />
    </label>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 bg-white px-4 py-3"
    >
      <span className="text-sm font-semibold text-surface-700">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-brand-500' : 'bg-surface-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

function PromoHoursEditor({ tenantId, promo: initialPromo, infoFooter: initialInfo }: {
  tenantId: string
  promo: TenantPromo
  infoFooter: TenantInfoFooter
}) {
  const queryClient = useQueryClient()
  const [promo, setPromo] = useState<TenantPromo>(initialPromo)
  const [info, setInfo] = useState<TenantInfoFooter>(initialInfo)
  const [isSaving, setIsSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setDone(false)
    setError(null)
    try {
      await SettingsService.updatePromoAndHours(tenantId, promo, info)
      await queryClient.invalidateQueries({ queryKey: ['tenant-context'] })
      setDone(true)
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Promo del día */}
      <section className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white p-5">
        <h2 className="text-[15px] font-bold text-surface-800">Promo del día</h2>
        <Toggle label="Mostrar promo en el menú" checked={promo.enabled} onChange={(v) => setPromo((p) => ({ ...p, enabled: v }))} />
        <Field label="Título" value={promo.title} onChange={(v) => setPromo((p) => ({ ...p, title: v }))} placeholder="2x1 en cervezas" />
        <Field label="Descripción" value={promo.description} onChange={(v) => setPromo((p) => ({ ...p, description: v }))} placeholder="Solo hoy de 5 a 7 pm" />
        <Field label="Texto del botón" value={promo.ctaLabel} onChange={(v) => setPromo((p) => ({ ...p, ctaLabel: v }))} placeholder="Ver más" />
        <Field label="Enlace del botón" value={promo.ctaLink} onChange={(v) => setPromo((p) => ({ ...p, ctaLink: v }))} placeholder="https://…" />
      </section>

      {/* Horario / info */}
      <section className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white p-5">
        <h2 className="text-[15px] font-bold text-surface-800">Horario y datos</h2>
        <Toggle label="Mostrar esta info en el menú" checked={info.enabled} onChange={(v) => setInfo((i) => ({ ...i, enabled: v }))} />
        <Field label="Horario" value={info.hours} onChange={(v) => setInfo((i) => ({ ...i, hours: v }))} placeholder="Lun–Dom · 7:00 AM – 9:00 PM" />
        <Field label="Dirección" value={info.address} onChange={(v) => setInfo((i) => ({ ...i, address: v }))} placeholder="200m sur de la iglesia, Sarchí" />
        <Field label="Teléfono" value={info.phone} onChange={(v) => setInfo((i) => ({ ...i, phone: v }))} placeholder="+506 8888 8888" />
      </section>

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {done && (
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={15} /> Guardado.
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={isSaving}
        className="self-start rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2"
      >
        {isSaving ? <Spinner size="sm" /> : null}
        Guardar cambios
      </button>
    </div>
  )
}

export default function StaffPromosPage() {
  const { tenant, tenantId, isLoading } = useTenantContext()

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl font-black text-surface-900">Promos y Horarios</h1>
        <p className="text-sm text-surface-500">Actualiza la promoción del día y el horario de atención.</p>
      </header>

      {isLoading || !tenant ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <PromoHoursEditor
          key={tenant.id}
          tenantId={tenantId}
          promo={tenant.branding.promo}
          infoFooter={tenant.branding.infoFooter}
        />
      )}
    </div>
  )
}
