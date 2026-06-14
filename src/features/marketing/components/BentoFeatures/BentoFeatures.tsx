import { type ReactNode } from 'react'
import { Check, MessageCircle, Star } from 'lucide-react'

import { cn } from '@shared/utils/cn'

// ─── Celda base del bento ─────────────────────────────────────────────────────

function Cell({
  title,
  body,
  visual,
  className,
  soon = false,
}: {
  title: string
  body: string
  visual: ReactNode
  className?: string
  soon?: boolean
}) {
  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-300',
        'hover:-translate-y-1 hover:border-[#f5b520]/30 hover:bg-white/[0.05] hover:shadow-[0_20px_50px_rgba(0,0,0,0.45)]',
        className,
      )}
    >
      {soon && (
        <span className="absolute right-4 top-4 z-10 rounded-full border border-[#f5b520]/30 bg-[#f5b520]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#f7c94a]">
          Pronto
        </span>
      )}
      <div className="flex flex-1 flex-col justify-center py-2">{visual}</div>
      <h3 className="mt-4 text-[15px] font-black leading-tight text-white">{title}</h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/45">{body}</p>
    </article>
  )
}

// ─── Mini-mockups por módulo (divs puros, cero imágenes) ─────────────────────

function OrderFlowVisual() {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Modos de entrega */}
      <div className="flex gap-1.5">
        {['Comer aquí', 'Para llevar', 'Domicilio'].map((mode, index) => (
          <span
            key={mode}
            className={cn(
              'rounded-full px-3 py-1.5 text-[10px] font-bold',
              index === 2
                ? 'bg-[linear-gradient(135deg,#f5b520,#cc7809)] font-black text-[#1a1206]'
                : 'border border-white/10 bg-white/[0.04] text-white/45',
            )}
          >
            {mode}
          </span>
        ))}
      </div>
      {/* Burbuja de WhatsApp */}
      <div className="max-w-[260px] rounded-2xl rounded-tl-md border border-emerald-400/20 bg-emerald-500/10 p-3">
        <p className="flex items-center gap-1.5 text-[10px] font-black text-emerald-300">
          <MessageCircle size={11} />
          Nuevo pedido — 🛵 Domicilio
        </p>
        <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-white/60">
          2x Casado de pollo ..... ₡7.600
          <br />
          1x Fresco de cas ....... ₡1.200
          <br />
          📍 200m sur de la iglesia
        </p>
        <p className="mt-1.5 text-[10.5px] font-black text-white">Total: ₡8.800</p>
      </div>
      {/* Estado del pedido */}
      <div className="flex items-center gap-2">
        {['Recibido', 'En cocina', 'En camino'].map((stage, index) => (
          <span key={stage} className="flex items-center gap-2">
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold',
                index <= 1 ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/[0.05] text-white/40',
              )}
            >
              {index <= 1 && <Check size={9} strokeWidth={3.5} />}
              {stage}
            </span>
            {index < 2 && <span className="h-px w-3 bg-white/15" />}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Patrón QR estilizado (7×7 con buscadores en las esquinas). */
const QR_PATTERN = [
  '1110111',
  '1010101',
  '1110111',
  '0001000',
  '1100101',
  '1001010',
  '1110011',
] as const

function QrVisual() {
  return (
    <div className="flex items-center gap-4">
      <div className="grid grid-cols-7 gap-[3px] rounded-xl border border-[#f5b520]/20 bg-[#f5b520]/[0.06] p-2.5 transition-transform duration-300 group-hover:scale-105">
        {QR_PATTERN.flatMap((row, r) =>
          row.split('').map((cell, c) => (
            <span
              key={`${r}-${c}`}
              className={cn('h-[7px] w-[7px] rounded-[2px]', cell === '1' ? 'bg-[#f5b520]' : 'bg-transparent')}
            />
          )),
        )}
      </div>
      <div>
        <p className="text-[11px] font-black text-white">Mesa 7</p>
        <p className="text-[10px] font-semibold text-white/40">Escaneá y pedí</p>
      </div>
    </div>
  )
}

function KdsVisual() {
  const tickets = [
    { table: 'Mesa 4', items: '2 casados · 1 fresco', state: 'Nuevo', tone: 'border-red-400/30 bg-red-400/10 text-red-300' },
    { table: 'Mesa 2', items: '1 chifrijo', state: 'Preparando', tone: 'border-[#f5b520]/30 bg-[#f5b520]/10 text-[#f7c94a]' },
    { table: 'Llevar #31', items: '3 empanadas', state: 'Listo', tone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' },
  ] as const
  return (
    <div className="grid grid-cols-3 gap-2">
      {tickets.map((ticket) => (
        <div key={ticket.table} className={cn('rounded-xl border p-2.5', ticket.tone)}>
          <p className="text-[9px] font-black uppercase tracking-wide">{ticket.state}</p>
          <p className="mt-1.5 text-[10.5px] font-black text-white">{ticket.table}</p>
          <p className="mt-0.5 text-[9px] font-medium text-white/50">{ticket.items}</p>
        </div>
      ))}
    </div>
  )
}

function PosVisual() {
  const tables = ['bg-emerald-400/60', 'bg-white/15', 'bg-[#f5b520]/70', 'bg-emerald-400/60', 'bg-red-400/70', 'bg-white/15'] as const
  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5">
        {tables.map((tone, index) => (
          <span key={index} className={cn('flex h-9 items-center justify-center rounded-lg text-[9px] font-black text-[#0b0907]', tone)}>
            {index + 1}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[9px] font-semibold text-white/35">Libre · Ocupada · Por cobrar</p>
    </div>
  )
}

function AiVisual() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xl">📸</span>
      <span className="text-base text-[#f7c94a]">→</span>
      <div className="flex flex-1 flex-col gap-1.5">
        {[100, 80, 90].map((width, index) => (
          <span
            key={index}
            className="mk-grow-x block h-2 rounded-full bg-[linear-gradient(90deg,rgba(245,181,32,0.6),rgba(245,181,32,0.15))]"
            style={{ width: `${width}%`, transitionDelay: `${index * 140}ms` }}
          />
        ))}
        <p className="text-[9px] font-bold text-white/40">23 platos detectados ✨</p>
      </div>
    </div>
  )
}

function ArVisual() {
  return (
    <div className="relative flex h-20 items-center justify-center">
      <span className="absolute h-16 w-16 rounded-full border border-dashed border-[#f5b520]/30" />
      <span className="mk-float-a text-4xl drop-shadow-[0_8px_16px_rgba(233,154,14,0.35)]">🍛</span>
      <span className="absolute -right-1 top-1 rounded-md border border-[#f5b520]/30 bg-[#f5b520]/10 px-1.5 py-0.5 text-[8px] font-black text-[#f7c94a]">
        AR · 3D
      </span>
    </div>
  )
}

function AnalyticsVisual() {
  const bars = [38, 62, 48, 82, 68, 96] as const
  return (
    <div>
      <div className="flex h-16 items-end gap-1.5">
        {bars.map((height, index) => (
          <span
            key={index}
            className="mk-grow flex-1 rounded-t-md bg-[linear-gradient(180deg,#f5b520,rgba(204,120,9,0.35))]"
            style={{ height: `${height}%`, transitionDelay: `${index * 90}ms` }}
          />
        ))}
      </div>
      <p className="mt-2 text-[9px] font-bold text-white/40">Platos más vistos · hora pico 12:30</p>
    </div>
  )
}

function CrmVisual() {
  const customers = [
    { initials: 'MR', name: 'María R.', tag: 'VIP', tone: 'bg-[#f5b520]/15 text-[#f7c94a] border-[#f5b520]/30' },
    { initials: 'JC', name: 'José C.', tag: 'Frecuente', tone: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25' },
  ] as const
  return (
    <div className="flex flex-col gap-2">
      {customers.map((customer) => (
        <div key={customer.name} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[9px] font-black text-white">
            {customer.initials}
          </span>
          <span className="flex-1 text-[10.5px] font-bold text-white">{customer.name}</span>
          <span className={cn('rounded-full border px-2 py-0.5 text-[8.5px] font-black', customer.tone)}>{customer.tag}</span>
        </div>
      ))}
    </div>
  )
}

function InventoryVisual() {
  const stock = [
    { name: 'Arroz', level: 78, tone: 'bg-emerald-400/70' },
    { name: 'Frijoles', level: 52, tone: 'bg-[#f5b520]/80' },
    { name: 'Tortillas', level: 14, tone: 'bg-red-400/80' },
  ] as const
  return (
    <div className="flex flex-col gap-2">
      {stock.map((item, index) => (
        <div key={item.name}>
          <div className="mb-1 flex justify-between text-[9px] font-bold">
            <span className="text-white/60">{item.name}</span>
            <span className={item.level < 20 ? 'text-red-300' : 'text-white/35'}>
              {item.level < 20 ? '⚠ bajo' : `${item.level}%`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <span
              className={cn('mk-grow-x block h-full rounded-full', item.tone)}
              style={{ width: `${item.level}%`, transitionDelay: `${index * 120}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function LoyaltyVisual() {
  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: 10 }, (_, index) => (
          <span
            key={index}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full border',
              index < 7
                ? 'border-[#f5b520]/40 bg-[#f5b520]/15 text-[#f7c94a]'
                : 'border-white/10 bg-white/[0.03] text-white/15',
            )}
          >
            <Star size={11} fill={index < 7 ? 'currentColor' : 'none'} />
          </span>
        ))}
      </div>
      <p className="mt-2 text-[9px] font-bold text-white/40">7 de 10 — le falta poco para su premio 🎁</p>
    </div>
  )
}

function StaffVisual() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            key={index}
            className={cn('h-3 w-3 rounded-full', index < 4 ? 'bg-[#f5b520]' : 'border border-white/20 bg-transparent')}
          />
        ))}
      </div>
      <p className="text-[10px] font-bold text-white/45">
        Tu equipo entra solo con PIN —<br />
        sin tocar tu configuración
      </p>
    </div>
  )
}

function ReservationsVisual() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div>
        <p className="text-[11px] font-black text-white">Hoy · 20:30</p>
        <p className="text-[9.5px] font-semibold text-white/40">4 personas · terraza</p>
      </div>
      <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[9px] font-black text-emerald-300">
        Confirmada ✓
      </span>
    </div>
  )
}

function RoadmapVisual() {
  const upcoming = ['📍 Página "Ver Local"', '📶 WiFi por QR', '🌎 Menú bilingüe ES/EN'] as const
  return (
    <div className="flex flex-col gap-1.5">
      {upcoming.map((item) => (
        <span key={item} className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-3 py-1.5 text-[10.5px] font-bold text-white/55">
          {item}
        </span>
      ))}
    </div>
  )
}

// ─── Bento ────────────────────────────────────────────────────────────────────

/**
 * Vitrina de TODO lo que incluye la plataforma: cada celda es un mini-mockup
 * funcional del módulo real (pedidos, KDS, POS, CRM, inventario, lealtad…).
 * Construido con divs puros — cero imágenes, carga instantánea.
 */
export function BentoFeatures() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Cell
        className="sm:col-span-2 lg:row-span-2"
        title="Pedidos en línea, de la mesa o desde la casa"
        body="Tus clientes piden desde el menú: comer ahí, pasar a recoger o domicilio con dirección. El pedido te llega por WhatsApp y al panel en tiempo real."
        visual={<OrderFlowVisual />}
      />
      <Cell
        title="Un QR por mesa"
        body="Cada mesa tiene su código. Sabés desde dónde piden, sin apps que instalar."
        visual={<QrVisual />}
      />
      <Cell
        title="Tu carta se digitaliza sola"
        body="Subí una foto del menú de papel y la IA extrae platos, precios y categorías."
        visual={<AiVisual />}
      />
      <Cell
        title="Platos en realidad aumentada"
        body="El cliente ve el plato en 3D sobre su mesa antes de pedirlo. Eso vende."
        visual={<ArVisual />}
      />
      <Cell
        title="Analíticas que deciden por vos"
        body="Qué se vende, qué se mira y a qué hora. Menu engineering incluido."
        visual={<AnalyticsVisual />}
      />
      <Cell
        className="sm:col-span-2"
        title="Pantalla de cocina (KDS)"
        body="Los pedidos caen directo a una pantalla en cocina con su estado: nuevo, preparando, listo. Adiós comandas de papel gritadas."
        visual={<KdsVisual />}
      />
      <Cell
        title="POS comandero"
        body="Tus saloneros toman pedidos por mesa, envían a cocina y cobran la cuenta."
        visual={<PosVisual />}
      />
      <Cell
        title="Conocé a tus clientes"
        body="CRM automático: quién pide, cada cuánto y quiénes son tus VIP."
        visual={<CrmVisual />}
      />
      <Cell
        title="Inventario y food cost"
        body="Stock por ingrediente, recetas con costo real y alertas antes de quedarte sin nada."
        visual={<InventoryVisual />}
      />
      <Cell
        title="Lealtad con sellos digitales"
        body="Como la tarjetita de cartón, pero en el teléfono y sin perderse."
        visual={<LoyaltyVisual />}
      />
      <Cell
        title="Panel para tu equipo"
        body="Tus trabajadores gestionan pedidos, precios y promos con solo un PIN."
        visual={<StaffVisual />}
      />
      <Cell
        title="Reservas en línea"
        body="Tus clientes reservan desde el menú y vos confirmás desde el panel."
        visual={<ReservationsVisual />}
      />
      <Cell
        title="Y esto apenas empieza"
        body="Cada mes sumamos features — incluidas en tu plan, sin pagar más."
        visual={<RoadmapVisual />}
        soon
      />
    </div>
  )
}
