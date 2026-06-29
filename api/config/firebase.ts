import * as admin from 'firebase-admin'
import fs from 'fs'
import path from 'path'

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle both literal newline characters and escaped newlines
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      })
    } else {
      // Local development fallback
      const keyPath = path.resolve(process.cwd(), 'key.json')
      if (fs.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        })
      } else {
        console.error('No FIREBASE_PRIVATE_KEY and no key.json found.')
      }
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error)
  }
}

export { admin }
