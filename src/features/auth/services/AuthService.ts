import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
  type UserCredential,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth } from '@infrastructure/firebase/auth'
import { isFirebaseConfigured } from '@infrastructure/firebase/config'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'No existe una cuenta con este email',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/invalid-credential': 'Credenciales inválidas',
  'auth/invalid-email': 'Formato de email inválido',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
  'auth/too-many-requests': 'Demasiados intentos. Intenta en unos minutos',
  'auth/popup-closed-by-user': 'La ventana fue cerrada. Intenta de nuevo',
  'auth/popup-blocked': 'El navegador bloqueó la ventana. Permite popups e intenta',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
  'auth/email-already-in-use': 'Ya existe una cuenta con este email',
}

export function parseAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[error.code] ?? `Error de autenticación (${error.code})`
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}

export const AuthService = {
  signInWithEmail: async (email: string, password: string): Promise<UserCredential> => {
    if (!isFirebaseConfigured) {
      // safe: mock object in dev-only path; only uid/email/displayName fields are consumed by the app
      const fakeUser = {
        uid: 'mock-admin-uid',
        email,
        displayName: 'Administrador Rústico',
        emailVerified: true,
      } as unknown as import('firebase/auth').User
      return { user: fakeUser } as unknown as UserCredential
    }
    return signInWithEmailAndPassword(auth, email, password)
  },

  signUpWithEmail: async (
    email: string,
    password: string,
    displayName: string,
  ): Promise<UserCredential> => {
    if (!isFirebaseConfigured) {
      // safe: mock object in dev-only path; only uid/email/displayName fields are consumed by the app
      const fakeUser = {
        uid: `mock-${Date.now()}`,
        email,
        displayName,
        emailVerified: true,
      } as unknown as import('firebase/auth').User
      return { user: fakeUser } as unknown as UserCredential
    }
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName.trim().length > 0) {
      await updateProfile(credential.user, { displayName: displayName.trim() })
    }
    // Best-effort: send verification email. Don't block registration if it fails.
    sendEmailVerification(credential.user).catch(() => undefined)
    return credential
  },

  signInWithGoogle: async (): Promise<UserCredential> => {
    if (!isFirebaseConfigured) {
      // safe: mock object in dev-only path; only uid/email/displayName fields are consumed by the app
      const fakeUser = {
        uid: 'mock-google-uid',
        email: 'google.user@gmail.com',
        displayName: 'Usuario Google Rústico',
        emailVerified: true,
      } as unknown as import('firebase/auth').User
      return { user: fakeUser } as unknown as UserCredential
    }
    return signInWithPopup(auth, googleProvider)
  },

  resendVerificationEmail: async (): Promise<void> => {
    if (!isFirebaseConfigured) return
    const { currentUser } = auth
    if (currentUser) {
      await sendEmailVerification(currentUser)
    }
  },

  sendPasswordReset: async (email: string): Promise<void> => {
    if (!isFirebaseConfigured) return
    return sendPasswordResetEmail(auth, email)
  },

  signOut: async (): Promise<void> => {
    if (!isFirebaseConfigured) {
      localStorage.removeItem('mock_user')
      return
    }
    return signOut(auth)
  },

  /**
   * Método de inicio de sesión del usuario actual: 'google' (popup) o
   * 'password' (correo/contraseña). Define cómo se le pide re-autenticarse.
   * `null` si no hay sesión.
   */
  getAuthProvider: (): 'google' | 'password' | null => {
    if (!isFirebaseConfigured) return 'password'
    const user = auth.currentUser
    if (!user) return null
    const providerId = user.providerData[0]?.providerId
    return providerId === GoogleAuthProvider.PROVIDER_ID ? 'google' : 'password'
  },

  /**
   * Re-autentica al usuario actual para operaciones sensibles (ej. restablecer
   * el PIN maestro cuando el dueño lo olvidó). Prueba que es el dueño y no un
   * empleado usando su sesión. Lanza FirebaseError si las credenciales fallan.
   */
  reauthenticate: async (password?: string): Promise<void> => {
    if (!isFirebaseConfigured) return
    const user = auth.currentUser
    if (!user) throw new Error('No hay una sesión activa.')

    const providerId = user.providerData[0]?.providerId
    if (providerId === GoogleAuthProvider.PROVIDER_ID) {
      const googleProvider = new GoogleAuthProvider()
      googleProvider.setCustomParameters({ prompt: 'select_account' })
      await reauthenticateWithPopup(user, googleProvider)
      return
    }

    if (!user.email) throw new Error('Tu cuenta no tiene un correo asociado.')
    if (!password) throw new Error('Ingresa la contraseña de tu cuenta.')
    const credential = EmailAuthProvider.credential(user.email, password)
    await reauthenticateWithCredential(user, credential)
  },
}
