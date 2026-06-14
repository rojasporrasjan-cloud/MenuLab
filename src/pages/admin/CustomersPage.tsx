import { useState } from 'react'
import { Users, Search, Download, Star, TrendingDown } from 'lucide-react'

import type { Customer } from '@core/domain/entities/Customer'
import { customerAutoTags, CUSTOMER_AUTO_TAG } from '@core/domain/entities/Customer'
import { useTenantContext } from '@app/providers/TenantProvider'
import {
  useCustomers,
  CustomerDrawer,
  CustomerTags,
  CustomerCsvService,
  CUSTOMER_SORT_LABELS,
} from '@features/crm'
import type { CustomerSort } from '@features/crm'
import { UpgradeGate } from '@features/billing'
import { formatCurrency } from '@shared/utils/formatCurrency'
import { LIMITS } from '@shared/constants/limits'
import { COPY } from '@shared/copy/ui.copy'
import { PageHeader } from '@shared/ui/components/PageHeader'

const CSV_FILE_NAME = 'clientes.csv'

function formatLastOrder(date: Date | null): string {
  if (!date) return COPY.crm.neverOrdered
  return date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Header Info ──────────────────────────────────────────────────────────────
function CrmHeader() {
  return (
    <div className="mb-6">
      <PageHeader
        eyebrow="Clientes"
        title="Clientes"
        subtitle="Conoce a tu audiencia: historial, ticket promedio y frecuencia de compra."
      />
    </div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function CrmStats({ customers }: { customers: readonly Customer[] }) {
  const now = new Date()
  const vipCount = customers.filter((c) =>
    customerAutoTags(c, now, LIMITS.crm).includes(CUSTOMER_AUTO_TAG.vip),
  ).length
  const inactiveCount = customers.filter((c) =>
    customerAutoTags(c, now, LIMITS.crm).includes(CUSTOMER_AUTO_TAG.inactive),
  ).length

  const stats = [
    { label: COPY.crm.stats.customers, value: String(customers.length), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: COPY.crm.stats.vip, value: String(vipCount), icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: COPY.crm.stats.inactive, value: String(inactiveCount), icon: TrendingDown, color: 'text-neutral-500', bg: 'bg-neutral-100' },
  ]

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-black/[0.04] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[11.5px] font-bold uppercase tracking-wider text-neutral-400">{s.label}</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-neutral-900">{s.value}</p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.bg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              <s.icon size={22} className={s.color} />
            </div>
          </div>
          <div className="absolute -right-6 -top-6 z-0 h-24 w-24 rounded-full bg-gradient-to-br from-black/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  return (
    <UpgradeGate feature="crm">
      <CustomersPageContent />
    </UpgradeGate>
  )
}

function CustomersPageContent() {
  const { tenantId } = useTenantContext()
  const { customers, totalCount, isLoading, search, setSearch, sort, setSort } =
    useCustomers(tenantId)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = customers.find((c) => c.id === selectedId) ?? null

  function handleExport() {
    CustomerCsvService.download(customers, CSV_FILE_NAME)
  }

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <CrmHeader />

      <CrmStats customers={customers} />

      <div className="flex flex-col gap-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[240px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={COPY.crm.searchPlaceholder}
              className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-[14px] text-neutral-800 shadow-sm outline-none transition-colors focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as CustomerSort)} // safe: <select> solo contiene opciones de CUSTOMER_SORT
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[14px] font-bold text-neutral-700 shadow-sm outline-none transition-colors focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
          >
            {Object.entries(CUSTOMER_SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExport}
            disabled={customers.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-[14px] font-bold text-neutral-700 shadow-sm ring-1 ring-neutral-200 transition-all hover:bg-neutral-50 hover:shadow-md active:scale-95 disabled:opacity-40"
          >
            <Download size={16} className="text-neutral-400" /> {COPY.crm.exportCsv}
          </button>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-neutral-100" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-100">
              <Users size={28} className="text-neutral-300" />
            </div>
            <div>
              <h3 className="text-lg font-black text-neutral-800">
                {totalCount === 0 ? COPY.crm.empty : COPY.crm.noSearchResults}
              </h3>
              {totalCount === 0 && (
                <p className="mt-1 max-w-sm text-[14px] font-medium text-neutral-500">{COPY.crm.emptyHint}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Header Desktop */}
            <div className="hidden items-center gap-4 px-6 py-2 text-[11px] font-black uppercase tracking-widest text-neutral-400 sm:flex">
              <span className="min-w-0 flex-1">{COPY.crm.table.customer}</span>
              <span className="w-20 text-right">{COPY.crm.table.orders}</span>
              <span className="w-28 text-right">{COPY.crm.table.spent}</span>
              <span className="w-28 text-right">{COPY.crm.table.avgTicket}</span>
              <span className="w-32 text-right">{COPY.crm.table.lastOrder}</span>
            </div>

            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => setSelectedId(customer.id)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-black/[0.04] bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-200 hover:shadow-md"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-3">
                    <span className="block truncate text-[15px] font-black text-neutral-900 group-hover:text-neutral-800">
                      {customer.name || customer.phone}
                    </span>
                    <CustomerTags customer={customer} />
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-[13px] font-medium text-neutral-500">
                    {customer.name && <span>{customer.phone}</span>}
                  </span>
                </span>
                
                <div className="flex flex-col items-end w-20 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 sm:hidden mb-0.5">Pedidos</span>
                  <span className="text-[14px] font-black tabular-nums text-neutral-800">
                    {customer.totalOrders}
                  </span>
                </div>
                
                <div className="hidden w-28 shrink-0 flex-col items-end sm:flex">
                  <span className="text-[14px] font-bold tabular-nums text-neutral-700">
                    {formatCurrency(customer.totalSpent, customer.currency)}
                  </span>
                </div>
                
                <div className="hidden w-28 shrink-0 flex-col items-end sm:flex">
                  <span className="inline-flex rounded-lg bg-neutral-100 px-2.5 py-1 text-[13px] font-bold tabular-nums text-neutral-600">
                    {formatCurrency(customer.averageTicket, customer.currency)}
                  </span>
                </div>
                
                <div className="hidden w-32 shrink-0 flex-col items-end sm:flex">
                  <span className="text-[13px] font-medium text-neutral-500">
                    {formatLastOrder(customer.lastOrderAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <CustomerDrawer tenantId={tenantId} customer={selected} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  )
}
