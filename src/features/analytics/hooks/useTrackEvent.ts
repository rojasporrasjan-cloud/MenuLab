import { useCallback } from 'react'
import { isFirebaseConfigured } from '@infrastructure/firebase/config'
import { AnalyticsService } from '@infrastructure/services/AnalyticsService'
import { TrackEventUseCase } from '@core/use-cases/analytics/TrackEventUseCase'
import type { AnalyticsEventType } from '@core/domain/entities/AnalyticsEvent'
import { getSessionId, detectDeviceType } from '@shared/utils/session'

const trackEventUseCase = new TrackEventUseCase(new AnalyticsService())

export interface TrackEventInput {
  readonly type: AnalyticsEventType
  readonly menuId?: string | null
  readonly dishId?: string | null
  readonly tableId?: string | null
}

/**
 * Hook de tracking anónimo para la carta pública.
 * Fire-and-forget: nunca lanza ni bloquea la UI.
 */
export function useTrackEvent(tenantId: string) {
  const track = useCallback(
    (input: TrackEventInput): void => {
      if (!tenantId || !isFirebaseConfigured) return
      void trackEventUseCase.execute(tenantId, {
        type: input.type,
        menuId: input.menuId ?? null,
        dishId: input.dishId ?? null,
        tableId: input.tableId ?? null,
        sessionId: getSessionId(),
        deviceType: detectDeviceType(),
        timestamp: new Date(),
      })
    },
    [tenantId],
  )

  return { track }
}
