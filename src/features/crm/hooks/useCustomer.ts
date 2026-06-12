import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { Customer } from '@core/domain/entities/Customer'
import { isFirebaseConfigured } from '@infrastructure/firebase/config'

import { CrmService } from '../services/CrmService'
import { crmQueryKeys } from '../types/crm.types'

const CUSTOMERS_STALE_MS = 1000 * 60

/**
 * Un cliente concreto por id (teléfono normalizado).
 * Reusa la query de lista — el CRM siempre se navega desde ella.
 */
export function useCustomer(tenantId: string, customerId: string | null) {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: crmQueryKeys.customers(tenantId),
    queryFn: () => CrmService.listCustomers.execute(tenantId),
    enabled: Boolean(tenantId) && isFirebaseConfigured,
    staleTime: CUSTOMERS_STALE_MS,
  })

  const customer = useMemo<Customer | null>(
    () => customers.find((c) => c.id === customerId) ?? null,
    [customers, customerId],
  )

  return { customer, isLoading }
}
