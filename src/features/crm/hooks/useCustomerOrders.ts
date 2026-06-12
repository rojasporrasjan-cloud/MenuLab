import { useQuery } from '@tanstack/react-query'

import { isFirebaseConfigured } from '@infrastructure/firebase/config'
import { LIMITS } from '@shared/constants/limits'

import { CrmService } from '../services/CrmService'
import { crmQueryKeys } from '../types/crm.types'

const ORDERS_STALE_MS = 1000 * 30

/** Historial de pedidos de un cliente (teléfono normalizado). */
export function useCustomerOrders(tenantId: string, customerPhone: string | null) {
  return useQuery({
    queryKey: crmQueryKeys.customerOrders(tenantId, customerPhone ?? ''),
    queryFn: () =>
      CrmService.listCustomerOrders.execute(
        tenantId,
        customerPhone ?? '',
        LIMITS.crm.orderHistoryScan,
      ),
    enabled: Boolean(tenantId) && Boolean(customerPhone) && isFirebaseConfigured,
    staleTime: ORDERS_STALE_MS,
  })
}
