import type { VercelRequest, VercelResponse } from '@vercel/node'
import { FieldValue } from 'firebase-admin/firestore'
import { admin } from '../config/firebase'

const DEFAULTS = {
  timezone: 'America/Costa_Rica',
  locale: 'es-CR',
  primaryColor: '#16a34a',
} as const

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
    return res.status(401).json({ error: 'Authentication required.' })
  }

  const idToken = authHeader.split('Bearer ')[1]
  let decodedToken
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken)
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' })
  }

  const {
    tenantId,
    name,
    slug,
    plan = 'free',
    timezone = DEFAULTS.timezone,
    locale = DEFAULTS.locale,
  } = req.body

  if (!tenantId || !name || !slug) {
    return res.status(400).json({ error: 'tenantId, name, and slug are required.' })
  }

  try {
    const db = admin.firestore()
    const now = FieldValue.serverTimestamp()
    const isPaid = plan === 'pro' || plan === 'enterprise'
    const uid = decodedToken.uid

    // ── Tenant document ──────────────────────────────────────────────────────
    const tenantRef = db.doc(`tenants/${tenantId}`)
    const tenantSnap = await tenantRef.get()

    if (!tenantSnap.exists) {
      await tenantRef.set({
        id: tenantId,
        name,
        slug,
        status: 'active',
        plan,
        ownerId: uid,
        timezone,
        locale,
        branding: {
          primaryColor: DEFAULTS.primaryColor,
          logoUrl: null,
          coverImageUrl: null,
          fontFamily: null,
        },
        features: {
          arEnabled: isPaid,
          analyticsEnabled: true,
          multiLanguageEnabled: isPaid,
          loyaltyEnabled: plan === 'enterprise',
          qrGeneratorEnabled: true,
        },
        onboardingCompletedAt: null,
        createdAt: now,
        updatedAt: now,
      })
    }

    // ── Owner membership ─────────────────────────────────────────────────────
    const memberRef = db.doc(`tenants/${tenantId}/members/${uid}`)
    const memberSnap = await memberRef.get()
    if (!memberSnap.exists) {
      await memberRef.set({
        role: 'owner',
        addedAt: now,
      })
    }

    // ── User → tenant mapping ────────────────────────────────────────────────
    const userRef = db.doc(`users/${uid}`)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      await userRef.set({
        tenantId,
        role: 'owner',
        createdAt: now,
        updatedAt: now,
      })
    }

    // ── Default menu + category ──────────────────────────────────────────────
    const menusRef = db.collection(`tenants/${tenantId}/menus`)
    const existingMenus = await menusRef.limit(1).get()

    if (existingMenus.empty) {
      const menuRef = menusRef.doc()
      await menuRef.set({
        id: menuRef.id,
        tenantId,
        name: 'Menú principal',
        description: '',
        status: 'active',
        sortOrder: 0,
        categoryOrder: [],
        createdAt: now,
        updatedAt: now,
      })

      const categoriesRef = db.collection(`tenants/${tenantId}/menus/${menuRef.id}/categories`)
      const categoryRef = categoriesRef.doc()
      await categoryRef.set({
        id: categoryRef.id,
        tenantId,
        menuId: menuRef.id,
        name: 'Platos principales',
        description: '',
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      })

      // Wire the category into the menu's order array
      await menuRef.update({
        categoryOrder: [categoryRef.id],
        updatedAt: now,
      })
    }

    return res.status(200).json({ success: true, tenantId })
  } catch (error: any) {
    console.error('Error en initializeTenant:', error)
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
