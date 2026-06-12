import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firebaseConfig, isFirebaseConfigured } from '@infrastructure/firebase/config'
import { firestorePaths } from '@infrastructure/firebase/paths'

/**
 * Email determinístico de la cuenta de staff de un restaurante. El trabajador
 * nunca lo ve: solo escribe el PIN (que es la contraseña de esta cuenta).
 */
export function staffAuthEmail(tenantId: string): string {
  return `staff.${tenantId}@staff.menulab.app`
}

export interface SetStaffPinInput {
  readonly tenantId: string
  /** PIN de acceso del staff (es la contraseña real → mínimo 6 caracteres). */
  readonly pin: string
}

function friendlyError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Ya hay un PIN de staff configurado para este menú. (Cambiar el PIN: próximamente.)'
    case 'auth/weak-password':
      return 'El PIN debe tener al menos 6 dígitos.'
    default:
      return 'No se pudo configurar el PIN de staff. Intenta de nuevo.'
  }
}

/**
 * Configura el acceso de staff de un restaurante: crea una cuenta de Firebase
 * cuyo email se deriva del tenant y cuya **contraseña es el PIN**. Así los
 * trabajadores entran desde cualquier dispositivo escribiendo solo el PIN.
 *
 * Usa una **app secundaria** para no reemplazar la sesión del dueño. Los docs
 * `members/{uid}` (rol staff) y `users/{uid}` se escriben con la sesión del
 * dueño (db primaria), que las reglas autorizan como owner del tenant.
 */
export const StaffAccountService = {
  staffAuthEmail,

  async setStaffPin({ tenantId, pin }: SetStaffPinInput): Promise<void> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase no está configurado.')
    }

    const email = staffAuthEmail(tenantId)
    const secondaryApp = initializeApp(firebaseConfig, `staff-provision-${Date.now()}`)
    try {
      const secondaryAuth = getAuth(secondaryApp)
      let uid: string
      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, email, pin)
        uid = cred.user.uid
      } catch (err) {
        const code = typeof err === 'object' && err !== null && 'code' in err ? String(err.code) : ''
        throw new Error(friendlyError(code), { cause: err })
      }
      await signOut(secondaryAuth)

      const now = serverTimestamp()
      await setDoc(doc(db, firestorePaths.member(tenantId, uid)), {
        id: uid,
        email,
        role: 'staff',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      })
      await setDoc(doc(db, firestorePaths.userAccount(uid)), {
        tenantId,
        role: 'staff',
        createdAt: now,
        updatedAt: now,
      })
    } finally {
      await deleteApp(secondaryApp)
    }
  },
}
