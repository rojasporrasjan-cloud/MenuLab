import { Gift, Stamp, Crown } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'

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
  const { tenant } = useTenantContext()
  const redeemable = canRedeemReward(card)

  const cardColor = config.cardColor || '#171717'
  const textColor = config.cardTextColor || 'light'
  const style = config.cardStyle || 'gradient'

  const isDark = textColor === 'dark'
  const textClass = isDark ? 'text-neutral-900' : 'text-white'
  const textMutedClass = isDark ? 'text-neutral-600' : 'text-white/70'

  const getBackgroundStyle = () => {
    switch (style) {
      case 'solid':
        return { background: cardColor }
      case 'glass':
        return { 
          background: `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)`, 
          backgroundColor: cardColor, // as base
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)',
        }
      case 'gradient':
      default:
        // Simulate a slight metallic/premium gradient using the base color
        return {
          background: `linear-gradient(135deg, ${cardColor} 0%, rgba(0,0,0,0.8) 100%)`,
          backgroundColor: cardColor,
        }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* TARJETA VISUAL */}
      <div 
        className="relative overflow-hidden rounded-[1.5rem] p-6 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1"
        style={{
          ...getBackgroundStyle(),
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
        }}
      >
        {/* Glow overlay */}
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Header Tarjeta */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              {tenant?.branding.logoUrl ? (
                <img src={tenant.branding.logoUrl} alt="Logo" className="h-10 w-10 rounded-full object-cover shadow-sm bg-white/20 p-0.5" />
              ) : (
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDark ? 'bg-black/10' : 'bg-white/20'}`}>
                  <Crown size={20} className={textClass} />
                </div>
              )}
              <div className="flex flex-col">
                <h3 className={`truncate text-lg font-black tracking-tight ${textClass}`}>{card.customerName}</h3>
                <p className={`text-[12px] font-bold tabular-nums tracking-widest uppercase opacity-80 ${textMutedClass}`}>{card.customerPhone}</p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black tabular-nums shadow-sm border ${
                isDark ? 'bg-black/10 border-black/10 text-black' : 'bg-white/20 border-white/20 text-white'
              }`}
            >
              {CARD_COPY.progress(card.stamps, card.stampsForReward)}
            </span>
          </div>

          <StampGrid
            stamps={card.stamps}
            stampsForReward={card.stampsForReward}
            stampLabel={config.stampLabel}
            textColor={textColor}
          />

          <p className={`text-center text-[12px] font-bold uppercase tracking-widest opacity-90 ${textClass}`}>
            🎁 {config.rewardDescription}
          </p>
        </div>
      </div>

      {/* Acciones y Stats (Fuera de la tarjeta) */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="rounded-2xl bg-neutral-50 p-4 text-center border border-black/[0.04]">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            {CARD_COPY.totalStamps}
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-neutral-800">{card.totalStamps}</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4 text-center border border-black/[0.04]">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            {CARD_COPY.rewards}
          </p>
          <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-neutral-800">{card.redeemedRewards}</p>
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
