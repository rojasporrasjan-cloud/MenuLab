import { ENV } from '@shared/config/env'

export interface PlatformAdminIdentity {
  readonly uid: string
  readonly email: string | null
}

/** True si el usuario es superadmin de la plataforma (por UID o por correo). */
export function isPlatformAdminUser(user: PlatformAdminIdentity | null): boolean {
  if (!user) return false
  const email = user.email?.toLowerCase() ?? null
  return ENV.platformAdminUids.includes(user.uid)
    || (email !== null && ENV.platformAdminEmails.includes(email))
}
