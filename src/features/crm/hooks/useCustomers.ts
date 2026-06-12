import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { Customer } from '@core/domain/entities/Customer'
import { normalizeCustomerPhone } from '@core/domain/entities/Customer'
import { isFirebaseConfigured } from '@infrastructure/firebase/config'
import { LIMITS } from '@shared/constants/limits'

import { CrmService } from '../services/CrmService'
import { crmQueryKeys } from '../types/crm.types'
import type { CustomerSort } from '../types/crm.types'

const CUSTOMERS_STALE_MS = 1000 * 60

function sortCustomers(customers: readonly Customer[], sort: CustomerSort): Customer[] {
  const copy = [...customers]
  if (sort === 'orders') return copy.sort((a, b) => b.totalOrders - a.totalOrders)
  if (sort === 'spent') return copy.sort((a, b) => b.totalSpent - a.totalSpent)
  return copy.sort(
    (a, b) => (b.lastOrderAt?.getTime() ?? 0) - (a.lastOrderAt?.getTime() ?? 0),
  )
}

/**
 * Lista de clientes del tenant con búsqueda (nombre o teléfono) y ordenamiento.
 */
export function useCustomers(tenantId: string) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<CustomerSort>('recent')

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: crmQueryKeys.customers(tenantId),
    queryFn: () => CrmService.listCustomers.execute(tenantId),
    enabled: Boolean(tenantId) && isFirebaseConfigured,
    staleTime: CUSTOMERS_STALE_MS,
  })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (term.length < LIMITS.search.minQueryLength) return sortCustomers(customers, sort)
    const phoneTerm = normalizeCustomerPhone(term)
    const matches = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (phoneTerm.length > 0 && c.phone.includes(phoneTerm)),
    )
    return sortCustomers(matches, sort)
  }, [customers, search, sort])

  return {
    customers: filtered,
    totalCount: customers.length,
    isLoading,
    error,
    search,
    setSearch,
    sort,
    setSort,
  }
}
