import { onRequest } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}

export const setCors = onRequest(async (req, res) => {
  try {
    const bucketName = 'soda-la-rustica.firebasestorage.app'
    const bucket = admin.storage().bucket(bucketName)
    
    await bucket.setCorsConfiguration([
      {
        origin: ['*'],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
        maxAgeSeconds: 3600,
        responseHeader: [
          'Content-Type',
          'Authorization',
          'Content-Length',
          'X-Requested-With',
          'x-goog-resumable',
          'x-firebase-storage-version'
        ]
      }
    ])
    
    // Also try the default bucket just in case
    try {
      const defaultBucket = admin.storage().bucket()
      await defaultBucket.setCorsConfiguration([
        {
          origin: ['*'],
          method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
          maxAgeSeconds: 3600,
          responseHeader: [
            'Content-Type',
            'Authorization',
            'Content-Length',
            'X-Requested-With',
            'x-goog-resumable',
            'x-firebase-storage-version'
          ]
        }
      ])
    } catch {
      // El bucket default puede no existir en plan Spark — no es un error fatal.
    }

    res.send({ success: true, message: 'CORS configured successfully on ' + bucketName })
  } catch (error: unknown) {
    console.error('Error setting CORS:', error)
    const message = error instanceof Error ? error.message : String(error)
    res.status(500).send({ success: false, error: message })
  }
})
