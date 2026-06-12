import type { DeviceType } from '@core/domain/entities/AnalyticsEvent'

const SESSION_STORAGE_KEY = 'mlb_session_id'

/** ID de sesión anónima estable durante la visita (sessionStorage). */
export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_STORAGE_KEY, id)
    return id
  } catch {
    // Safari private mode u otros entornos sin sessionStorage.
    return 'anonymous'
  }
}

const TABLET_MIN_WIDTH = 768
const DESKTOP_MIN_WIDTH = 1280

export function detectDeviceType(): DeviceType {
  const width = window.innerWidth
  if (width >= DESKTOP_MIN_WIDTH) return 'desktop'
  if (width >= TABLET_MIN_WIDTH) return 'tablet'
  return 'mobile'
}
