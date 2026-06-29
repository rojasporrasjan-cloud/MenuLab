import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomBytes, scryptSync } from 'crypto'
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

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Debe estar autenticado.' })
  }

  const idToken = authHeader.split('Bearer ')[1]
  let decodedToken
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken)
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' })
  }

  const { tenantId, pin } = req.body
  if (!tenantId || !pin) {
    return res.status(400).json({ error: 'Faltan parámetros.' })
  }

  try {
    // Verificar que el usuario que llama sea el dueño del tenant
    const memberDoc = await admin.firestore().doc(`tenants/${tenantId}/members/${decodedToken.uid}`).get()
    if (!memberDoc.exists || memberDoc.data()?.role !== 'owner') {
      return res.status(403).json({ error: 'Solo el dueño puede cambiar el PIN de staff.' })
    }

    const salt = randomBytes(16).toString('hex')
    const derivedKey = scryptSync(pin, salt, 64).toString('hex')
    const staffPinHash = `${salt}:${derivedKey}`

    const staffEmail = `staff.${tenantId}@staff.menulab.app`
    let uid: string

    try {
      const userRecord = await admin.auth().getUserByEmail(staffEmail)
      uid = userRecord.uid
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        const newUser = await admin.auth().createUser({ email: staffEmail })
        uid = newUser.uid
      } else {
        throw new Error('Error al verificar cuenta de staff.')
      }
    }

    await admin.firestore().doc(`tenants/${tenantId}`).update({
      staffPinHash,
      staffUid: uid,
    })

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Error en updateStaffPin:', error)
    return res.status(500).json({ error: 'Error al guardar el PIN de staff en DB.' })
  }
}
