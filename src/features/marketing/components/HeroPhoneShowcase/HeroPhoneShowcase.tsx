import { useRef, useState } from 'react'
import { Check, Plus, ShoppingBag, Wifi } from 'lucide-react'

import { cn } from '@shared/utils/cn'

const DEMO_CATEGORIES = ['Casados', 'Bocas', 'Bebidas'] as const

type DemoCategory = (typeof DEMO_CATEGORIES)[number]

interface DemoDish {
  readonly emoji: string
  readonly name: string
  readonly detail: string
  readonly price: number
}

/** Carta demo del teléfono — comida tica real, precios creíbles. */
const DEMO_MENU: Record<DemoCategory, readonly DemoDish[]> = {
  Casados: [
    { emoji: '🍛', name: 'Casado de pollo', detail: 'Con picadillo del día', price: 3800 },
    { emoji: '🥩', name: 'Casado de res', detail: 'En salsa criolla', price: 4200 },
    { emoji: '🐟', name: 'Casado de pescado', detail: 'Empanizado al momento', price: 4500 },
  ],
  Bocas: [
    { emoji: '🍚', name: 'Chifrijo', detail: 'Con pico de gallo', price: 3500 },
    { emoji: '🍌', name: 'Patacones', detail: 'Frijoles molidos y queso', price: 2800 },
    { emoji: '🥟', name: 'Empanada arreglada', detail: 'Repollo aliñado', price: 1500 },
  ],
  Bebidas: [
    { emoji: '🥤', name: 'Fresco de cas', detail: 'Natural del día', price: 1200 },
    { emoji: '☕', name: 'Café chorreado', detail: 'De Naranjo, claro', price: 1100 },
    { emoji: '🥭', name: 'Batido de mango', detail: 'En agua o leche', price: 1800 },
  ],
}

interface ToastState {
  readonly id: number
  readonly dishName: string
}

