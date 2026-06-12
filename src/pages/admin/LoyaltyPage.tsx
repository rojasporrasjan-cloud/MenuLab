import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Settings2, Star, UserPlus } from 'lucide-react'

import { useTenantContext } from '@app/providers/TenantProvider'
import {
  useLoyaltyCard,
  useAddStamp,
  useRedeemReward,
  useCreateLoyaltyCard,
  useLoyaltyStats,
  LoyaltyCardView,
  LoyaltyScanner,
  LoyaltyService,
} from '@features/loyalty'
import { UpgradeGate } from '@features/billing'
import type { LoyaltyConfig } from '@core/domain/entities/Tenant'
import { DEFAULT_LOYALTY_CONFIG } from '@core/domain/entities/Tenant'
import { normalizeLoyaltyPhone } from '@core/domain/entities/LoyaltyCard'
import { COPY } from '@shared/copy/ui.copy'

const PAGE_COPY = {
  searchHint: 'Busca por teléfono para sellar o canjear.',
  notFound: 'No existe una tarjeta con ese teléfono.',
  createTitle: 'Crear tarjeta nueva',
  namePlaceholder: 'Nombre del cliente',
  create: 'Crear tarjeta',
  creating: 'Creando…',
  config: {
    title: 'Configuración del programa',
    stampsForReward: 'Sellos por recompensa',
    rewardDescription: 'Descripción de la recompensa',
    stampLabel: 'Emoji del sello',
    save: 'Guardar configuración',
    saving: 'Guardando…',
    saved: 'Configuración guardada',
  },
  stats: {
    totalCards: 'Tarjetas',
    newThisMonth: 'Nuevas este mes',
    activeThisMonth: 'Activas este mes',
    rewards: 'Recompensas dadas',
  },
} as const

// ─── Config section ───────────────────────────────────────────────────────────

function LoyaltyConfigSection({ tenantId, config }: { tenantId: string; config: LoyaltyConfig }) {
  const queryClient = useQueryClient()
  const [stampsForReward, setStampsForReward] = useState(config.stampsForReward)
  const [rewardDescription, setRewardDescription] = useState(config.rewardDescription)
  const [stampLabel, setStampLabel] = useState(config.stampLabel)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSave(): Promise<void> {
    setIsSaving(true)
    setMessage(null)
    try {
      await LoyaltyService.updateConfig(tenantId, {
        stampsForReward: Math.max(1, stampsForReward),
        rewardDescription: rewardDescription.trim() || DEFAULT_LOYALTY_CONFIG.rewardDescription,
        stampLabel: stampLabel.trim() || DEFAULT_LOYALTY_CONFIG.stampLabel,
      })
      await queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] })
      setMessage(PAGE_COPY.config.saved)
    } catch {
      setMessage(COPY.errors.generic)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm">
      <h3 className="inline-flex items-center gap-2 text-[13px] font-black text-neutral-800">
        <Settings2 size={14} /> {PAGE_COPY.config.title}
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {PAGE_COPY.config.stampsForReward}
          </span>
          <input
            type="number"
            min={1}
            max={30}
            value={stampsForReward}
            onChange={(e) => setStampsForReward(Number(e.target.value))}
            className="rounded-xl border border-black/[0.08] px-3 py-2.5 text-sm font-semibold text-neutral-800 outline-none focus:border-neutral-400"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {PAGE_COPY.config.rewardDescription}
          </span>
          <input
            type="text"
            value={rewardDescription}
            onChange={(e) => setRewardDescription(e.target.value)}
            className="rounded-xl border border-black/[0.08] px-3 py-2.5 text-sm font-semibold text-neutral-800 outline-none focus:border-neutral-400"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {PAGE_COPY.config.stampLabel}
          </span>
          <input
            type="text"
            value={stampLabel}
            maxLength={4}
            onChange={(e) => setStampLabel(e.target.value)}
            className="rounded-xl border border-black/[0.08] px-3 py-2.5 text-sm font-semibold text-neutral-800 outline-none focus:border-neutral-400"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-[12.5px] font-black text-white transition-all hover:bg-neutral-700 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? PAGE_COPY.config.saving : PAGE_COPY.config.save}
        </button>
        {message && <p className="text-[12px] font-semibold text-neutral-500">{message}</p>}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  return (
    <UpgradeGate feature="loyalty">
      <LoyaltyPageContent />
    </UpgradeGate>
  )
}

