import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Settings2, Star, UserPlus, Info, Gift, Award, TrendingUp, Search, Users } from 'lucide-react'
import { PageHeader } from '@shared/ui/components/PageHeader'

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

// ─── Header Info ──────────────────────────────────────────────────────────────
function LoyaltyHeader() {
  return (
    <div className="mb-6">
      <PageHeader
        eyebrow="Clientes"
        title="Lealtad"
        subtitle="Recompensa a tus mejores clientes: agrega sellos y canjea premios."
      />
    </div>
  )
}

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
    <div className="flex flex-col gap-5 rounded-3xl border border-black/[0.04] bg-white p-6 shadow-md mt-4">
      <div className="flex items-center gap-3 border-b border-black/[0.04] pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
          <Settings2 size={20} />
        </div>
        <div>
          <h3 className="text-[16px] font-black text-neutral-900">
            {PAGE_COPY.config.title}
          </h3>
          <p className="text-[13px] font-medium text-neutral-500">Ajusta las reglas de tu programa de recompensas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
        <label className="flex flex-col gap-2">
          <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Award size={14} /> {PAGE_COPY.config.stampsForReward}
          </span>
          <input
            type="number"
            min={1}
            max={30}
            value={stampsForReward}
            onChange={(e) => setStampsForReward(Number(e.target.value))}
            className="rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-bold text-neutral-900 outline-none transition-colors focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Gift size={14} /> {PAGE_COPY.config.rewardDescription}
          </span>
          <input
            type="text"
            value={rewardDescription}
            onChange={(e) => setRewardDescription(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-bold text-neutral-900 outline-none transition-colors focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Star size={14} /> {PAGE_COPY.config.stampLabel}
          </span>
          <input
            type="text"
            value={stampLabel}
            maxLength={4}
            onChange={(e) => setStampLabel(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-bold text-neutral-900 outline-none transition-colors focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100"
          />
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 mt-2">
        {message && <p className="text-[13px] font-bold text-emerald-600 mr-2">{message}</p>}
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className="rounded-xl bg-neutral-900 px-6 py-2.5 text-[13px] font-black text-white shadow-md shadow-neutral-900/10 transition-all hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isSaving ? PAGE_COPY.config.saving : PAGE_COPY.config.save}
        </button>
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
    { label: PAGE_COPY.stats.totalCards, value: stats?.totalCards ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: PAGE_COPY.stats.newThisMonth, value: stats?.newThisMonth ?? 0, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: PAGE_COPY.stats.activeThisMonth, value: stats?.activeThisMonth ?? 0, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: PAGE_COPY.stats.rewards, value: stats?.totalRewardsRedeemed ?? 0, icon: Gift, color: 'text-purple-500', bg: 'bg-purple-50' },
  ]

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <LoyaltyHeader />

      <div className="flex flex-col gap-6">
        {/* Stats del mes */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-black/[0.04] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{s.label}</p>
                  <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-neutral-900">{s.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.bg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <s.icon size={22} className={s.color} />
                </div>
              </div>
              <div className="absolute -right-6 -top-6 z-0 h-24 w-24 rounded-full bg-gradient-to-br from-black/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>

        {/* Buscador y Resultado */}
        <div className="flex flex-col lg:flex-row gap-6 items-start mt-2">
          
          <div className="w-full lg:w-1/3 flex flex-col gap-3">
            <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Search size={64} />
              </div>
              <h3 className="text-[16px] font-black text-neutral-900 mb-4 relative z-10">Escanear Tarjeta</h3>
              <div className="relative z-10">
                <LoyaltyScanner onSearch={setSearchedPhone} isSearching={isSearching} />
              </div>
              {!searchedPhone && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-neutral-50 p-3 relative z-10 border border-neutral-100">
                  <Info size={16} className="shrink-0 mt-0.5 text-neutral-400" />
                  <p className="text-[12.5px] font-medium text-neutral-500 leading-relaxed">{PAGE_COPY.searchHint}</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            {/* Resultado */}
            {card && (
              <div className="rounded-3xl border border-black/[0.04] bg-white p-6 shadow-md">
                <LoyaltyCardView
                  card={card}
                  config={config}
                  onAddStamp={() => addStamp.mutate(card)}
                  onRedeem={() => redeemReward.mutate(card)}
                  isBusy={isBusy}
                />
              </div>
            )}

            {showNotFound && (
              <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-neutral-200 bg-white py-12 px-6 text-center shadow-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-50 shadow-inner border border-neutral-100">
                  <Star size={28} className="text-neutral-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-neutral-800">{PAGE_COPY.notFound}</h3>
                  <p className="mt-1 text-[14px] font-medium text-neutral-500">{PAGE_COPY.createTitle}</p>
                </div>
                <div className="mt-2 flex w-full max-w-sm flex-col gap-3">
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder={PAGE_COPY.namePlaceholder}
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-bold text-neutral-800 outline-none transition-colors focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100 text-center"
                  />
                  <button
                    type="button"
                    disabled={createCard.isPending || !newCustomerName.trim()}
                    onClick={() => void handleCreate()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 text-[14px] font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-neutral-800 active:scale-95 disabled:opacity-40"
                  >
                    <UserPlus size={16} />
                    {createCard.isPending ? PAGE_COPY.creating : PAGE_COPY.create}
                  </button>
                </div>
              </div>
            )}
            
            {!card && !showNotFound && searchedPhone && isSearching && (
              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-black/[0.04] bg-white py-16 text-center shadow-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800"></div>
                <p className="text-[14px] font-bold text-neutral-500">Buscando tarjeta...</p>
              </div>
            )}
            
            {!card && !showNotFound && !searchedPhone && (
              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-black/[0.04] bg-neutral-50/50 py-16 text-center shadow-sm">
                 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-100">
                  <Star size={28} className="text-neutral-300" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-neutral-500">Ingresa un número para buscar</h3>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Configuración */}
        <LoyaltyConfigSection tenantId={tenantId} config={config} />
      </div>
    </div>
  )
}
