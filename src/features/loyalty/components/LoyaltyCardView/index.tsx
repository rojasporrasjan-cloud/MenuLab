import { Gift, Stamp } from 'lucide-react'

import type { LoyaltyCard } from '@core/domain/entities/LoyaltyCard'
import { canRedeemReward } from '@core/domain/entities/LoyaltyCard'
import type { LoyaltyConfig } from '@core/domain/entities/Tenant'

import { StampGrid } from '../StampGrid'

interface LoyaltyCardViewProps {
  readonly card: LoyaltyCard
  readonly config: LoyaltyConfig
  readonly onAddStamp: () => void
  readonly onRedeem: () => void
  readonly isBusy: boolean
}

const CARD_COPY = {
  addStamp: 'Añadir sello',
  redeem: 'Canjear recompensa',
  totalStamps: 'Sellos históricos',
  rewards: 'Recompensas canjeadas',
  progress: (current: number, target: number) => `${current} / ${target} sellos`,
} as const

export function LoyaltyCardView({ card, config, onAddStamp, onRedeem, isBusy }: LoyaltyCardViewProps) {
  const redeemable = canRedeemReward(card)

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-neutral-900">{card.customerName}</h3>
          <p className="text-[13px] font-semibold tabular-nums text-neutral-500">{card.customerPhone}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-black tabular-nums"
          style={{ background: 'rgba(233,154,14,0.1)', color: '#b45309' }}
        >
          {CARD_COPY.progress(card.stamps, card.stampsForReward)}
        </span>
      </div>

      <StampGrid
        stamps={card.stamps}
        stampsForReward={card.stampsForReward}
        stampLabel={config.stampLabel}
      />

      <p className="text-center text-[12.5px] font-semibold text-neutral-500">
        🎁 {config.rewardDescription}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-neutral-50 p-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {CARD_COPY.totalStamps}
          </p>
          <p className="text-lg font-black tabular-nums text-neutral-800">{card.totalStamps}</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {CARD_COPY.rewards}
          </p>
          <p className="text-lg font-black tabular-nums text-neutral-800">{card.redeemedRewards}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isBusy || redeemable}
          onClick={onAddStamp}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-neutral-900 py-3 text-[13px] font-black text-white transition-all hover:bg-neutral-700 active:scale-95 disabled:opacity-40"
        >
          <Stamp size={14} /> {CARD_COPY.addStamp}
        </button>
        {redeemable && (
          <button
            type="button"
            disabled={isBusy}
            onClick={onRedeem}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-3 text-[13px] font-black text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #e99a0e 0%, #cc7809 100%)' }}
          >
            <Gift size={14} /> {CARD_COPY.redeem}
          </button>
        )}
      </div>
    </div>
  )
}