function LoyaltyPageContent() {
  const { tenant, tenantId } = useTenantContext()
  const config = tenant?.loyaltyConfig ?? DEFAULT_LOYALTY_CONFIG

  const [searchedPhone, setSearchedPhone] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('')

  const { data: card, isLoading: isSearching, isFetched } = useLoyaltyCard(tenantId, searchedPhone)
  const { data: stats } = useLoyaltyStats(tenantId)
  const addStamp = useAddStamp()
  const redeemReward = useRedeemReward()
  const createCard = useCreateLoyaltyCard()

  const isBusy = addStamp.isPending || redeemReward.isPending
  const showNotFound = isFetched && !isSearching && !card && Boolean(searchedPhone)

  async function handleCreate(): Promise<void> {
    if (!newCustomerName.trim() || !searchedPhone) return
    await createCard.mutateAsync({
      tenantId,
      customerPhone: normalizeLoyaltyPhone(searchedPhone),
      customerName: newCustomerName,
      stampsForReward: config.stampsForReward,
    })
    setNewCustomerName('')
  }

  const statCards = [
    { label: PAGE_COPY.stats.totalCards, value: stats?.totalCards ?? 0 },
    { label: PAGE_COPY.stats.newThisMonth, value: stats?.newThisMonth ?? 0 },
    { label: PAGE_COPY.stats.activeThisMonth, value: stats?.activeThisMonth ?? 0 },
    { label: PAGE_COPY.stats.rewards, value: stats?.totalRewardsRedeemed ?? 0 },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Stats del mes */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{s.label}</p>
            <p className="mt-1 text-xl font-black tabular-nums text-neutral-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div className="flex flex-col gap-2">
        <LoyaltyScanner onSearch={setSearchedPhone} isSearching={isSearching} />
        {!searchedPhone && (
          <p className="text-[12px] text-neutral-400">{PAGE_COPY.searchHint}</p>
        )}
      </div>

      {/* Resultado */}
      {card && (
        <LoyaltyCardView
          card={card}
          config={config}
          onAddStamp={() => addStamp.mutate(card)}
          onRedeem={() => redeemReward.mutate(card)}
          isBusy={isBusy}
        />
      )}

      {showNotFound && (
        <div className="flex flex-col gap-4 rounded-3xl border border-dashed border-black/[0.12] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <Star size={20} className="text-neutral-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-600">{PAGE_COPY.notFound}</p>
            <p className="mt-0.5 text-[12px] text-neutral-400">{PAGE_COPY.createTitle}</p>
          </div>
          <div className="mx-auto flex w-full max-w-sm items-center gap-2">
            <input
              type="text"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder={PAGE_COPY.namePlaceholder}
              className="min-w-0 flex-1 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-sm text-neutral-800 outline-none focus:border-neutral-400"
            />
            <button
              type="button"
              disabled={createCard.isPending || !newCustomerName.trim()}
              onClick={() => void handleCreate()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-[12.5px] font-black text-white transition-all hover:bg-neutral-700 active:scale-95 disabled:opacity-40"
            >
              <UserPlus size={13} />
              {createCard.isPending ? PAGE_COPY.creating : PAGE_COPY.create}
            </button>
          </div>
        </div>
      )}

      {/* Configuración */}
      <LoyaltyConfigSection tenantId={tenantId} config={config} />
    </div>
  )
}
