import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { TenantMapper } from '@infrastructure/mappers/TenantMapper'
import { UserAccountService } from '@infrastructure/services/UserAccountService'
import { isFirebaseConfigured } from '@infrastructure/firebase/config'
import { useAuthContext } from '@app/providers/AuthProvider'
import { isPlatformAdminUser } from '@shared/config/platformAdmin'
import { getImpersonatedTenantId } from '@features/platform-admin'
import type { Tenant } from '@core/domain/entities/Tenant'

interface TenantContextValue {
  tenant: Tenant | null
  tenantId: string
  /** Rol del usuario autenticado en este tenant: 'owner' | 'staff' | null (público). */
  role: string | null
  isLoading: boolean
  error: Error | null
}

const TenantContext = createContext<TenantContextValue | null>(null)

interface ResolvedTenant {
  tenant: Tenant
  tenantId: string
  role: string | null
}

/**
 * En rutas públicas de menú la URL es `/{tenantId}/menu...`.
 * Resolvemos el tenant desde el primer segmento para que el menú del cliente
 * muestre el branding correcto sin depender del usuario autenticado.
 */
/** Segundos segmentos de rutas públicas con tenant en el primer segmento. */
const PUBLIC_TENANT_SEGMENTS = ['menu', 'reservar', 'sellos', 'staff'] as const

function resolveTenantIdFromPath(): string | null {
  const segments = window.location.pathname.split('/').filter(Boolean)
  const second = segments[1]
  if (segments.length >= 2 && second && (PUBLIC_TENANT_SEGMENTS as readonly string[]).includes(second)) {
    return segments[0] ?? null
  }
  return null
}

function mockTenant(tenantId: string): Tenant {
  return {
    id: tenantId,
    slug: tenantId,
    name: 'Soda La Rústica',
    ownerId: null,
    ownerEmail: null,
    plan: 'pro',
    status: 'active',
    templateId: 'dark-modern',
    branding: {
      primaryColor: '#e11d48',
      backgroundColor: '#0B0B0C',
      fontFamily: 'Inter',
      logoUrl: null,
      coverImageUrl: null,
      tagline: null,
      cardStyle: 'rounded',
      coverOpacity: 0.65,
      textScale: 'md',
      shadowDepth: 'soft',
      heroHeight: 'normal',
      showPrices: true,
      showDietaryBadges: true,
      imageRounding: 'lg',
      showSearch: false,
      bgGradient: { enabled: false, from: '#0B0B0C', to: '#1a1a2e', direction: '180deg' as const },
      announcement: { enabled: false, text: '¡Bienvenidos! Descubre nuestro menú', emoji: '🎉', bgColor: null },
      socials: { enabled: false, instagram: '', facebook: '', tiktok: '', whatsapp: '' },
      infoFooter: { enabled: false, hours: '', address: '', phone: '', wazeUrl: '', googleMapsUrl: '', sinpeNumber: '' },
      orderButton: { enabled: false, whatsapp: '', label: 'Ordenar ahora' },
      reservation: { enabled: false, title: 'Reserva tu mesa', phone: '', bookingUrl: '', buttonLabel: 'Reservar ahora' },
      promo: { enabled: false, title: '', description: '', imageUrl: null, ctaLabel: 'Ver más', ctaLink: '' },
      featuredSection: { enabled: false, title: 'Nuestros favoritos', dishIds: [] },
    },
    features: {
      arEnabled: true,
      analyticsEnabled: true,
      multiLanguageEnabled: false,
      loyaltyEnabled: false,
      qrGeneratorEnabled: true,
      orderingEnabled: true,
      reservationsEnabled: true,
    },
    timezone: 'America/Costa_Rica',
    locale: 'es-CR',
    employeePinHash: null,
    lockedModules: [],
    loyaltyConfig: {
      stampsForReward: 10,
      rewardDescription: 'Café gratis',
      stampLabel: '☕',
    },
    onboardingCompletedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

async function loadTenant(tenantId: string): Promise<Tenant> {
  if (!isFirebaseConfigured) return mockTenant(tenantId)
  const snap = await getDoc(doc(db, 'tenants', tenantId))
  if (!snap.exists()) throw new Error(`Tenant "${tenantId}" not found`)
  return TenantMapper.toDomain(snap)
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { firebaseUser, isLoading: authLoading } = useAuthContext()
  const pathTenantId = resolveTenantIdFromPath()

  // "Ver como": si el usuario es superadmin y eligió inspeccionar un restaurante,
  // resolvemos ESE tenant en lugar del suyo. Sin permiso, se ignora.
  const canImpersonate = isPlatformAdminUser(
    firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email } : null,
  )
  const impersonatedTenantId = canImpersonate ? getImpersonatedTenantId() : null

  const { data, isLoading, error } = useQuery({
    queryKey: ['tenant-context', pathTenantId, firebaseUser?.uid ?? null, impersonatedTenantId],
    // Espera a que el estado de auth se resuelva antes de elegir estrategia.
    enabled: !authLoading,
    staleTime: Infinity,
    queryFn: async (): Promise<ResolvedTenant | null> => {
      // 1. Ruta pública de menú → tenant del param de URL.
      if (pathTenantId) {
        return { tenant: await loadTenant(pathTenantId), tenantId: pathTenantId, role: null }
      }

      // 1.5. Superadmin "viendo como" otro restaurante (impersonación).
      if (impersonatedTenantId) {
        return { tenant: await loadTenant(impersonatedTenantId), tenantId: impersonatedTenantId, role: 'owner' }
      }

      // 2. Usuario autenticado → su propio restaurante (mapping users/{uid}).
      //    Se resuelve EXCLUSIVAMENTE desde su mapping; nunca se hereda un tenant
      //    ajeno. Antes había un fallback a un tenant fijo (dev) que provocaba que
      //    un usuario recién registrado (cuyo mapping aún no se había escrito) se
      //    suscribiera transitoriamente a OTRO tenant → errores 403 en el
      //    dashboard. Si no hay mapping aún, devolvemos null y se reintenta.
      if (firebaseUser) {
        const account = await UserAccountService.getForUser(firebaseUser.uid)
        if (account?.tenantId) {
          return { tenant: await loadTenant(account.tenantId), tenantId: account.tenantId, role: account.role }
        }
        return null
      }

      // 3. Sin auth y sin ruta de menú (landing/login/registro) → sin tenant.
      return null
    },
  })

  return (
    <TenantContext.Provider
      value={{
        tenant: data?.tenant ?? null,
        tenantId: data?.tenantId ?? '',
        role: data?.role ?? null,
        isLoading: authLoading || isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export function useTenantContext(): TenantContextValue {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenantContext must be used inside <TenantProvider>')
  return ctx
}
