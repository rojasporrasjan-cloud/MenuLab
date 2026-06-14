import { Check } from 'lucide-react'

interface MarketItem {
  readonly name: string
  readonly priceUsd: number
}

/** Lo que cuesta cada sistema por separado (promedios de mercado, USD/mes). */
const MARKET_ITEMS: readonly MarketItem[] = [
  { name: 'Sistema POS / comandero', priceUsd: 69 },
  { name: 'Pedidos en línea', priceUsd: 59 },
  { name: 'Sistema de reservas', priceUsd: 49 },
  { name: 'Programa de lealtad', priceUsd: 49 },
  { name: 'Analíticas de ventas', priceUsd: 39 },
  { name: 'Menú digital con QR', priceUsd: 29 },
] as const

const MARKET_TOTAL_USD = MARKET_ITEMS.reduce((sum, item) => sum + item.priceUsd, 0)

/** Todo lo que entra en el plan — el checklist que cierra la venta. */
const INCLUDED_FEATURES: readonly string[] = [
  'Menú digital ilimitado',
  '26 plantillas profesionales',
  'QR por mesa ilimitados',
  'Pedidos por WhatsApp',
  'Comer ahí · llevar · domicilio',
  'Pantalla de cocina (KDS)',
  'POS comandero con PIN',
  'Panel para tu equipo',
  'CRM de clientes',
  'Inventario y food cost',
  'Lealtad con sellos',
  'Reservas en línea',
  'Platos en AR 3D',
  'Digitalización con IA',
  'Analíticas en vivo',
  'Nuevas features cada mes',
] as const

/**
 * El argumento del precio: la pila de sistemas que un restaurante paga por
 * separado (tachada) contra el plan único. Debajo, el checklist completo de
 * lo incluido — la razón para quedarse leyendo.
 */
export function ValueStack() {
  return (
    <div className="flex flex-col gap-10">
      {/* Comparación de mercado */}
      <div className="mk-grain relative overflow-hidden rounded-[2rem] bg-[#0b0907] p-7 sm:p-10">
        <div className="pointer-events-none absolute inset-0 select-none">
          <div className="mk-aurora absolute right-[-15%] top-[-50%] h-[340px] w-[340px] rounded-full bg-[#e99a0e]/20 blur-[110px]" />
        </div>

        <div className="relative z-[2] grid items-center gap-10 lg:grid-cols-2">
          {/* Lo que pagarías por separado */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/40">
              Armar esto con sistemas separados*
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              {MARKET_ITEMS.map((item) => (
                <div key={item.name} className="flex items-baseline justify-between gap-4 border-b border-dashed border-white/[0.08] pb-2.5">
                  <span className="text-sm font-semibold text-white/55">{item.name}</span>
                  <span className="font-mono text-sm font-bold text-white/35 line-through decoration-red-400/60 decoration-2">
                    ${item.priceUsd}/mes
                  </span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 pt-1">
                <span className="text-sm font-black text-white/70">Total por separado</span>
                <span className="font-mono text-xl font-black text-red-300/90 line-through decoration-red-400 decoration-[3px]">
                  ~${MARKET_TOTAL_USD}/mes
                </span>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-white/25">*Precios promedio del mercado en USD.</p>
          </div>

          {/* Lo que cuesta aquí */}
          <div className="rounded-3xl border border-[#f5b520]/25 bg-[#f5b520]/[0.06] p-7 text-center sm:p-9">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#f7c94a]">
              Aquí, todo junto
            </p>
            <p className="mt-4 text-5xl font-black tracking-tight text-white sm:text-6xl">
              ₡9.900
              <span className="text-lg font-bold text-white/40">/mes</span>
            </p>
            <p className="mt-2 text-sm font-bold text-[#f7c94a]">≈ $19 — menos que un casado al día</p>
            <p className="mx-auto mt-4 max-w-xs text-[13px] leading-relaxed text-white/50">
              Y no son seis sistemas pegados con cinta: es <strong className="text-white/80">uno solo</strong> donde
              el pedido, la cocina, el inventario y el cliente se hablan entre sí.
            </p>
            <p className="mt-5 inline-block rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-[11px] font-black text-emerald-300">
              Empezás gratis · sin tarjeta
            </p>
          </div>
        </div>
      </div>

      {/* Checklist de todo lo incluido */}
      <div>
        <p className="mb-5 text-center text-[11px] font-black uppercase tracking-[0.3em] text-[#cc7809]">
          Todo esto está incluido
        </p>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {INCLUDED_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-[13.5px] font-semibold text-[#3d3b38]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f5b520]/15 text-[#cc7809]">
                <Check size={11} strokeWidth={3.5} />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
