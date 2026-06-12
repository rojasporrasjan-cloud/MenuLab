/**
 * seed-admin.mjs
 * Popula Firestore con el menú completo de Soda Rústica de Sarchí usando el Admin SDK.
 * Uso: node scripts/seed-admin.mjs <tenantId> "<restaurantName>"
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ─── Cargar credenciales administrativas ──────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
const keyPath = resolve(__dirname, '../key.json')
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'))

initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore()

// ─── Constantes ───────────────────────────────────────────────────────────────

const TENANT_ID = process.argv[2] || 'rustica-de-sarchi'
const TENANT_NAME = process.argv[3] || 'Soda Rústica de Sarchí'
const MENU_ID   = 'menu-principal'
const NOW       = Timestamp.now()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newId() {
  return db.collection('_').doc().id
}

function dish(categoryId, name, amount, description = null, sortOrder = 0) {
  const id = newId()
  return {
    id,
    tenantId:    TENANT_ID,
    menuId:      '', // Se sobreescribe al guardar
    categoryId,
    name,
    description,
    price:       { amount, currency: 'CRC' },
    status:      'available',
    assets: {
      imageUrl:     null,
      thumbnailUrl: null,
      modelGlbUrl:  null,
      modelUsdzUrl: null,
      hasAR:        false,
    },
    nutrition: {
      calories:     null,
      allergens:    [],
      isVegetarian: false,
      isVegan:      false,
      isGlutenFree: false,
    },
    tags:      [],
    sortOrder,
    createdAt: NOW,
    updatedAt: NOW,
  }
}

// ─── Datos del menú ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: 'sandwiches',        name: 'Sándwiches' },
  { slug: 'empanadas',         name: 'Empanadas' },
  { slug: 'platos-fuertes',    name: 'Platos Fuertes' },
  { slug: 'pollo-frito',       name: 'Pollo Frito y Más' },
  { slug: 'hamburguesas',      name: 'Hamburguesas' },
  { slug: 'casados',           name: 'Casados' },
  { slug: 'ordenes-casados',   name: 'Órdenes Adicionales' },
  { slug: 'otras-delicias',    name: 'Otras Delicias' },
  { slug: 'arroces',           name: 'Arroces' },
  { slug: 'ordenes',           name: 'Órdenes' },
  { slug: 'tacos',             name: 'Tacos y Especialidades' },
  { slug: 'gallo-pinto',       name: 'Gallo Pinto' },
  { slug: 'ordenes-pinto',     name: 'Órdenes Adicionales (Pinto)' },
  { slug: 'refrescos',         name: 'Refrescos' },
  { slug: 'bebidas-calientes', name: 'Bebidas Calientes' },
  { slug: 'bebidas-frias',     name: 'Bebidas Frías' },
  { slug: 'batidos',           name: 'Batidos' },
  { slug: 'naturales',         name: 'Naturales' },
  { slug: 'combos-pollo',      name: 'Combos de Pollo Frito' },
]

const catId = {}
for (const cat of CATEGORIES) {
  catId[cat.slug] = newId()
}

const DISHES = [
  // Sándwiches
  dish(catId['sandwiches'], 'Sándwich de carne',             2500, null, 0),
  dish(catId['sandwiches'], 'Sándwich de jamón y queso',     2500, null, 1),
  dish(catId['sandwiches'], 'Sándwich especial',             3000, null, 2),
  dish(catId['sandwiches'], 'Sándwich de pechuga a la plancha',  3000, null, 3),
  dish(catId['sandwiches'], 'Sándwich de pechuga empanizada', 3000, null, 4),
  dish(catId['sandwiches'], 'Papitas adicionales',            500, 'Agréguele a cualquier sándwich', 5),

  // Empanadas
  dish(catId['empanadas'], 'Empanada de carne o pollo',  1200, null, 0),
  dish(catId['empanadas'], 'Empanada de queso o frijol', 1200, null, 1),
  dish(catId['empanadas'], 'Empanada arreglada',         1600, null, 2),

  // Platos Fuertes
  dish(catId['platos-fuertes'], 'Filete de pescado',                           3800, null,  0),
  dish(catId['platos-fuertes'], 'Fajitas de pescado',                          3800, null,  1),
  dish(catId['platos-fuertes'], 'Camarones empanizados',                       4500, 'Con papas y ensalada', 2),
  dish(catId['platos-fuertes'], 'Bistec',                                      3700, null,  3),
  dish(catId['platos-fuertes'], 'Bistec con arroz',                            4000, null,  4),
  dish(catId['platos-fuertes'], 'Chuleta de cerdo',                            3500, null,  5),
  dish(catId['platos-fuertes'], 'Pechuga a la plancha',                        3800, null,  6),
  dish(catId['platos-fuertes'], 'Chuleta ahumada',                             3500, null,  7),
  dish(catId['platos-fuertes'], 'Cordon Blue',                                 4500, null,  8),
  dish(catId['platos-fuertes'], 'Chifrijo',                                    3500, null,  9),
  dish(catId['platos-fuertes'], 'Fajitas de pollo con olores',                 4200, null, 10),
  dish(catId['platos-fuertes'], 'Bistec en salsa',                             3800, null, 11),
  dish(catId['platos-fuertes'], 'Pechuga suiza',                               4500, 'Con papas y ensalada', 12),

  // Pollo Frito y Más
  dish(catId['pollo-frito'], 'Pollo — cuarto y muslo',        1800, null,  0),
  dish(catId['pollo-frito'], 'Pollo — pechuga y ala',         2300, null,  1),
  dish(catId['pollo-frito'], 'Fajitas de pollo',              4000, null,  2),
  dish(catId['pollo-frito'], 'Nachos de pollo o carne',       4000, null,  3),
  dish(catId['pollo-frito'], 'Nachos mixtos',                 4000, null,  4),
  dish(catId['pollo-frito'], 'Papanachos',                    4000, null,  5),
  dish(catId['pollo-frito'], 'Hot Dog',                       1200, null,  6),
  dish(catId['pollo-frito'], 'Hot Dog con papas',             1600, null,  7),
  dish(catId['pollo-frito'], 'Salchipapas',                   2500, null,  8),
  dish(catId['pollo-frito'], 'Aros de cebolla',               2000, null,  9),
  dish(catId['pollo-frito'], 'Torta casera en tortilla',      2000, null, 10),
  dish(catId['pollo-frito'], 'Torta casera en pan',           2200, null, 11),
  dish(catId['pollo-frito'], 'Torta de huevo',                1100, null, 12),
  dish(catId['pollo-frito'], 'Papas fritas grandes',          2100, null, 13),
  dish(catId['pollo-frito'], 'Papas fritas medianas',         1800, null, 14),
  dish(catId['pollo-frito'], 'Papas fritas pequeñas',         1600, null, 15),
  dish(catId['pollo-frito'], 'Yuca nachos',                   4500, null, 16),
  dish(catId['pollo-frito'], 'Torta de yuca',                  600, null, 17),
  dish(catId['pollo-frito'], 'Casado + Tropical o Pepsi',     3800, 'Promoción Especial', 18),

  // Hamburguesas
  dish(catId['hamburguesas'], 'Sencilla (queso y jamón)',                    2000, null,  0),
  dish(catId['hamburguesas'], 'Sencilla con papas',                         2700, null,  1),
  dish(catId['hamburguesas'], 'Quesoburguesa',                              2000, null,  2),
  dish(catId['hamburguesas'], 'Quesoburguesa con papas',                    2700, null,  3),
  dish(catId['hamburguesas'], 'Especial',                                   3200, 'Dos tortas, dos quesos, dos jamones', 4),
  dish(catId['hamburguesas'], 'Especial con papas',                         3500, 'Dos tortas, dos quesos, dos jamones', 5),
  dish(catId['hamburguesas'], 'Polloburguesa sencilla',                     2000, null,  6),
  dish(catId['hamburguesas'], 'Polloburguesa con papas',                    2700, null,  7),
  dish(catId['hamburguesas'], 'Polloburguesa especial',                     3200, null,  8),
  dish(catId['hamburguesas'], 'Polloburguesa especial con papas',           3500, null,  9),
  dish(catId['hamburguesas'], 'Con pechuga de pollo empanizada',             3000, null, 10),
  dish(catId['hamburguesas'], 'Con pechuga de pollo empanizada y papas',     3500, null, 11),
  dish(catId['hamburguesas'], 'Con torta casera',                           2000, null, 12),
  dish(catId['hamburguesas'], 'Con torta casera y papas',                   2700, null, 13),
  dish(catId['hamburguesas'], 'Rústica con carne ANGUS',                    3000, null, 14),
  dish(catId['hamburguesas'], 'Rústica con carne ANGUS con papas',            3500, null, 15),

  // Casados
  dish(catId['casados'], 'Casado con bistec',                3000, null, 0),
  dish(catId['casados'], 'Casado con chuleta',               3000, null, 1),
  dish(catId['casados'], 'Casado con pollo frito (cuarto)',  3000, null, 2),
  dish(catId['casados'], 'Casado con chuleta ahumada',       3000, null, 3),
  dish(catId['casados'], 'Casado con filet de pescado',      3000, null, 4),
  dish(catId['casados'], 'Casado con pechuga a la plancha',  3200, null, 5),
  dish(catId['casados'], 'Casado con pechuga de pollo',      3200, null, 6),
  dish(catId['casados'], 'Casado con carne en salsa',        3000, null, 7),
  dish(catId['casados'], 'Casado para llevar',               3200, null, 8),

  // Órdenes Adicionales (Casados)
  dish(catId['ordenes-casados'], 'Arroz extra',    600, null, 0),
  dish(catId['ordenes-casados'], 'Frijoles extra', 600, null, 1),
  dish(catId['ordenes-casados'], 'Ensalada extra', 600, null, 2),

  // Otras Delicias
  dish(catId['otras-delicias'], 'Gallo de salchichón',          2000, null, 0),
  dish(catId['otras-delicias'], 'Salchichón en pan',            2200, null, 1),
  dish(catId['otras-delicias'], 'Burrito grande (pollo o carne)', 3000, null, 2),
  dish(catId['otras-delicias'], 'Tortilla de queso',            2300, null, 3),

  // Arroces
  dish(catId['arroces'], 'Camarones con arroz (entero)', 5200, 'Con papas y ensalada', 0),
  dish(catId['arroces'], 'Arroz con camarones (medio)',  3700, 'Con papas y ensalada', 1),
  dish(catId['arroces'], 'Arroz cantones (entero)',      3700, 'Con papas y ensalada', 2),
  dish(catId['arroces'], 'Arroz cantones (medio)',       3000, 'Con papas y ensalada', 3),
  dish(catId['arroces'], 'Arroz con pollo (entero)',     3700, 'Con papas y ensalada', 4),
  dish(catId['arroces'], 'Arroz con pollo (medio)',      3000, 'Con papas y ensalada', 5),

  // Órdenes
  dish(catId['ordenes'], 'Orden de enyucados',         2500, null, 0),
  dish(catId['ordenes'], 'Patacones',                  2500, null, 1),
  dish(catId['ordenes'], 'Deditos de queso',           2500, null, 2),
  dish(catId['ordenes'], 'Quesadillas',                3000, null, 3),
  dish(catId['ordenes'], 'Palitos de yuca',            2500, null, 4),
  dish(catId['ordenes'], 'Canastas de camarón (3 ud)', 4500, null, 5),

  // Tacos y Especialidades
  dish(catId['tacos'], 'Samuray 4X4',                  2000, null,  0),
  dish(catId['tacos'], 'Samuray 4X4 con papas',        2500, null,  1),
  dish(catId['tacos'], 'Taco de maíz',                 2000, null,  2),
  dish(catId['tacos'], 'Taco de maíz con papas',       2700, null,  3),
  dish(catId['tacos'], 'Taco de harina',               2000, null,  4),
  dish(catId['tacos'], 'Taco de harina con papas',     2700, null,  5),
  dish(catId['tacos'], 'Cartucho de maíz',             1500, null,  6),
  dish(catId['tacos'], 'Cartucho de maíz con papas',   2000, null,  7),
  dish(catId['tacos'], 'Cartucho de harina',           1500, null,  8),
  dish(catId['tacos'], 'Cartucho de harina con papas', 2000, null,  9),
  dish(catId['tacos'], 'Encaramado',                   2700, null, 10),
  dish(catId['tacos'], 'Encaramado con papas',         3200, null, 11),
  dish(catId['tacos'], 'Súper Rústico',                2700, null, 12),
  dish(catId['tacos'], 'Súper Rústico con papas',      3200, null, 13),
  dish(catId['tacos'], 'Taco de yuca',                 2200, null, 14),
  dish(catId['tacos'], 'Taco de yuca con papas',       3000, null, 15),

  // Gallo Pinto
  dish(catId['gallo-pinto'], 'Gallo Pinto con chuleta',             2800, null,  0),
  dish(catId['gallo-pinto'], 'Gallo Pinto con huevo',               2000, null,  1),
  dish(catId['gallo-pinto'], 'Gallo Pinto con 2 huevos',            2500, null,  2),
  dish(catId['gallo-pinto'], 'Gallo Pinto con salchichón',          2000, null,  3),
  dish(catId['gallo-pinto'], 'Gallo Pinto con queso',               2000, null,  4),
  dish(catId['gallo-pinto'], 'Gallo Pinto con pollo a la plancha',  2700, null,  5),
  dish(catId['gallo-pinto'], 'Gallo Pinto con carne en salsa y huevo', 3200, null, 6),
  dish(catId['gallo-pinto'], 'Gallo Pinto con carne en salsa',      3000, null,  7),
  dish(catId['gallo-pinto'], 'Gallo Pinto con bistec',              3200, null,  8),
  dish(catId['gallo-pinto'], 'Gallo Pinto Rústico',                 3200, null,  9),

  // Órdenes Adicionales (Pinto)
  dish(catId['ordenes-pinto'], 'Queso extra',          500,  null, 0),
  dish(catId['ordenes-pinto'], 'Natilla',              300,  null, 1),
  dish(catId['ordenes-pinto'], 'Plátano maduro',       200,  null, 2),
  dish(catId['ordenes-pinto'], 'Tostadas',             500,  null, 3),
  dish(catId['ordenes-pinto'], 'Huevo con tomate',    1000,  null, 4),

  // Refrescos
  dish(catId['refrescos'], 'Pepsi / Pepsi Zero 350ml',                   800, null,  0),
  dish(catId['refrescos'], 'Evervess (Gin, Soda, Agua Mineral) 350ml',   800, null,  1),
  dish(catId['refrescos'], '7Up 350ml',                                   800, null,  2),
  dish(catId['refrescos'], 'Pepsi / Pepsi Zero 600ml',                  1200, null,  3),
  dish(catId['refrescos'], 'Evervess (Gin) 600ml',                      1200, null,  4),
  dish(catId['refrescos'], '7Up 600ml',                                  1200, null,  5),
  dish(catId['refrescos'], 'Mirinda 600ml',                             1200, null,  6),
  dish(catId['refrescos'], 'H2OH (Lima Limón, Toronja) 600ml',          1200, null,  7),
  dish(catId['refrescos'], 'Milory 355ml',                              1200, null,  8),
  dish(catId['refrescos'], 'Pepsi / Pepsi Zero 1.5L',                   1600, null,  9),
  dish(catId['refrescos'], 'Pepsi / Pepsi Zero 2.5L',                   2300, null, 10),
  dish(catId['refrescos'], '7Up 2.5L',                                  2300, null, 11),
  dish(catId['refrescos'], 'Tropical 355ml',                             800, 'Blanco Arándanos, Frutas Tropicales, Té Melocotón, Frutas', 12),
  dish(catId['refrescos'], 'Tropical 500ml',                            1200, 'Blanco Arándanos, Frutas Tropicales, Té Melocotón, Frutas', 13),
  dish(catId['refrescos'], 'Tropical 2.5L',                             2300, 'Blanco Arándanos, Té Melocotón, Frutas', 14),
  dish(catId['refrescos'], 'Gatorade Berry Blue 600ml',                 1500, null, 15),
  dish(catId['refrescos'], 'Maxxx Energy 350ml',                        2000, null, 16),
  dish(catId['refrescos'], 'Agua Cristal 600ml',                         800, null, 17),
  dish(catId['refrescos'], 'Vitaloe',                                   1500, null, 18),

  // Bebidas Calientes
  dish(catId['bebidas-calientes'], 'Café negro',         700, null, 0),
  dish(catId['bebidas-calientes'], 'Café con leche',     800, null, 1),
  dish(catId['bebidas-calientes'], 'Té negro',           700, null, 2),
  dish(catId['bebidas-calientes'], 'Té con leche',       800, null, 3),
  dish(catId['bebidas-calientes'], 'Chocolate',          800, null, 4),
  dish(catId['bebidas-calientes'], 'Aguadulce negro',    700, null, 5),
  dish(catId['bebidas-calientes'], 'Aguadulce con leche',800, null, 6),

  // Bebidas Frías
  dish(catId['bebidas-frias'], 'Gaseosa envase vidrio 355ml', 800,  null, 0),
  dish(catId['bebidas-frias'], 'Desechable 500ml',           1200,  null, 1),
  dish(catId['bebidas-frias'], 'Desechable 2.5L',            2300,  null, 2),

  // Batidos
  dish(catId['batidos'], 'Batido en agua',  1000, null, 0),
  dish(catId['batidos'], 'Batido en leche', 1500, null, 1),

  // Naturales
  dish(catId['naturales'], 'Jugos naturales',    700, null, 0),
  dish(catId['naturales'], 'Jugo de naranja',    800, null, 1),

  // Combos de Pollo Frito
  dish(catId['combos-pollo'], 'Combo Rústico',                    2800, '2 pzs pollo + papas fritas + refresco vidrio 355ml',           0),
  dish(catId['combos-pollo'], 'Combo 13 piezas',                 16000, '13 piezas + papas + refresco 2.5L',                            1),
  dish(catId['combos-pollo'], 'Combo 5 cuartos y muslos',        10000, '5 porciones cuarto y muslo + Pepsi 1.5L',                      2),
  dish(catId['combos-pollo'], 'Pechuga y muslo / cuarto + papas', 3100, 'Con papas + refresco vidrio 355ml',                            3),
]

const TENANT_DOC = {
  id:     TENANT_ID,
  slug:   TENANT_ID,
  name:   TENANT_NAME,
  plan:   'pro',
  status: 'active',
  templateId: 'warm-bistro',
  branding: {
    primaryColor:    '#7c4a27', // Marrón cálido del logotipo
    backgroundColor: '#fdf6ec', // Beige cálido del fondo del logotipo
    fontFamily:      'Outfit',
    logoUrl:         null,
    coverImageUrl:   null,
    tagline:         'Soda Rústica de Sarchí 🍽️',
    cardStyle:       'rounded',
    coverOpacity:    0.7,
    textScale:       'md',
    shadowDepth:     'soft',
    heroHeight:      'normal',
    showPrices:      true,
    showDietaryBadges: false,
    imageRounding:   'lg',
    showSearch:      true,
    bgGradient: {
      enabled:   false,
      from:      '#fdf6ec',
      to:        '#faf0dd',
      direction: '180deg',
    },
    announcement: {
      enabled: true,
      text:    'Empaques para llevar: ₡200 adicionales por cada producto',
      emoji:   '🛍️',
      bgColor: '#7c4a27',
    },
    socials: {
      enabled:   false,
      instagram: '',
      facebook:  '',
      tiktok:    '',
      whatsapp:  '',
    },
    infoFooter: {
      enabled: false,
      hours:   '',
      address: '',
      phone:   '',
    },
    orderButton: {
      enabled:  false,
      whatsapp: '',
      label:    'Ordenar por WhatsApp',
    },
    reservation: {
      enabled:      false,
      title:        '',
      phone:        '',
      bookingUrl:   '',
      buttonLabel:  '',
    },
    promo: {
      enabled:     false,
      title:       '',
      description: '',
      imageUrl:    null,
      ctaLabel:    '',
      ctaLink:     '',
    },
    featuredSection: {
      enabled: false,
      title:   '',
      dishIds: [],
    },
  },
  features: {
    arEnabled:           false,
    analyticsEnabled:    true,
    multiLanguageEnabled:false,
    loyaltyEnabled:      false,
    qrGeneratorEnabled:  true,
  },
  timezone: 'America/Costa_Rica',
  locale:   'es-CR',
  onboardingCompletedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
}

async function seed() {
  console.log('🌱 Iniciando seeding de Soda Rústica de Sarchí por Admin SDK...\n')

  // Query existing menus for this tenant to reuse the ID generated during onboarding/provisioning
  console.log('🔍 Buscando menús existentes para el tenant...')
  const menusSnap = await db.collection(`tenants/${TENANT_ID}/menus`).get()
  let activeMenuId = MENU_ID
  if (!menusSnap.empty) {
    activeMenuId = menusSnap.docs[0].id
    console.log(`   Found existing menu ID: ${activeMenuId}`)
  } else {
    console.log(`   No existing menus found, using default: ${activeMenuId}`)
  }

  // 1. Tenant
  console.log('📋 Creando tenant...')
  await db.doc(`tenants/${TENANT_ID}`).set(TENANT_DOC)
  console.log(`   ✓ tenants/${TENANT_ID}`)

  // 2. Menú
  console.log('\n📗 Creando/Actualizando menú principal...')
  const menuDoc = {
    id:            activeMenuId,
    tenantId:      TENANT_ID,
    name:          'Menú Principal',
    description:   null,
    status:        'active',
    categoryOrder: CATEGORIES.map(c => catId[c.slug]),
    schedule:      null,
    createdAt:     NOW,
    updatedAt:     NOW,
  }
  await db.doc(`tenants/${TENANT_ID}/menus/${activeMenuId}`).set(menuDoc)
  console.log(`   ✓ menus/${activeMenuId}`)

  // 3. Categorías (en batch)
  console.log(`\n🗂️  Creando ${CATEGORIES.length} categorías...`)
  const catBatch = db.batch()
  for (const [i, cat] of CATEGORIES.entries()) {
    const id  = catId[cat.slug]
    const ref = db.doc(`tenants/${TENANT_ID}/menus/${activeMenuId}/categories/${id}`)
    catBatch.set(ref, {
      id,
      tenantId:    TENANT_ID,
      menuId:      activeMenuId,
      name:        cat.name,
      description: null,
      imageUrl:    null,
      sortOrder:   i,
    })
    console.log(`   [${i + 1}/${CATEGORIES.length}] ${cat.name}`)
  }
  await catBatch.commit()
  console.log('   ✓ Categorías guardadas')

  // 4. Platos (en batches de 500 — límite de Firestore)
  console.log(`\n🍽️  Creando ${DISHES.length} platos...`)
  const BATCH_SIZE = 400
  for (let i = 0; i < DISHES.length; i += BATCH_SIZE) {
    const chunk = DISHES.slice(i, i + BATCH_SIZE)
    const batch = db.batch()
    for (const d of chunk) {
      const ref = db.doc(`tenants/${TENANT_ID}/menus/${activeMenuId}/dishes/${d.id}`)
      batch.set(ref, {
        ...d,
        menuId: activeMenuId // Override to ensure it matches the menu
      })
    }
    await batch.commit()
    console.log(`   ✓ Platos ${i + 1}–${Math.min(i + BATCH_SIZE, DISHES.length)} guardados`)
  }

  // 5. Mesa por defecto (para QR)
  console.log('\n🪑 Creando/Actualizando mesa por defecto...')
  const tableId = 'mesa-1'
  await db.doc(`tenants/${TENANT_ID}/tables/${tableId}`).set({
    id:       tableId,
    tenantId: TENANT_ID,
    menuId:   activeMenuId,
    number:   '1',
    label:    'Mesa 1',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  })
  console.log(`   ✓ tables/${tableId} (Mesa 1)`)

  console.log('\n🎉 ¡Seeding administrativo completado exitosamente!')
  console.log(`\n   Tenant:    ${TENANT_ID}`)
  console.log(`   Menú:      ${activeMenuId}`)
  console.log(`   Categorías: ${CATEGORIES.length}`)
  console.log(`   Platos:     ${DISHES.length}`)
  process.exit(0)
}

seed().catch(err => {
  console.error('\n❌ Error durante el seeding:', err)
  process.exit(1)
})
