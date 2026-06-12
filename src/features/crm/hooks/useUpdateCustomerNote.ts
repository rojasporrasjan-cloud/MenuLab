import { useMutation, useQueryClient } from '@tanstack/react-query'

import { CrmService } from '../services/CrmService'
import { crmQueryKeys } from '../types/crm.types'

interface UpdateNoteInput {
  readonly tenantId: string
  readonly customerId: string
  readonly note: string
}

/** Guarda la nota interna de un cliente e invalida la lista. */
export function useUpdateCustomerNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, customerId, note }: UpdateNoteInput) =>
      CrmService.updateCustomerNote.execute(tenantId, customerId, note),
    onSuccess: (_, { tenantId }) => {
      void queryClient.invalidateQueries({ queryKey: crmQueryKeys.customers(tenantId) })
    },
  })
}
