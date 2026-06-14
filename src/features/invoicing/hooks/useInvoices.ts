import { useQuery } from '@tanstack/react-query'
import { InvoiceService } from '../services/InvoiceService'
import type { Invoice } from '@core/domain/entities/Invoice'

export function useInvoices(tenantId: string) {
  return useQuery<Invoice[]>({
    queryKey: ['invoices', tenantId],
    queryFn: () => InvoiceService.list(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 1000 * 60,
  })
}
