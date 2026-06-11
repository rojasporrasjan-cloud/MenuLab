import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import type { Tenant, TenantBranding, TenantFeatureFlags, TenantPlan, TenantStatus, TemplateId, ImageRounding, GradientDirection } from '@core/domain/entities/Tenant'

type FirestoreDoc = DocumentSnapshot | QueryDocumentSnapshot

export class TenantMapper {
  static toDomain(doc: FirestoreDoc): Tenant {
    const data = doc.data()!

    const onboarding = data['onboardingCompletedAt']

    return {
      id: doc.id,
      slug: data['slug'] as string,
      name: data['name'] as string,
      plan: data['plan'] as TenantPlan,
      status: data['status'] as TenantStatus,
      templateId: (data['templateId'] as TemplateId) ?? 'dark-modern',
      branding: {
        primaryColor: data['branding']?.primaryColor ?? '#e11d48',
        backgroundColor: data['branding']?.backgroundColor ?? '#0B0B0C',
        fontFamily: data['branding']?.fontFamily ?? 'Inter',
        logoUrl: data['branding']?.logoUrl ?? null,
        coverImageUrl: data['branding']?.coverImageUrl ?? null,
        tagline: data['branding']?.tagline ?? null,
        cardStyle: data['branding']?.cardStyle ?? 'rounded',
        coverOpacity: data['branding']?.coverOpacity ?? 0.65,
        textScale: data['branding']?.textScale ?? 'md',
        shadowDepth: data['branding']?.shadowDepth ?? 'soft',
        heroHeight: data['branding']?.heroHeight ?? 'normal',
        showPrices: data['branding']?.showPrices ?? true,
        showDietaryBadges: data['branding']?.showDietaryBadges ?? true,
        imageRounding: (data['branding']?.imageRounding as ImageRounding) ?? 'lg',
        showSearch: data['branding']?.showSearch ?? false,
        bgGradient: data['branding']?.bgGradient ?? { enabled: false, from: '#0B0B0C', to: '#1a1a2e', direction: '180deg' as GradientDirection },
        announcement: data['branding']?.announcement ?? { enabled: false, text: '¡Bienvenidos! Descubre nuestro menú', emoji: '🎉', bgColor: null },
        socials: data['branding']?.socials ?? { enabled: false, instagram: '', facebook: '', tiktok: '', whatsapp: '' },
        infoFooter: data['branding']?.infoFooter ?? { enabled: false, hours: '', address: '', phone: '' },
        orderButton: data['branding']?.orderButton ?? { enabled: false, whatsapp: '', label: 'Ordenar ahora' },
        reservation: data['branding']?.reservation ?? { enabled: false, title: 'Reserva tu mesa', phone: '', bookingUrl: '', buttonLabel: 'Reservar ahora' },
        promo: data['branding']?.promo ?? { enabled: false, title: '', description: '', imageUrl: null, ctaLabel: 'Ver más', ctaLink: '' },
        featuredSection: data['branding']?.featuredSection ?? { enabled: false, title: 'Nuestros favoritos', dishIds: [] },
        detailsCardStyle: data['branding']?.detailsCardStyle ?? 'glass',
        detailsCardOptionStyle: data['branding']?.detailsCardOptionStyle ?? 'list',
        detailsCardShowImage: data['branding']?.detailsCardShowImage ?? true,
      } as TenantBranding,
      features: data['features'] as TenantFeatureFlags,
      timezone: data['timezone'] as string,
      locale: data['locale'] as string,
      onboardingCompletedAt:
        onboarding && typeof onboarding.toDate === 'function' ? (onboarding.toDate() as Date) : null,
      employeePinHash: (data['employeePinHash'] as string | null) ?? null,
      createdAt: data['createdAt'].toDate() as Date,
      updatedAt: data['updatedAt'].toDate() as Date,
    }
  }
}
