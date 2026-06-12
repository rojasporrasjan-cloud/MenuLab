import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { ENV } from '@shared/constants/env'

export const isFirebaseConfigured = Boolean(ENV.firebase.apiKey)

export const firebaseConfig = {
  apiKey: ENV.firebase.apiKey,
  authDomain: ENV.firebase.authDomain,
  projectId: ENV.firebase.projectId,
  storageBucket: ENV.firebase.storageBucket,
  messagingSenderId: ENV.firebase.messagingSenderId,
  appId: ENV.firebase.appId,
  measurementId: ENV.firebase.measurementId,
}

// Singleton — prevents re-initialization on hot reload
export const app: FirebaseApp | null = isFirebaseConfigured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0])
  : null
