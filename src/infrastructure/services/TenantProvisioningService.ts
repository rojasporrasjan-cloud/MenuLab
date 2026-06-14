import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { auth } from '@infrastructure/firebase/auth'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { isFirebaseConfigured } from '@infrastructure/firebase/config'
import { uniqueSlug } from '@shared/utils/slug'
import type { TenantPlan, TemplateId } from '@core/domain/entities/Tenant'

/** Branding inicial derivado de la plantilla elegida (o la default desde cero). */
export interface TenantBrandingSeed {
  readonly templateId: TemplateId
  readonly primaryColor: string
  readonly backgroundColor: string
  readonly fontFamily: string
}

export interface ProvisionTenantInput {
  readonly restaurantName: string
  readonly branding: TenantBrandingSeed
  readonly plan?: TenantPlan
  readonly timezone?: string
  readonly locale?: string
}

export interface ProvisionTenantResult {
  readonly tenantId: string
  readonly slug: string
}

const DEFAULTS = {
  plan: 'free',
  timezone: 'America/Costa_Rica',
  locale: 'es-CR',
} as const

const DEFAULT_MENU_NAME = 'Menú principal'
const DEFAULT_CATEGORY_NAME = 'Platos principales'
// El menú público usa `mesa-1` por defecto cuando no hay `?tableId` en la URL,
// así que creamos esa mesa para que el dueño pueda previsualizar de inmediato.
const DEFAULT_TABLE_ID = 'mesa-1'
const DEFAULT_TABLE_NUMBER = '1'

function isPaidPlan(plan: TenantPlan): boolean {
  return plan === 'pro' || plan === 'enterprise'
}

/**
 * Provisiona un nuevo restaurante (tenant) tras el registro, **del lado del
 * cliente** — sin depender de Cloud Functions (plan Spark / gratis).
 *
 * Crea de forma secuencial: el documento del tenant (con el usuario como
 * `ownerId`), su `members/{uid}` con rol owner, el mapping `users/{uid}` →
 * tenantId, y un menú + categoría por defecto para que el panel no inicie vacío.
 *
 * Las reglas de Firestore permiten este bootstrap solo cuando el usuario se
 * crea a sí mismo como owner del tenant que está creando (aislamiento
 * multi-tenant sigue intacto: nadie puede unirse a un tenant ajeno).
 */
export const TenantProvisioningService = {
  async provision(input: ProvisionTenantInput): Promise<ProvisionTenantResult> {
    const slug = uniqueSlug(input.restaurantName)
    const tenantId = slug // el slug es estable y único → sirve como ID del tenant

    if (!isFirebaseConfigured) {
      // Dev sin Firebase: simula la provisión.
      return { tenantId, slug }
    }

    const user = auth?.currentUser
    if (!user) {
      throw new Error('Debes iniciar sesión antes de crear el restaurante.')
    }

    const plan = input.plan ?? DEFAULTS.plan
    const timezone = input.timezone ?? DEFAULTS.timezone
    const locale = input.locale ?? DEFAULTS.locale
    const now = serverTimestamp()
    const paid = isPaidPlan(plan)

    // ── 1. Tenant doc (ownerId === uid habilita el bootstrap en las reglas) ───
    await setDoc(doc(db, firestorePaths.tenant(tenantId)), {
      id: tenantId,
      slug,
      name: input.restaurantName.trim(),
      status: 'active',
      plan,
      ownerId: user.uid,
      ownerEmail: user.email ?? null,
      templateId: input.branding.templateId,
      timezone,
      locale,
      branding: {
        primaryColor: input.branding.primaryColor,
        backgroundColor: input.branding.backgroundColor,
        fontFamily: input.branding.fontFamily,
        logoUrl: null,
        coverImageUrl: null,
        orderButton: { enabled: true, whatsapp: '', label: 'Ordenar ahora' },
        infoFooter: { enabled: true, hours: '', address: '', phone: '', wazeUrl: '', googleMapsUrl: '', sinpeNumber: '' },
      },
      features: {
        arEnabled: paid,
        analyticsEnabled: true,
        multiLanguageEnabled: paid,
        loyaltyEnabled: plan === 'enterprise',
        qrGeneratorEnabled: true,
        orderingEnabled: true, // Habilitado para todos los planes por defecto
        reservationsEnabled: paid,
      },
      onboardingCompletedAt: null,
      createdAt: now,
      updatedAt: now,
    })

    // ── 2. Owner membership (las reglas validan ownerId === uid del tenant) ───
    await setDoc(doc(db, firestorePaths.member(tenantId, user.uid)), {
      id: user.uid,
      email: user.email ?? '',
      role: 'owner',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })

    // ── 3. users/{uid} → tenantId (lo lee TenantProvider para resolver tenant) ─
    await setDoc(doc(db, firestorePaths.userAccount(user.uid)), {
      tenantId,
      role: 'owner',
      createdAt: now,
      updatedAt: now,
    })

    // ── 4. Menú + categoría por defecto (el usuario ya es member → permitido) ─
    const menuRef = doc(collection(db, firestorePaths.menus(tenantId)))
    const categoryRef = doc(collection(db, firestorePaths.categories(tenantId, menuRef.id)))

    await setDoc(categoryRef, {
      id: categoryRef.id,
      tenantId,
      menuId: menuRef.id,
      name: DEFAULT_CATEGORY_NAME,
      description: '',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    })

    await setDoc(menuRef, {
      id: menuRef.id,
      tenantId,
      name: DEFAULT_MENU_NAME,
      description: '',
      status: 'active',
      sortOrder: 0,
      categoryOrder: [categoryRef.id],
      createdAt: now,
      updatedAt: now,
    })

    // ── 5. Mesa por defecto → el menú público resuelve sin generar QR aún ─────
    await setDoc(doc(db, firestorePaths.table(tenantId, DEFAULT_TABLE_ID)), {
      id: DEFAULT_TABLE_ID,
      tenantId,
      menuId: menuRef.id,
      number: DEFAULT_TABLE_NUMBER,
      label: null,
      status: 'active',
      qrCodeUrl: null,
      qrMenuUrl: null,
      qrGeneratedAt: null,
      createdAt: now,
    })

    return { tenantId, slug }
  },
}
