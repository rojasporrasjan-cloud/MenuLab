import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, QrCode } from 'lucide-react'
import { ROUTES } from '@shared/constants/routes'
import { cn } from '@shared/utils/cn'
import {
  PathChooser,
  PricingTable,
  TemplateGalleryCard,
  Reveal,
  FoodMarquee,
  HeroPhoneShowcase,
  BentoFeatures,
  ValueStack,
} from '@features/marketing'
import { TEMPLATE_DEFINITIONS } from '@features/templates/registry'

const LANDING_TEMPLATE_PREVIEW_COUNT = 6

const previewTemplates = Object.values(TEMPLATE_DEFINITIONS).slice(
  0,
  LANDING_TEMPLATE_PREVIEW_COUNT,
)

const totalTemplates = Object.keys(TEMPLATE_DEFINITIONS).length

// ─── Barra de progreso de lectura ─────────────────────────────────────────────

function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const update = (): void => {
      const root = document.documentElement
      const progress = root.scrollTop / Math.max(root.scrollHeight - root.clientHeight, 1)
      barRef.current?.style.setProperty('transform', `scaleX(${progress})`)
    }
    const handleScroll = (): void => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px]">
      <div
        ref={barRef}
        className="h-full origin-left scale-x-0 bg-[linear-gradient(90deg,#f5b520,#cc7809)]"
      />
    </div>
  )
}

// ─── Palabra rotativa del titular ─────────────────────────────────────────────

const ROTATING_WORDS = ['soda', 'pizzería', 'cafetería', 'food truck', 'marisquería'] as const

const WORD_ROTATION_MS = 2400

function RotatingWord() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(
      () => setIndex((current) => (current + 1) % ROTATING_WORDS.length),
      WORD_ROTATION_MS,
    )
    return () => clearInterval(interval)
  }, [])

  return (
    <span key={index} className="mk-word-in mk-shimmer-text font-black">
      {ROTATING_WORDS[index]}
    </span>
  )
}

// ─── Contador animado (se dispara al entrar en pantalla) ──────────────────────

const COUNT_UP_DURATION_MS = 1300

