// Punto único de lectura de variables de entorno.
// El acceso a `import.meta.env.VITE_*` debe ser estático (Vite lo reemplaza en
// build); por eso los helpers reciben el valor, no la clave. No se lanza si
// falta una var de Firebase: el fallback a mocks depende de apiKey vacío
// (ver isFirebaseConfigured).

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

const APP_ENVS = ['development', 'staging', 'production'] as const
type AppEnv = (typeof APP_ENVS)[number]

function asAppEnv(value: unknown): AppEnv {
  return APP_ENVS.find((candidate) => candidate === value) ?? 'development'
}

export const ENV = {
  firebase: {
    apiKey:            asString(import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain:        asString(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId:         asString(import.meta.env.VITE_FIREBASE_PROJECT_ID),
    storageBucket:     asString(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: asString(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId:             asString(import.meta.env.VITE_FIREBASE_APP_ID),
    measurementId:     asString(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID),
  },
  app: {
    name:        asString(import.meta.env.VITE_APP_NAME),
    env:         asAppEnv(import.meta.env.VITE_APP_ENV),
    isDev:       import.meta.env.DEV,
    isProd:      import.meta.env.PROD,
    useEmulator: import.meta.env.VITE_USE_EMULATOR === 'true',
  },
  cloudinary: {
    cloudName:    asString(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME),
    uploadPreset: asString(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET),
  },
  gemini: {
    // Opcional — define VITE_GEMINI_API_KEY para habilitar la digitalización con IA.
    apiKey: asString(import.meta.env.VITE_GEMINI_API_KEY),
  },
} as const
