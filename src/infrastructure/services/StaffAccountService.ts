import { getAuth, signInWithCustomToken } from 'firebase/auth'
import { app, isFirebaseConfigured } from '@infrastructure/firebase/config'

export function staffAuthEmail(tenantId: string): string {
  return `staff.${tenantId}@staff.menulab.app`
}

export interface SetStaffPinInput {
  readonly tenantId: string
  readonly pin: string
}

export const StaffAccountService = {
  staffAuthEmail,

  async setStaffPin({ tenantId, pin }: SetStaffPinInput): Promise<void> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase no está configurado.')
    }

    const auth = getAuth(app)
    const user = auth.currentUser
    if (!user) throw new Error('Debe estar autenticado.')

    const idToken = await user.getIdToken()

    const res = await fetch('/api/tenant/updateStaffPin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ tenantId, pin }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'No se pudo configurar el PIN de staff. Intenta de nuevo.')
    }
  },

  async loginWithPin(tenantId: string, pin: string): Promise<void> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase no está configurado.')
    }

    try {
      const res = await fetch('/api/tenant/loginStaff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId, pin }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'PIN incorrecto o restaurante no encontrado.')
      }

      const auth = getAuth(app)
      await signInWithCustomToken(auth, data.token)
    } catch (err: any) {
      if (err.message.includes('incorrecto') || err.message.includes('encontrado')) {
        throw err
      }
      throw new Error('No se pudo iniciar sesión. Intenta de nuevo.')
    }
  },
}
