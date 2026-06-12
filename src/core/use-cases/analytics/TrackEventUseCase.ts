import type { AnalyticsEvent } from '@core/domain/entities/AnalyticsEvent'
import type { IAnalyticsRepository } from '@core/domain/repositories/IAnalyticsRepository'

export class TrackEventUseCase {
  private readonly analyticsRepository: IAnalyticsRepository

  constructor(analyticsRepository: IAnalyticsRepository) {
    this.analyticsRepository = analyticsRepository
  }

  async execute(tenantId: string, event: Omit<AnalyticsEvent, 'id' | 'tenantId'>): Promise<void> {
    if (!tenantId) return
    try {
      await this.analyticsRepository.track(tenantId, event)
    } catch (error) {
      // El tracking es fire-and-forget: nunca debe romper la experiencia
      // del cliente. Si Firestore rechaza el evento, se descarta.
      void error
    }
  }
}
