const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { readFileSync } = require('fs')
const { resolve } = require('path')

const keyPath = resolve(__dirname, '../key.json')

let serviceAccount
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'))
} catch (e) {
  console.error("Could not read key.json from root directory.")
  process.exit(1)
}

initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore()

async function migrate() {
  console.log('🚀 Starting Admin migration for existing tenants...')
  const tenantsSnap = await db.collection('tenants').get()
  console.log(`Found ${tenantsSnap.size} tenants to migrate.`)

  let batch = db.batch()
  let count = 0
  let totalMigrated = 0

  for (const tenantDoc of tenantsSnap.docs) {
    const data = tenantDoc.data()
    const features = data.features || {}
    const branding = data.branding || {}

    let needsUpdate = false

    if (!features.orderingEnabled) {
      features.orderingEnabled = true
      needsUpdate = true
    }

    if (!branding.orderButton) {
      branding.orderButton = { enabled: true, whatsapp: '', label: 'Ordenar ahora' }
      needsUpdate = true
    } else if (!branding.orderButton.enabled) {
      branding.orderButton.enabled = true
      needsUpdate = true
    }

    if (!branding.infoFooter) {
      branding.infoFooter = { enabled: true, hours: '', address: '', phone: '', wazeUrl: '', googleMapsUrl: '', sinpeNumber: '' }
      needsUpdate = true
    } else if (!branding.infoFooter.enabled) {
      branding.infoFooter.enabled = true
      needsUpdate = true
    }

    if (needsUpdate) {
      batch.update(tenantDoc.ref, { features, branding })
      count++
      totalMigrated++

      if (count >= 400) {
        await batch.commit()
        batch = db.batch()
        count = 0
        console.log(`Committed 400 updates...`)
      }
    }
  }

  if (count > 0) {
    await batch.commit()
  }

  console.log(`✅ Migration complete. Updated ${totalMigrated} tenants.`)
  process.exit(0)
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
