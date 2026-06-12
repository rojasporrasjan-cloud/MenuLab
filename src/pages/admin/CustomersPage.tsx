import { useState } from 'react'
import { Users, Search, Download } from 'lucide-react'

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

const CSV_FILE_NAME = 'clientes.csv'

function formatLastOrder(date: Date | null): string {
  if (!date) return COPY.crm.neverOrdered
  return date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })
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
    { label: COPY.crm.stats.customers, value: String(customers.length) },
    { label: COPY.crm.stats.vip, value: String(vipCount) },
    { label: COPY.crm.stats.inactive, value: String(inactiveCount) },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{s.label}</p>
          <p className="mt-1 truncate text-xl font-black text-neutral-900">{s.value}</p>
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
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={COPY.crm.searchPlaceholder}
            className="w-full rounded-xl border border-black/[0.08] bg-white py-2 pl-9 pr-3 text-[13px] text-neutral-800 shadow-sm outline-none transition-colors focus:border-neutral-400"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as CustomerSort)} // safe: <select> solo contiene opciones de CUSTOMER_SORT
          className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[12.5px] font-semibold text-neutral-700 shadow-sm outline-none focus:border-neutral-400"
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
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-[12.5px] font-bold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 disabled:opacity-40"
        >
          <Download size={13} /> {COPY.crm.exportCsv}
        </button>
      </div>

      <CrmStats customers={customers} />

      {/* Lista */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-neutral-200/60" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/[0.1] py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <Users size={22} className="text-neutral-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-500">
              {totalCount === 0 ? COPY.crm.empty : COPY.crm.noSearchResults}
            </p>
            {totalCount === 0 && (
              <p className="mt-1 max-w-sm text-[12px] text-neutral-400">{COPY.crm.emptyHint}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
          {/* Header */}
          <div className="hidden items-center gap-4 border-b border-black/[0.05] bg-neutral-50/80 px-4 py-2.5 text-[10.5px] font-black uppercase tracking-wider text-neutral-400 sm:flex">
            <span className="min-w-0 flex-1">{COPY.crm.table.customer}</span>
            <span className="w-16 text-right">{COPY.crm.table.orders}</span>
            <span className="w-24 text-right">{COPY.crm.table.spent}</span>
            <span className="w-24 text-right">{COPY.crm.table.avgTicket}</span>
            <span className="w-28 text-right">{COPY.crm.table.lastOrder}</span>
          </div>

          {customers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => setSelectedId(customer.id)}
              className="flex w-full items-center gap-4 border-b border-black/[0.04] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-neutral-50"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold text-neutral-900">
                  {customer.name || customer.phone}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-neutral-400">
                  {customer.name && <span>{customer.phone}</span>}
                  <CustomerTags customer={customer} />
                </span>
              </span>
              <span className="w-16 shrink-0 text-right text-[13px] font-black tabular-nums text-neutral-800">
                {customer.totalOrders}
              </span>
              <span className="hidden w-24 shrink-0 text-right text-[13px] font-bold tabular-nums text-neutral-700 sm:block">
                {formatCurrency(customer.totalSpent, customer.currency)}
              </span>
              <span className="hidden w-24 shrink-0 text-right text-[12.5px] tabular-nums text-neutral-500 sm:block">
                {formatCurrency(customer.averageTicket, customer.currency)}
              </span>
              <span className="hidden w-28 shrink-0 text-right text-[12px] text-neutral-500 sm:block">
                {formatLastOrder(customer.lastOrderAt)}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <CustomerDrawer tenantId={tenantId} customer={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
