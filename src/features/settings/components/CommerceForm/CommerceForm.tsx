import { useState } from 'react'
import type { Tenant, TenantDeliveryConfig, TenantTaxConfig } from '@core/domain/entities/Tenant'
import { Spinner } from '@shared/ui/components/Spinner'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export interface CommerceFormValues {
  deliveryConfig: TenantDeliveryConfig
  taxConfig: TenantTaxConfig
}

interface Props {
  tenant: Tenant
  isLoading: boolean
  error: string | null
  success: boolean
  onSubmit: (values: CommerceFormValues) => void
}

export function CommerceForm({ tenant, isLoading, error, success, onSubmit }: Props) {
  const [deliveryEnabled, setDeliveryEnabled] = useState(tenant.deliveryConfig?.enabled ?? false)
  const [deliveryCost, setDeliveryCost] = useState(tenant.deliveryConfig?.cost ?? 2000)
  const [freeThreshold, setFreeThreshold] = useState<string>(tenant.deliveryConfig?.freeDeliveryThreshold?.toString() ?? '')

  const [taxEnabled, setTaxEnabled] = useState(tenant.taxConfig?.enabled ?? false)
  const [taxIncluded, setTaxIncluded] = useState(tenant.taxConfig?.includedInPrice ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onSubmit({
      deliveryConfig: {
        enabled: deliveryEnabled,
        cost: deliveryCost,
        freeDeliveryThreshold: freeThreshold.trim() !== '' ? Number(freeThreshold) : null,
      },
      taxConfig: {
        enabled: taxEnabled,
        rate: 0.13, // Fijo en Costa Rica por ahora
        includedInPrice: taxIncluded,
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Delivery Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">Costo de Envío (Express)</h3>
        
        <label className="flex items-start gap-3 p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 cursor-pointer">
          <div className="mt-0.5 relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={deliveryEnabled}
              onChange={(e) => setDeliveryEnabled(e.target.checked)}
              className="peer sr-only"
            />
            <div className={`h-5 w-5 rounded-md border-2 transition-colors flex items-center justify-center ${deliveryEnabled ? 'border-amber-500 bg-amber-500' : 'border-neutral-300 bg-white'}`}>
              {deliveryEnabled && <CheckCircle2 size={12} className="text-white" />}
            </div>
          </div>
          <div>
            <span className="text-[14px] font-bold text-neutral-900 block">Habilitar envíos a domicilio</span>
            <span className="text-[13px] text-neutral-500 block mt-0.5">Permite a los clientes seleccionar "Delivery" y suma este costo a su cuenta.</span>
          </div>
        </label>

        {deliveryEnabled && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mt-4 pl-4 border-l-2 border-amber-200">
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-neutral-500 uppercase tracking-wider">Costo Fijo (₡)</label>
              <input
                type="number"
                min="0"
                value={deliveryCost}
                onChange={e => setDeliveryCost(Number(e.target.value))}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-bold text-neutral-900 outline-none transition-colors focus:border-amber-400 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-neutral-500 uppercase tracking-wider">Envío gratis si supera (₡)</label>
              <input
                type="number"
                min="0"
                placeholder="Opcional"
                value={freeThreshold}
                onChange={e => setFreeThreshold(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-bold text-neutral-900 outline-none transition-colors focus:border-amber-400 focus:bg-white"
              />
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-neutral-100" />

      {/* Tax Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider">Impuestos (IVA 13%)</h3>
        
        <label className="flex items-start gap-3 p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 cursor-pointer">
          <div className="mt-0.5 relative flex items-center justify-center">
            <input
              type="checkbox"
              checked={taxEnabled}
              onChange={(e) => setTaxEnabled(e.target.checked)}
              className="peer sr-only"
            />
            <div className={`h-5 w-5 rounded-md border-2 transition-colors flex items-center justify-center ${taxEnabled ? 'border-amber-500 bg-amber-500' : 'border-neutral-300 bg-white'}`}>
              {taxEnabled && <CheckCircle2 size={12} className="text-white" />}
            </div>
          </div>
          <div>
            <span className="text-[14px] font-bold text-neutral-900 block">Mostrar IVA en facturas</span>
            <span className="text-[13px] text-neutral-500 block mt-0.5">Calcula el 13% de la cuenta y lo desglosa en la factura térmica del POS.</span>
          </div>
        </label>

        {taxEnabled && (
          <div className="space-y-3 mt-4 pl-4 border-l-2 border-amber-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={taxIncluded} onChange={() => setTaxIncluded(true)} className="accent-amber-500 w-4 h-4" />
              <span className="text-[14px] text-neutral-800 font-medium"><strong>El precio del menú ya incluye el IVA</strong> (Solo se extrae para mostrar en la factura)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={!taxIncluded} onChange={() => setTaxIncluded(false)} className="accent-amber-500 w-4 h-4" />
              <span className="text-[14px] text-neutral-800 font-medium"><strong>Cobrar IVA por aparte</strong> (Se suma 13% extra al total en el carrito)</span>
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-700">
          <CheckCircle2 size={16} />
          Configuración guardada correctamente
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto rounded-2xl bg-black px-8 py-3.5 text-[14px] font-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
      >
        {isLoading ? <Spinner size="sm" /> : 'Guardar Configuración'}
      </button>
    </form>
  )
}
