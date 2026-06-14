import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CashService } from '../services/CashService'
import type { CashSession, NewCashSession } from '@core/domain/entities/CashSession'
import type { CloseCashSessionInput } from '@core/use-cases/cash/CloseCashSessionUseCase'

const HISTORY_LIMIT = 30

const cashKeys = {
  open: (tenantId: string) => ['cash-session-open', tenantId] as const,
  history: (tenantId: string) => ['cash-sessions', tenantId] as const,
}

/** Caja actualmente abierta del tenant (o null). */
export function useCurrentCashSession(tenantId: string) {
  return useQuery<CashSession | null>({
    queryKey: cashKeys.open(tenantId),
    queryFn: () => CashService.getOpen.execute(tenantId),
    enabled: !!tenantId,
  })
}

/** Historial de cierres (más recientes primero). */
export function useCashHistory(tenantId: string) {
  return useQuery<CashSession[]>({
    queryKey: cashKeys.history(tenantId),
    queryFn: () => CashService.list.execute(tenantId, HISTORY_LIMIT),
    enabled: !!tenantId,
  })
}

function useInvalidateCash(tenantId: string): () => Promise<void> {
  const queryClient = useQueryClient()
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: cashKeys.open(tenantId) }),
      queryClient.invalidateQueries({ queryKey: cashKeys.history(tenantId) }),
    ])
  }
}

export function useOpenCashSession(tenantId: string) {
  const invalidate = useInvalidateCash(tenantId)
  return useMutation<CashSession, Error, NewCashSession>({
    mutationFn: (input) => CashService.open.execute(input),
    onSuccess: () => invalidate(),
  })
}

export function useCloseCashSession(tenantId: string) {
  const invalidate = useInvalidateCash(tenantId)
  return useMutation({
    mutationFn: (input: CloseCashSessionInput) => CashService.close.execute(input),
    onSuccess: () => invalidate(),
  })
}