function CountUp({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    let raf = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number): void => {
          const progress = Math.min((now - start) / COUNT_UP_DURATION_MS, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          el.textContent = `${prefix}${Math.round(to * eased)}${suffix}`
          if (progress < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.6 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, prefix, suffix])

  return <span ref={ref}>{`${prefix}0${suffix}`}</span>
}

// ─── CTA magnético (se inclina hacia el cursor) ───────────────────────────────

function MagneticLink({
  to,
  className,
  children,
}: {
  to: string
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLAnchorElement>(null)

  function handleMove(event: MouseEvent<HTMLAnchorElement>): void {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (event.clientX - rect.left - rect.width / 2) * 0.18
    const y = (event.clientY - rect.top - rect.height / 2) * 0.3
    el.style.setProperty('transform', `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`)
  }

  function handleLeave(): void {
    ref.current?.style.setProperty('transform', '')
  }

  return (
    <Link
      ref={ref}
      to={to}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn('transition-transform duration-200 ease-out will-change-transform', className)}
    >
      {children}
    </Link>
  )
}

// ─── Etiqueta de "tiempo" del menú de degustación ─────────────────────────────

function CourseLabel({ number, course, dark = false }: { number: string; course: string; dark?: boolean }) {
  return (
    <div className="mb-8 flex items-baseline gap-4">
      <span
        className={cn(
          'text-5xl font-black leading-none tracking-tight sm:text-6xl',
          dark ? 'mk-outline-text' : 'mk-outline-text-dark',
        )}
      >
        {number}
      </span>
      <span
        className={cn(
          'text-[11px] font-black uppercase tracking-[0.34em]',
          dark ? 'text-[#f7c94a]' : 'text-[#cc7809]',
        )}
      >
        {course}
      </span>
      <span className={cn('h-px flex-1 self-center', dark ? 'bg-white/10' : 'bg-[#e8e5e0]')} />
    </div>
  )
}

// ─── Stats del hero ───────────────────────────────────────────────────────────

interface HeroStat {
  readonly render: () => ReactNode
  readonly label: string
}

const HERO_STATS: readonly HeroStat[] = [
  { render: () => <CountUp to={totalTemplates} />, label: 'plantillas pro' },
  { render: () => '5 min', label: 'para publicar' },
  { render: () => <CountUp to={32} prefix="+" suffix="%" />, label: 'más pedidos' },
  { render: () => '24/7', label: 'nunca cierra' },
] as const

// ─── Página ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null)
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  /** Parallax de cursor: publica --mx/--my (-1..1) y la posición del spotlight. */
  function handleHeroMouseMove(event: MouseEvent<HTMLElement>): void {
    const el = heroRef.current
    if (!el || reducedMotionRef.current) return
    const rect = el.getBoundingClientRect()
    const mx = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const my = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    el.style.setProperty('--mx', mx.toFixed(3))
    el.style.setProperty('--my', my.toFixed(3))
    el.style.setProperty('--spot-x', `${Math.round(event.clientX - rect.left)}px`)
    el.style.setProperty('--spot-y', `${Math.round(event.clientY - rect.top)}px`)
  }

  return (
    <>
      <ScrollProgress />

      {/* ── Hero: la carta de papel murió ────────────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="mk-grain relative overflow-hidden bg-[#0b0907]"
      >
        {/* Auroras + grid + spotlight que sigue al cursor */}
        <div className="pointer-events-none absolute inset-0 select-none">
          <div className="mk-aurora absolute -left-40 top-[-160px] h-[520px] w-[520px] rounded-full bg-[#e99a0e]/20 blur-[130px]" />
          <div
            className="mk-aurora absolute right-[-140px] top-1/4 h-[440px] w-[440px] rounded-full bg-[#cf4e0c]/15 blur-[120px]"
            style={{ animationDuration: '24s', animationDelay: '3s' }}
          />
          <div className="mk-grid absolute inset-0" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(560px circle at var(--spot-x, 60%) var(--spot-y, 35%), rgba(245,181,32,0.09), transparent 65%)',
            }}
          />
        </div>

        {/* Comida flotante en capas de profundidad (parallax de cursor) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden select-none md:block">
          <span
            className="absolute left-[4%] top-[20%]"
            style={{ transform: 'translate3d(calc(var(--mx, 0) * 30px), calc(var(--my, 0) * 22px), 0)' }}
          >
            <span className="mk-float-a block text-4xl opacity-60">🌮</span>
          </span>
          <span
            className="absolute left-[14%] bottom-[12%]"
            style={{ transform: 'translate3d(calc(var(--mx, 0) * 12px), calc(var(--my, 0) * 9px), 0)' }}
          >
            <span className="mk-float-b block text-3xl opacity-35 blur-[1.5px]">🍕</span>
          </span>
          <span
            className="absolute right-[5%] top-[14%]"
            style={{ transform: 'translate3d(calc(var(--mx, 0) * -18px), calc(var(--my, 0) * 14px), 0)' }}
          >
            <span className="mk-float-c block text-3xl opacity-45 blur-[1px]">☕</span>
          </span>
          <span
            className="absolute left-[44%] top-[7%]"
            style={{ transform: 'translate3d(calc(var(--mx, 0) * 8px), calc(var(--my, 0) * 6px), 0)' }}
          >
            <span className="mk-float-b block text-2xl opacity-25 blur-[2px]">🍣</span>
          </span>
        </div>

        <div className="relative z-[2] mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-6 lg:pb-24 lg:pt-20">
          {/* Columna editorial */}
          <div className="text-center lg:text-left">
            <p className="text-[11px] font-black uppercase tracking-[0.34em] text-white/40">
              Menús digitales para restaurantes · LATAM
            </p>

            <h1 className="mt-6 font-black leading-[0.95] tracking-tight">
              <span className="block text-4xl text-white sm:text-6xl">
                La carta <span className="mk-strike">de papel</span>
              </span>
              <span className="mk-outline-text mt-1 block text-6xl sm:text-8xl lg:text-[7rem]">
                murió.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-xl text-xl font-bold text-white sm:text-2xl lg:mx-0">
              Larga vida al menú de tu <RotatingWord />
            </p>

            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/50 lg:mx-0">
              QR por mesa, pedidos por WhatsApp, platos en realidad aumentada y una IA
              que digitaliza tu carta con una foto. El de papel no hacía nada de eso.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <MagneticLink
                to={ROUTES.auth.register}
                className="mk-glow-cta inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#f5b520_0%,#cc7809_100%)] px-8 py-4 text-base font-black text-[#1a1206] sm:w-auto"
              >
                Crear mi menú gratis
                <ArrowRight size={17} strokeWidth={2.6} />
              </MagneticLink>
              <a
                href="#degustacion"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/[0.1] sm:w-auto"
              >
                Ver la degustación
                <ArrowDown size={16} />
              </a>
            </div>

            <p className="mt-5 text-xs font-medium text-white/35">
              Sin tarjeta · Gratis para empezar · Hecho para LATAM 🇨🇷
            </p>

            {/* Stats con contadores */}
            <div className="mt-12 grid grid-cols-4 gap-2 border-t border-white/[0.07] pt-7">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <p className="text-xl font-black text-[#f7c94a] sm:text-2xl">{stat.render()}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/35 sm:text-[11px]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Demo interactivo */}
          <HeroPhoneShowcase />
        </div>
      </section>

      {/* ── Marquee reactivo al scroll ───────────────────────────────────── */}
      <FoodMarquee />

      {/* ── 01 · La entrada ──────────────────────────────────────────────── */}
      <section id="degustacion" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <Reveal>
          <CourseLabel number="01" course="La entrada" />
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight text-[#17150f] sm:text-4xl">
              Crea tu menú como prefieras
            </h2>
            <p className="mt-4 text-lg text-[#57544f]">
              Desde cero, con una plantilla o déjanos hacerlo por ti. Tú decides.
            </p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <PathChooser />
        </Reveal>
      </section>

      {/* ── 02 · El plato fuerte: TODO lo que incluye ────────────────────── */}
      <section className="mk-grain relative overflow-hidden bg-[#0b0907] py-24">
        <div className="pointer-events-none absolute inset-0 select-none">
          <div className="mk-aurora absolute left-[-10%] top-[-20%] h-[420px] w-[420px] rounded-full bg-[#e99a0e]/10 blur-[130px]" />
          <div
            className="mk-aurora absolute bottom-[-25%] right-[-10%] h-[400px] w-[400px] rounded-full bg-[#cf4e0c]/10 blur-[130px]"
            style={{ animationDuration: '26s', animationDelay: '5s' }}
          />
        </div>
        <div className="relative z-[2] mx-auto max-w-6xl px-5">
          <Reveal>
            <CourseLabel number="02" course="El plato fuerte" dark />
            <div className="mb-4 max-w-3xl">
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
                Un menú que toma pedidos,{' '}
                <span className="mk-shimmer-text">cobra, cocina y aprende</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-white/50">
                No es una carta bonita en PDF. Es el <strong className="text-white/80">sistema operativo completo</strong> de
                tu restaurante: cada módulo de aquí abajo normalmente se paga por separado.
                Aquí vienen todos juntos — y se hablan entre sí.
              </p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-10">
              <BentoFeatures />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 03 · Para compartir ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <CourseLabel number="03" course="Para compartir" />
          <div className="mb-12 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black tracking-tight text-[#17150f] sm:text-4xl">
                Un diseño para cada cocina
              </h2>
              <p className="mt-4 text-lg text-[#57544f]">
                {totalTemplates} estilos listos para usar — de sodas ticas a fine dining.
              </p>
            </div>
            <Link
              to={ROUTES.marketing.templates}
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[#e8e5e0] bg-white px-6 py-3.5 text-sm font-bold text-[#17150f] shadow-sm transition-all hover:border-[#f5b520] hover:shadow-md"
            >
              Ver las {totalTemplates}
              <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {previewTemplates.map((template, index) => (
            <Reveal key={template.id} delay={(index % 3) * 100}>
              <TemplateGalleryCard template={template} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 04 · La cuenta: el golpe del precio ──────────────────────────── */}
      <section id="precios" className="bg-[#faf9f7] py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <CourseLabel number="04" course="La cuenta" />
            <div className="mb-12 max-w-3xl">
              <h2 className="text-3xl font-black tracking-tight text-[#17150f] sm:text-5xl">
                Todo el sistema, por menos que{' '}
                <span className="bg-[linear-gradient(135deg,#e99a0e,#cc7809)] bg-clip-text text-transparent">
                  un café al día
                </span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#57544f]">
                Hacé la cuenta vos mismo: esto es lo que cuesta armar lo mismo
                con sistemas separados — y lo que cuesta aquí.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <ValueStack />
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-16">
              <p className="mb-8 text-center text-[11px] font-black uppercase tracking-[0.3em] text-[#cc7809]">
                Elegí tu plan
              </p>
              <PricingTable />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 05 · El postre ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <CourseLabel number="05" course="El postre" />
          <div className="mk-grain relative overflow-hidden rounded-[2.5rem] bg-[#0b0907] px-8 py-20 text-center shadow-[0_40px_90px_rgba(0,0,0,0.35)]">
            <div className="pointer-events-none absolute inset-0 select-none">
              <div className="mk-aurora absolute right-[-10%] top-[-40%] h-[380px] w-[380px] rounded-full bg-[#e99a0e]/25 blur-[110px]" />
              <div
                className="mk-aurora absolute bottom-[-50%] left-[-5%] h-[360px] w-[360px] rounded-full bg-[#cf4e0c]/20 blur-[120px]"
                style={{ animationDuration: '22s', animationDelay: '4s' }}
              />
              <div className="mk-grid absolute inset-0" />
            </div>

            <span className="relative z-[2] inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f5b520]/25 bg-[#f5b520]/10 text-[#f7c94a]">
              <QrCode size={26} />
            </span>

            <h2 className="relative z-[2] mx-auto mt-6 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-5xl">
              Tu menú del futuro está a{' '}
              <span className="mk-shimmer-text">un escaneo</span>
            </h2>
            <p className="relative z-[2] mx-auto mt-4 max-w-xl text-lg text-white/55">
              Créalo gratis en minutos. Sin instalaciones, sin complicaciones.
            </p>

            <div className="relative z-[2] mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <MagneticLink
                to={ROUTES.auth.register}
                className="mk-glow-cta inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#f5b520_0%,#cc7809_100%)] px-8 py-4 text-base font-black text-[#1a1206] sm:w-auto"
              >
                Crear mi menú gratis
                <ArrowRight size={17} strokeWidth={2.6} />
              </MagneticLink>
              <Link
                to={ROUTES.marketing.quote}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/[0.1] sm:w-auto"
              >
                Prefiero que lo hagan por mí
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
