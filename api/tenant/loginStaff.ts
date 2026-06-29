import type { VercelRequest, VercelResponse } from '@vercel/node'
import { scryptSync } from 'crypto'
import { admin } from '../config/firebase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { tenantId, pin } = req.body

  if (!tenantId || !pin) {
    return res.status(400).json({ error: 'Faltan parámetros.' })
  }

  try {
    // 1. Obtener el tenant y verificar que exista
    const tenantDoc = await admin.firestore().doc(`tenants/${tenantId}`).get()
    if (!tenantDoc.exists) {
      return res.status(404).json({ error: 'Restaurante no encontrado.' })
    }

    const tenantData = tenantDoc.data()
    if (!tenantData?.staffPinHash || !tenantData?.staffUid) {
      return res.status(400).json({ error: 'El PIN de staff no ha sido configurado por el dueño.' })
    }

    const [salt, storedKey] = tenantData.staffPinHash.split(':')
    if (!salt || !storedKey) {
      return res.status(500).json({ error: 'Configuración de seguridad corrupta.' })
    }

    // 2. Verificar PIN con scrypt
    const attemptKey = scryptSync(pin, salt, 64).toString('hex')
    if (attemptKey !== storedKey) {
      // TODO: Implementar rate-limiting aquí
      return res.status(401).json({ error: 'PIN incorrecto.' })
    }

    // 3. Generar Custom Token
    const customToken = await admin.auth().createCustomToken(tenantData.staffUid)
    return res.status(200).json({ token: customToken })
  } catch (error: any) {
    console.error('Error en loginStaff:', error)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
