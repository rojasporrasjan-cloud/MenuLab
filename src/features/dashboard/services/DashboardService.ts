import {
  collection,
  collectionGroup,
  query,
  where,
  getCountFromServer,
  Timestamp,
} from 'firebase/firestore'
import type { Query, DocumentData } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import type { DashboardMetrics } from '../types/dashboard.types'

import { isFirebaseConfigured } from '@infrastructure/firebase/config'

export const DashboardService = {
  async getMetrics(tenantId: string): Promise<DashboardMetrics> {
    if (!isFirebaseConfigured) {
      return {
        activeMenus: 1,
        activeDishes: 7,
        activeTables: 3,
        arLaunchesLast30d: 42,
        qrScansLast30d: 128,
      }
    }
    const thirtyDaysAgo = Timestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    )

    const safeGetCount = async (q: Query<DocumentData>) => {
      try {
        const snap = await getCountFromServer(q)
        return snap.data().count
      } catch (error) {
        console.warn('Error en query de conteo (posible índice faltante):', error)
        return 0
      }
    }

    const [activeMenus, activeDishes, activeTables, arLaunches, qrScans] = await Promise.all([
      safeGetCount(
        query(
          collection(db, firestorePaths.menus(tenantId)),
          where('status', '==', 'active'),
        ),
      ),
      safeGetCount(
        query(
          collectionGroup(db, 'dishes'),
          where('tenantId', '==', tenantId),
        ),
      ),
      safeGetCount(
        query(
          collection(db, firestorePaths.tables(tenantId)),
          where('status', '==', 'active'),
        ),
      ),
      safeGetCount(
        query(
          collection(db, firestorePaths.analyticsEvents(tenantId)),
          where('type', '==', 'ar_launch'),
          where('timestamp', '>=', thirtyDaysAgo),
        ),
      ),
      safeGetCount(
        query(
          collection(db, firestorePaths.analyticsEvents(tenantId)),
          where('type', '==', 'qr_scan'),
          where('timestamp', '>=', thirtyDaysAgo),
        ),
      ),
    ])

    return {
      activeMenus,
      activeDishes,
      activeTables,
      arLaunchesLast30d: arLaunches,
      qrScansLast30d: qrScans,
    }
  },
}
