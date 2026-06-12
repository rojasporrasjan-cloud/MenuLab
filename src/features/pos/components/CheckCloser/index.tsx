import { useMemo, useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'

import type { Order } from '@core/domain/entities/Order'
import type { PaymentMethod } from '@core/domain/entities/Payment'
import { calculateCashChange, PAYMENT_METHOD } from '@core/domain/entities/Payment'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { COPY } from '@shared/copy/ui.copy'
import { Z } from '@shared/design-tokens'

import { PAYMENT_METHOD_LABELS } from '../../types/pos.types'

interface CheckCloserProps {
  readonly orders: readonly Order[]
  readonly isProcessing: boolean
  readonly isDone: boolean
  readonly onConfirm: (input: {
    method: PaymentMethod
    reference: string | null
    cashGiven: number | null
  }) => void
  readonly onClose: () => void
}

const DEFAULT_CURRENCY = 'CRC'

/** Modal de cierre de cuenta: total, método de pago, efectivo y vuelto. */
export function CheckCloser({ orders, isProcessing, isDone, onConfirm, onClose }: CheckCloserProps) {
  const [method, setMethod] = useState<PaymentMethod>(PAYMENT_METHOD.cash)
  const [cashGiven, setCashGiven] = useState('')
  const [reference, setReference] = useState('')

  const currency = orders[0]?.currency ?? DEFAULT_CURRENCY
  const total = useMemo(() => orders.reduce((sum, o) => sum + o.subtotal, 0), [orders])

  const isCash = method === PAYMENT_METHOD.cash
  const cashValue = Number(cashGiven) || 0
  const change = isCash ? calculateCashChange(total, cashValue) : 0
  const cashInsufficient = isCash && cashValue < total

  function handleConfirm() {
    if (cashInsufficient) return
    onConfirm({
      method,
      reference: reference.trim() || null,
      cashGiven: isCash ? cashValue : null,
    })
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      style={{ zIndex: Z.modal }}
      role="dialog"
      aria-label={COPY.pos.check.title}
    >
      <div
        className="w-full max-w-md rounded-3xl p-5"
        style={{ background: '#1a1a18', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {isDone ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 size={42} className="text-emerald-400" />
            <p className="text-lg font-black text-white">{COPY.pos.check.done}</p>
            {isCash && change > 0 && (
              <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {COPY.pos.check.change}:{' '}
                <strong className="tabular-nums text-white">
                  {formatCurrency(change, currency)}
                </strong>
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-2xl px-6 py-2.5 text-[13px] font-black transition-all active:scale-95"
              style={{ background: '#f5b520', color: '#1a1303' }}
            >
              {COPY.pos.menu.backToTables}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-black text-white">{COPY.pos.check.title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={COPY.pos.check.cancel}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            {/* Total */}
            <div
              className="mt-4 rounded-2xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <p
                className="text-[10.5px] font-black uppercase tracking-[0.18em]"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {COPY.pos.check.total}
              </p>
              <p className="mt-1 text-3xl font-black tabular-nums text-white">
                {formatCurrency(total, currency)}
              </p>
            </div>

            {/* Método */}
            <p
              className="mt-4 text-[10.5px] font-black uppercase tracking-[0.18em]"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {COPY.pos.check.method}
            </p>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {Object.values(PAYMENT_METHOD).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className="rounded-xl px-1 py-2 text-[11px] font-bold transition-colors"
                  style={
                    method === m
                      ? { background: '#f5b520', color: '#1a1303' }
                      : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)' }
                  }
                >
                  {PAYMENT_METHOD_LABELS[m]}
                </button>
              ))}
            </div>

            {/* Efectivo */}
            {isCash ? (
              <div className="mt-4">
                <label
                  className="text-[10.5px] font-black uppercase tracking-[0.18em]"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  htmlFor="check-cash"
                >
                  {COPY.pos.check.cashGiven}
                </label>
                <input
                  id="check-cash"
                  type="number"
                  min="0"
                  step="any"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-[15px] font-black tabular-nums text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
                <div className="mt-2 flex items-center justify-between text-[13px]">
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{COPY.pos.check.change}</span>
                  <span className="font-black tabular-nums text-emerald-400">
                    {formatCurrency(change, currency)}
                  </span>
                </div>
                {cashInsufficient && cashGiven !== '' && (
                  <p className="mt-1 text-[12px] font-bold text-red-400" role="alert">
                    {COPY.pos.check.insufficientCash}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <label
                  className="text-[10.5px] font-black uppercase tracking-[0.18em]"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                  htmlFor="check-reference"
                >
                  {COPY.pos.check.reference}
                </label>
                <input
                  id="check-reference"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="mt-1.5 w-full rounded-xl px-3 py-2.5 text-[13.5px] text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || cashInsufficient || (isCash && cashGiven === '')}
              className="mt-5 w-full rounded-2xl py-3 text-[14px] font-black transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: '#10b981', color: '#04130d' }}
            >
              {isProcessing ? COPY.pos.check.processing : COPY.pos.check.confirm}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