function formatColones(amount: number): string {
  return `₡${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

/**
 * Demo VIVO del producto en el hero: el visitante cambia categorías y agrega
 * platos — el carrito suma con rebote y aparece un toast, como en el menú real.
 * El tilt 3D lo manejan las CSS vars --mx/--my que setea el hero con el mouse.
 */
export function HeroPhoneShowcase() {
  const [activeCategory, setActiveCategory] = useState<DemoCategory>('Casados')
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [toast, setToast] = useState<ToastState | null>(null)
  const toastIdRef = useRef(0)

  function handleAdd(dish: DemoDish): void {
    toastIdRef.current += 1
    setCartCount((count) => count + 1)
    setCartTotal((total) => total + dish.price)
    setToast({ id: toastIdRef.current, dishName: dish.name })
  }

  return (
    <div className="relative mx-auto w-full max-w-[440px] select-none py-10">
      {/* Resplandor + anillos orbitales (decorativo) */}
      <div aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e99a0e]/20 blur-[110px]" />
        <div className="mk-spin-slow absolute left-1/2 top-1/2 h-[480px] w-[480px] rounded-full border border-dashed border-[#f5b520]/20" />
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05]" />
      </div>

      {/* Hint: esto se toca */}
      <p className="absolute left-1/2 top-0 z-30 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.3em] text-[#f7c94a]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f7c94a]" />
        Probalo · es real
      </p>

      {/* Badges flotantes con parallax de mouse (decorativo) */}
      <div aria-hidden="true">
        <div
          className="absolute -left-2 top-8 z-20 sm:-left-8"
          style={{ transform: 'translate3d(calc(var(--mx, 0) * 22px), calc(var(--my, 0) * 16px), 0)' }}
        >
          <div className="mk-float-a flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.07] px-3.5 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <span className="text-xl">📲</span>
            <div>
              <p className="text-[11px] font-black text-white">QR escaneado</p>
              <p className="text-[10px] font-semibold text-white/50">Mesa 4 · ahora</p>
            </div>
          </div>
        </div>

        <div
          className="absolute -right-2 top-24 z-20 sm:-right-10"
          style={{ transform: 'translate3d(calc(var(--mx, 0) * -16px), calc(var(--my, 0) * 12px), 0)' }}
        >
          <div className="mk-float-b flex items-center gap-2.5 rounded-2xl border border-[#f5b520]/25 bg-[#f5b520]/10 px-3.5 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <span className="text-xl">🥽</span>
            <div>
              <p className="text-[11px] font-black text-[#f7c94a]">Ver plato en AR</p>
              <p className="text-[10px] font-semibold text-white/50">3D sobre tu mesa</p>
            </div>
          </div>
        </div>

        <div
          className="absolute -left-3 bottom-28 z-20 sm:-left-12"
          style={{ transform: 'translate3d(calc(var(--mx, 0) * 18px), calc(var(--my, 0) * -14px), 0)' }}
        >
          <div className="mk-float-c flex items-center gap-2.5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <span className="text-xl">🛵</span>
            <div>
              <p className="text-[11px] font-black text-emerald-300">Pedido #128</p>
              <p className="text-[10px] font-semibold text-white/50">En camino · WhatsApp</p>
            </div>
          </div>
        </div>

        <div
          className="absolute -right-1 bottom-10 z-20 sm:-right-6"
          style={{ transform: 'translate3d(calc(var(--mx, 0) * -24px), calc(var(--my, 0) * -10px), 0)' }}
        >
          <div className="mk-float-b flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.07] px-3.5 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <span className="text-xl">📈</span>
            <div>
              <p className="text-[11px] font-black text-white">+32% en ventas</p>
              <p className="text-[10px] font-semibold text-white/50">Analíticas en vivo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Teléfono — tilt 3D que sigue al cursor (vars del hero) */}
      <div className="relative z-10">
        <div
          className="mx-auto w-[272px] will-change-transform"
          style={{
            transform:
              'perspective(1400px) rotateY(calc(var(--mx, 0) * 9deg)) rotateX(calc(var(--my, 0) * -7deg))',
          }}
        >
          <div className="relative overflow-hidden rounded-[2.6rem] border-[6px] border-[#262019] bg-[#12100c] shadow-[0_50px_100px_rgba(0,0,0,0.7),0_0_0_1px_rgba(245,181,32,0.12)]">
            {/* Notch */}
            <div className="absolute left-1/2 top-2.5 z-30 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />

            {/* Pantalla */}
            <div className="relative bg-[linear-gradient(170deg,#1b150d_0%,#0f0c08_60%)] px-4 pb-5 pt-11">
              {/* Status bar */}
              <div className="mb-4 flex items-center justify-between px-1 text-[9px] font-bold text-white/40">
                <span>12:04</span>
                <Wifi size={10} />
              </div>

              {/* Header del menú demo */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f5b520,#cc7809)] text-base shadow-[0_4px_14px_rgba(233,154,14,0.4)]">
                    🍽
                  </span>
                  <div>
                    <p className="text-[12.5px] font-black leading-tight text-white">Soda La Rústica</p>
                    <p className="text-[9.5px] font-semibold text-white/40">Sarchí · Costa Rica</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wide text-emerald-300">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                  Abierto
                </span>
              </div>

              {/* Categorías — interactivas */}
              <div className="mb-3.5 flex gap-1.5">
                {DEMO_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-[9.5px] transition-all duration-200',
                      category === activeCategory
                        ? 'bg-[linear-gradient(135deg,#f5b520,#cc7809)] font-black text-[#1a1206] shadow-[0_4px_12px_rgba(233,154,14,0.35)]'
                        : 'border border-white/10 bg-white/[0.04] font-bold text-white/45 hover:bg-white/[0.09] hover:text-white/70',
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Platos — el + agrega de verdad */}
              <div key={activeCategory} className="animate-fade-in flex flex-col gap-2">
                {DEMO_MENU[activeCategory].map((dish) => (
                  <div
                    key={dish.name}
                    className="flex items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-2.5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(245,181,32,0.18),rgba(245,181,32,0.05))] text-xl">
                      {dish.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-extrabold text-white">{dish.name}</p>
                      <p className="truncate text-[9px] font-medium text-white/40">{dish.detail}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10.5px] font-black text-[#f7c94a]">
                        {formatColones(dish.price)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Agregar ${dish.name}`}
                        onClick={() => handleAdd(dish)}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f5b520] text-[#1a1206] transition-transform hover:scale-110 active:scale-75"
                      >
                        <Plus size={11} strokeWidth={3.2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Toast "agregado" */}
              {toast && (
                <div
                  key={toast.id}
                  className="mk-toast pointer-events-none absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-400/30 bg-[#0d2218]/95 px-3.5 py-2 text-[10px] font-black text-emerald-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm"
                >
                  <Check size={11} strokeWidth={3.5} />
                  {toast.dishName} agregado
                </div>
              )}

              {/* Barra de carrito — suma en vivo con rebote */}
              <div
                key={cartCount}
                className={cn(
                  'mt-3.5 flex items-center justify-between rounded-2xl px-4 py-2.5 transition-colors',
                  cartCount > 0
                    ? 'mk-pop bg-[linear-gradient(135deg,#f5b520,#cc7809)] shadow-[0_8px_24px_rgba(233,154,14,0.35)]'
                    : 'border border-dashed border-white/15 bg-white/[0.03]',
                )}
              >
                {cartCount > 0 ? (
                  <>
                    <span className="flex items-center gap-1.5 text-[10.5px] font-black text-[#1a1206]">
                      <ShoppingBag size={12} strokeWidth={2.8} />
                      Ver pedido
                    </span>
                    <span className="text-[10.5px] font-black text-[#1a1206]">
                      {cartCount} · {formatColones(cartTotal)}
                    </span>
                  </>
                ) : (
                  <span className="mx-auto text-[10px] font-bold text-white/35">
                    Tocá un + para probar el carrito
                  </span>
                )}
              </div>

              {/* Línea de escaneo */}
              <div
                aria-hidden="true"
                className="mk-scanline pointer-events-none absolute left-0 z-20 h-20 w-full bg-[linear-gradient(180deg,transparent,rgba(245,181,32,0.14),transparent)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
