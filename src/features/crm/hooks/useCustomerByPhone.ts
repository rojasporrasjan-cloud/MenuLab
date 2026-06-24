import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { Customer } from '@core/domain/entities/Customer'
import { normalizeCustomerPhone } from '@core/domain/entities/Customer'
import { isFirebaseConfigured } from '@infrastructure/firebase/config'

import { CrmService } from '../services/CrmService'
import { crmQueryKeys } from '../types/crm.types'

const CUSTOMERS_STALE_MS = 1000 * 60

/**
 * Busca un cliente concreto por su número de teléfono en bruto.
 * Se normaliza el teléfono antes de buscar y reusa la lista cacheada de clientes.
 * Ideal para autocompletado en el POS.
 */
export function useCustomerByPhone(tenantId: string, rawPhone: string) {
  // Reutiliza el cache general de customers en memoria
  const { data: customers = [], isLoading } = useQuery({
    queryKey: crmQueryKeys.customers(tenantId),
    queryFn: () => CrmService.listCustomers.execute(tenantId),
    enabled: Boolean(tenantId) && isFirebaseConfigured,
    staleTime: CUSTOMERS_STALE_MS,
  })

  const customer = useMemo<Customer | null>(() => {
    const phone = normalizeCustomerPhone(rawPhone)
    if (!phone) return null
    return customers.find((c) => c.phone === phone || c.id === phone) ?? null
  }, [customers, rawPhone])

  return { customer, isLoading }
}
