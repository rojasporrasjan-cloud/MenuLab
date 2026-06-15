import { useState } from 'react'
import {
  Wallet,
  Lock,
  Unlock,
  AlertCircle,
  ChevronRight,
  History,
  CircleDollarSign,
  Banknote,
  CreditCard,
  Smartphone,
  HelpCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Lightbulb,
  X,
} from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
// import { useAuthContext } from '@app/providers/AuthProvider'
import {
  useCurrentCashSession,
  useCashHistory,
  useOpenCashSession,
  useCloseCashSession,
} from '@features/cash'
import { sha256 } from '@shared/utils/sha256'
import { Spinner } from '@shared/ui/components/Spinner'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { currencyForLocale, currencySymbol } from '@shared/utils/currency'
import { TerminalLockButton } from '@shared/ui/components/TerminalLockButton'
import { cn } from '@shared/utils/cn'
import type { CashSession, PaymentTotals } from '@core/domain/entities/CashSession'

const DEFAULT_LOCALE = 'es-CR'
type MoneyFormatter = (amount: number) => string

const METHOD_CONFIG = [
  { key: 'cash', label: 'Efectivo', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'card', label: 'Tarjeta', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'sinpe', label: 'SINPE', icon: Smartphone, color: 'text-violet-600', bg: 'bg-violet-50' },
  { key: 'yape', label: 'Yape', icon: Smartphone, color: 'text-pink-600', bg: 'bg-pink-50' },
  { key: 'other', label: 'Otro', icon: CircleDollarSign, color: 'text-surface-600', bg: 'bg-surface-100' },
] as const



function formatTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(date)
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

function elapsedTime(from: Date): string {
  const mins = Math.floor((Date.now() - from.getTime()) / 60000)
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  const rmins = mins % 60
  return `${hrs}h ${rmins}m`
}

// ── Tips de ayuda ──────────────────────────────────────────────────────────────
const TIPS = [
  { emoji: '💡', text: 'Abre la caja al inicio de cada turno con el efectivo que tienes físicamente.' },
  { emoji: '🧮', text: 'Al cerrar, cuenta todo el efectivo real en la caja y ponlo en "Efectivo contado".' },
  { emoji: '✅', text: 'Si dice "Caja cuadrada", ¡perfecto! El efectivo coincide con lo esperado.' },
  { emoji: '⚠️', text: 'Si dice "Sobran" o "Faltan", investiga la diferencia antes del siguiente turno.' },
]

function TipsBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50/30 p-5 shadow-sm">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 rounded-full p-1 text-amber-400 transition hover:bg-amber-100 hover:text-amber-600"
      >
        <X size={14} />
      </button>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
          <HelpCircle size={16} className="text-amber-600" />
        </div>
        <h3 className="text-[13px] font-black text-amber-800">¿Cómo funciona la caja?</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {TIPS.map((tip, i) => (
          <div key={i} className="flex items-start gap-2.5 rounded-xl bg-white/60 px-3 py-2.5 backdrop-blur-sm">
            <span className="text-base leading-none mt-0.5">{tip.emoji}</span>
            <p className="text-[12px] leading-relaxed text-amber-900/80">{tip.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Desglose de cobros por método ──────────────────────────────────────────────
function TotalsBreakdown({ totals, money }: { totals: PaymentTotals; money: MoneyFormatter }) {
  return (
    <div className="flex flex-col gap-2">
      {METHOD_CONFIG.map(({ key, label, icon: Icon, color, bg }) =>
        totals[key] > 0 ? (
          <div key={key} className="flex items-center gap-3 rounded-xl bg-surface-50/80 px-3 py-2.5 transition-colors hover:bg-surface-100/80">
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', bg)}>
              <Icon size={14} className={color} />
            </div>
            <span className="flex-1 text-[13px] font-medium text-surface-600">{label}</span>
            <span className="text-[13px] font-bold tabular-nums text-surface-800">{money(totals[key])}</span>
          </div>
        ) : null,
      )}
      <div className="mt-1 flex items-center justify-between rounded-xl bg-surface-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-surface-400" />
          <span className="text-[13px] font-bold text-surface-300">Total cobrado</span>
          <span className="rounded-full bg-surface-700 px-2 py-0.5 text-[10px] font-bold text-surface-400">{totals.count} cobros</span>
        </div>
        <span className="text-[15px] font-black tabular-nums text-white">{money(totals.total)}</span>
      </div>
    </div>
  )
}

// ── Resultado del cierre (sobrante/faltante) ───────────────────────────────────
function DifferenceBadge({ difference, money }: { difference: number; money: MoneyFormatter }) {
  if (difference === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-black text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 size={12} /> Cuadrada
      </span>
    )
  }
  const isSurplus = difference > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-black ring-1',
        isSurplus ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-red-50 text-red-700 ring-red-200'
      )}
    >
      {isSurplus ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {isSurplus ? `+${money(difference)}` : `-${money(Math.abs(difference))}`}
    </span>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={cn(
      'flex flex-col rounded-2xl p-4 transition-all',
      accent
        ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20'
        : 'bg-surface-50 border border-surface-100'
    )}>
      <p className={cn('text-[10px] font-bold uppercase tracking-wider', accent ? 'text-white/60' : 'text-surface-400')}>
        {label}
      </p>
      <p className={cn('mt-1 text-xl font-black tabular-nums leading-none', accent ? 'text-white' : 'text-surface-900')}>
        {value}
      </p>
      {sub && (
        <p className={cn('mt-1 text-[11px] font-medium', accent ? 'text-white/50' : 'text-surface-400')}>
          {sub}
        </p>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function CashRegisterPage() {
  const { tenant, tenantId } = useTenantContext()

  const locale = tenant?.locale ?? DEFAULT_LOCALE
  const currency = currencyForLocale(locale)
  const sym = currencySymbol(locale, currency)
  const money: MoneyFormatter = (amount) => formatCurrency(amount, currency, locale)

  const { data: openSession, isLoading } = useCurrentCashSession(tenantId)
  const { data: history = [] } = useCashHistory(tenantId)
  const openMutation = useOpenCashSession(tenantId)
  const closeMutation = useCloseCashSession(tenantId)

  const [openingAmount, setOpeningAmount] = useState('')
  const [countedCash, setCountedCash] = useState('')
  const [closeNote, setCloseNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Verificación de Empleado
  const [verifyingAction, setVerifyingAction] = useState<'open' | 'close' | null>(null)
  const [operatorName, setOperatorName] = useState('')
  const [operatorPin, setOperatorPin] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleActionRequest = (action: 'open' | 'close') => {
    setError(null)
    if (action === 'open') {
      const amount = Number(openingAmount)
      if (!Number.isFinite(amount) || amount < 0) {
        setError('Escribe un fondo de caja válido (un número positivo).')
        return
      }
    } else {
      const counted = Number(countedCash)
      if (!Number.isFinite(counted) || counted < 0) {
        setError('Escribe el efectivo contado (un número positivo).')
        return
      }
    }
    setVerifyingAction(action)
  }

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!operatorName.trim()) {
      setError('Escribe tu nombre.')
      return
    }
    if (!operatorPin) {
      setError('Ingresa tu PIN.')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const pinHash = await sha256(operatorPin)
      if (pinHash !== tenant?.employeePinHash) {
        throw new Error('PIN incorrecto.')
      }

      const finalOperator = operatorName.trim()

      if (verifyingAction === 'open') {
        const amount = Number(openingAmount)
        await openMutation.mutateAsync({ tenantId, openingAmount: amount, openedBy: finalOperator })
        setOpeningAmount('')
      } else if (verifyingAction === 'close') {
        const counted = Number(countedCash)
        await closeMutation.mutateAsync({
          tenantId,
          closedBy: finalOperator,
          countedCash: counted,
          note: closeNote.trim() || null,
        })
        setCountedCash('')
        setCloseNote('')
      }
      
      setVerifyingAction(null)
      setOperatorName('')
      setOperatorPin('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la caja.')
    } finally {
      setIsVerifying(false)
    }
  }

  const cancelAction = () => {
    setVerifyingAction(null)
    setOperatorPin('')
    setError(null)
  }

  const closedSessions = history.filter((s) => s.status === 'closed')

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/20">
          <Wallet size={22} className="text-white" />
        </div>
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-surface-900">Caja</h1>
            <p className="text-[13px] text-surface-500">Abre tu caja con un fondo y ciérrala con el arqueo del turno.</p>
          </div>
          <TerminalLockButton modeToSet="cash" />
        </div>
        
        {/* ── Error and Verification Modals ──────────────────────────────────────────────────────── */}
      {error && !verifyingAction && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-600 ring-1 ring-red-500/20">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {verifyingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 p-4 backdrop-blur-sm">
          <form 
            onSubmit={handleConfirmAction}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100">
                <Lock size={18} className="text-surface-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-surface-900">
                  {verifyingAction === 'open' ? 'Autorizar Apertura' : 'Autorizar Arqueo'}
                </h3>
                <p className="text-[12px] text-surface-500">Ingresa tus datos para registrar la acción.</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-red-600 ring-1 ring-red-500/20">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[13px] font-medium">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[13px] font-bold text-surface-700 mb-1.5" htmlFor="operatorName">
                  Nombre de Empleado
                </label>
                <input
                  id="operatorName"
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Ej: María P."
                  autoFocus
                  className="w-full rounded-xl border-2 border-surface-200 bg-surface-50 px-4 py-3 text-sm font-bold text-surface-900 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-400/10"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-surface-700 mb-1.5" htmlFor="operatorPin">
                  PIN de Seguridad
                </label>
                <input
                  id="operatorPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={operatorPin}
                  onChange={(e) => setOperatorPin(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="••••"
                  className="w-full rounded-xl border-2 border-surface-200 bg-surface-50 px-4 py-3 text-center text-xl font-black tracking-widest text-surface-900 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-400/10"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={cancelAction}
                disabled={isVerifying}
                className="flex-1 rounded-xl bg-surface-100 py-3.5 text-sm font-bold text-surface-600 transition-colors hover:bg-surface-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isVerifying || !operatorName.trim() || operatorPin.length < 4}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-black text-white shadow-lg shadow-brand-500/20 transition-transform active:scale-95 disabled:opacity-50 disabled:shadow-none"
              >
                {isVerifying ? <Spinner size="sm" /> : <CheckCircle2 size={16} />}
                Confirmar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────────────── */}
        {openSession && (
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 ring-1 ring-emerald-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-[12px] font-black text-emerald-700">Abierta</span>
          </div>
        )}
      </header>

      {/* ── Tips de uso ──────────────────────────────────────────────────── */}
      {showTips && !openSession && <TipsBanner onDismiss={() => setShowTips(false)} />}

      {/* ── Main Content ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-[13px] font-medium text-surface-400">Cargando caja…</p>
          </div>
        </div>
      ) : openSession ? (
        <OpenSessionView
          session={openSession}
          countedCash={countedCash}
          onCountedChange={setCountedCash}
          note={closeNote}
          onNoteChange={setCloseNote}
          onClose={() => handleActionRequest('close')}
          isClosing={closeMutation.isPending || (verifyingAction === 'close')}
          money={money}
          sym={sym}
          locale={locale}
        />
      ) : (
        <OpenCashForm
          openingAmount={openingAmount}
          onAmountChange={setOpeningAmount}
          onOpen={() => handleActionRequest('open')}
          isOpening={openMutation.isPending || (verifyingAction === 'open')}
          sym={sym}
        />
      )}

      {/* ── Historial ──────────────────────────────────────────────────── */}
      {closedSessions.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <History size={14} className="text-surface-400" />
            <h2 className="text-[12px] font-black uppercase tracking-wider text-surface-400">
              Cierres anteriores
            </h2>
            <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-bold text-surface-500">
              {closedSessions.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {closedSessions.map((session) => (
              <ClosedSessionRow key={session.id} session={session} money={money} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ── Formulario para abrir caja ─────────────────────────────────────────────────
function OpenCashForm({
  openingAmount,
  onAmountChange,
  onOpen,
  isOpening,
  sym,
}: {
  openingAmount: string
  onAmountChange: (v: string) => void
  onOpen: () => void
  isOpening: boolean
  sym: string
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
      {/* Visual header */}
      <div className="bg-gradient-to-r from-surface-50 to-surface-100/50 px-6 py-5 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
            <Unlock size={18} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-[15px] font-black text-surface-800">Abrir caja</h2>
            <p className="text-[12px] text-surface-500">Ingresa el efectivo con el que inicia la caja (fondo).</p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 px-6 py-3 bg-surface-50/50 border-b border-surface-100">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[10px] font-black text-white">1</span>
          <span className="text-[11px] font-bold text-brand-600">Contar efectivo</span>
        </div>
        <ChevronRight size={12} className="text-surface-300" />
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-200 text-[10px] font-black text-surface-500">2</span>
          <span className="text-[11px] font-bold text-surface-400">Operar</span>
        </div>
        <ChevronRight size={12} className="text-surface-300" />
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-200 text-[10px] font-black text-surface-500">3</span>
          <span className="text-[11px] font-bold text-surface-400">Cerrar</span>
        </div>
      </div>

      {/* Form */}
      <div className="p-6">
        <label className="block text-[13px] font-bold text-surface-700 mb-2" htmlFor="opening">
          Fondo de caja
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-surface-400">{sym}</span>
          <input
            id="opening"
            type="text"
            inputMode="decimal"
            value={openingAmount}
            onChange={(e) => onAmountChange(e.target.value.replace(/[^\d.]/g, ''))}
            placeholder="0"
            className="w-full rounded-xl border-2 border-surface-200 bg-surface-50 pl-10 pr-4 py-3.5 text-lg font-black text-surface-900 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-400/10"
          />
        </div>
        <p className="mt-2 text-[11px] text-surface-400">
          <Lightbulb size={10} className="inline mr-1" />
          Cuenta el efectivo real que dejas en la caja antes de empezar a operar.
        </p>

        <button
          type="button"
          onClick={onOpen}
          disabled={isOpening}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-brand-500/20 transition-all hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:shadow-none"
        >
          {isOpening ? <Spinner size="sm" /> : <Unlock size={16} />}
          Abrir caja
        </button>
      </div>
    </div>
  )
}

// ── Sesión abierta ─────────────────────────────────────────────────────────────
function OpenSessionView({
  session,
  countedCash,
  onCountedChange,
  note,
  onNoteChange,
  onClose,
  isClosing,
  money,
  sym,
  locale,
}: {
  session: CashSession
  countedCash: string
  onCountedChange: (v: string) => void
  note: string
  onNoteChange: (v: string) => void
  onClose: () => void
  isClosing: boolean
  money: MoneyFormatter
  sym: string
  locale: string
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Fondo inicial"
          value={money(session.openingAmount)}
          sub={`Abierta ${formatTime(session.openedAt, locale)}`}
          accent
        />
        <StatCard
          label="Tiempo abierta"
          value={elapsedTime(session.openedAt)}
          sub={formatDate(session.openedAt, locale)}
        />
        <StatCard
          label="Abierta por"
          value={session.openedBy.split('@')[0]}
          sub="Operador activo"
        />
      </div>

      {/* Close section */}
      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-surface-800 to-surface-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <Lock size={16} className="text-white/80" />
            </div>
            <div>
              <h3 className="text-[14px] font-black text-white">Cerrar caja (Arqueo)</h3>
              <p className="text-[11px] text-white/40">Cuenta el efectivo físico y cierra el turno.</p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 px-6 py-3 bg-surface-50/50 border-b border-surface-100">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckCircle2 size={12} />
            </span>
            <span className="text-[11px] font-bold text-emerald-600">Abierta</span>
          </div>
          <ChevronRight size={12} className="text-surface-300" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Clock size={12} />
            </span>
            <span className="text-[11px] font-bold text-emerald-600">Operando</span>
          </div>
          <ChevronRight size={12} className="text-surface-300" />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[10px] font-black text-white animate-pulse">3</span>
            <span className="text-[11px] font-bold text-brand-600">Cerrar</span>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-bold text-surface-700 mb-2" htmlFor="counted">
              💰 Efectivo contado
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-surface-400">{sym}</span>
              <input
                id="counted"
                type="text"
                inputMode="decimal"
                value={countedCash}
                onChange={(e) => onCountedChange(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="0"
                className="w-full rounded-xl border-2 border-surface-200 bg-surface-50 pl-10 pr-4 py-3.5 text-lg font-black text-surface-900 outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-400/10"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-surface-400">
              <Lightbulb size={10} className="inline mr-1" />
              Cuenta todo el dinero físico que hay en la caja ahora mismo. El sistema comparará contra lo esperado.
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-surface-700 mb-2" htmlFor="close-note">
              📝 Nota del cierre <span className="font-normal text-surface-400">(opcional)</span>
            </label>
            <input
              id="close-note"
              type="text"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Ej: Turno de la mañana, sin novedad…"
              className="w-full rounded-xl border-2 border-surface-200 bg-surface-50 px-4 py-3 text-[13px] outline-none transition-colors focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-400/10"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isClosing}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-surface-800 to-surface-900 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-surface-900/20 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:shadow-none"
          >
            {isClosing ? <Spinner size="sm" /> : <Lock size={16} />}
            Cerrar caja y generar arqueo
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Row de historial ───────────────────────────────────────────────────────────
function ClosedSessionRow({ session, money, locale }: { session: CashSession; money: MoneyFormatter; locale: string }) {
  return (
    <details className="group overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition-all hover:border-surface-300 hover:shadow-md">
      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4">
        {/* Date badge */}
        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-100 text-center">
          {session.closedAt ? (
            <>
              <span className="text-[9px] font-black uppercase text-surface-500 leading-none">
                {new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(session.closedAt)}
              </span>
              <span className="text-[8px] font-bold uppercase text-surface-400 leading-none mt-0.5">
                {new Intl.DateTimeFormat(locale, { month: 'short' }).format(session.closedAt)}
              </span>
            </>
          ) : (
            <span className="text-[10px] text-surface-400">—</span>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-surface-800 truncate">
            {session.closedAt ? formatTime(session.closedAt, locale) : '—'}
            <span className="font-medium text-surface-400"> · {session.closedBy?.split('@')[0] ?? 'Caja'}</span>
          </p>
          <p className="text-[11px] text-surface-500 truncate">
            {session.totals ? `${money(session.totals.total)} en ${session.totals.count} cobros` : 'Sin cobros'}
          </p>
        </div>

        {/* Difference badge */}
        {session.difference !== null && <DifferenceBadge difference={session.difference} money={money} />}

        <ChevronRight size={14} className="shrink-0 text-surface-300 transition-transform duration-200 group-open:rotate-90" />
      </summary>

      {session.totals && (
        <div className="border-t border-surface-100 bg-surface-50/40 px-5 py-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Desglose por método */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-surface-400 mb-2.5">Desglose de cobros</p>
              <TotalsBreakdown totals={session.totals} money={money} />
            </div>

            {/* Resumen de arqueo */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-surface-400 mb-2.5">Arqueo</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 border border-surface-100">
                  <span className="text-[12px] text-surface-500">Fondo inicial</span>
                  <span className="text-[13px] font-bold tabular-nums text-surface-800">{money(session.openingAmount)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 border border-surface-100">
                  <span className="text-[12px] text-surface-500">Efectivo esperado</span>
                  <span className="text-[13px] font-bold tabular-nums text-surface-800">{money(session.expectedCash ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2.5 border border-surface-100">
                  <span className="text-[12px] text-surface-500">Efectivo contado</span>
                  <span className="text-[13px] font-bold tabular-nums text-surface-800">{money(session.countedCash ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface-800 px-3 py-2.5">
                  <span className="text-[12px] font-bold text-surface-300">Diferencia</span>
                  {session.difference !== null && <DifferenceBadge difference={session.difference} money={money} />}
                </div>
              </div>
            </div>
          </div>
          {session.note && (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5">
              <p className="text-[12px] text-amber-800"><span className="font-bold">Nota:</span> {session.note}</p>
            </div>
          )}
        </div>
      )}
    </details>
  )
}
