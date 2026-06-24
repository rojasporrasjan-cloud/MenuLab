import { collection, doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import type { IAnalyticsRepository } from '@core/domain/repositories/IAnalyticsRepository'
import type { AnalyticsEvent, AnalyticsEventType } from '@core/domain/entities/AnalyticsEvent'

export class AnalyticsService implements IAnalyticsRepository {
  async track(
    tenantId: string,
    event: Omit<AnalyticsEvent, 'id' | 'tenantId'>,
  ): Promise<void> {
    const batch = writeBatch(db)

    // 1. Escribir el evento crudo
    const eventRef = doc(collection(db, firestorePaths.analyticsEvents(tenantId)))
    batch.set(eventRef, {
      ...event,
      tenantId,
      timestamp: new Date(),
    })

    // 2. Incrementar las métricas agregadas del día
    const dateStr = new Date().toISOString().split('T')[0]
    const summaryRef = doc(db, firestorePaths.analyticsDailySummaries(tenantId) + `/${dateStr}`)

    const updates: Record<string, unknown> = {
      date: dateStr,
      tenantId,
      totalEvents: increment(1),
      updatedAt: serverTimestamp(),
      [`counts.${event.type}`]: increment(1),
    }

    if (event.dishId) {
      updates[`dishes.${event.dishId}.${event.type}`] = increment(1)
    }

    if (event.deviceType) {
      updates[`devices.${event.deviceType}`] = increment(1)
    }

    batch.set(summaryRef, updates, { merge: true })

    await batch.commit()
  }

  async getEventsByType(
    _tenantId: string,
    _type: AnalyticsEventType,
    _limit: number,
  ): Promise<AnalyticsEvent[]> {
    // Aggregated analytics are built by Cloud Functions (Step 6).
    // Raw event queries are intentionally deferred to the analytics feature.
    return []
  }
}
