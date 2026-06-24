import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import type { ProfileFormValues, BrandingFormValues } from '../types/settings.types'
import type { TenantAnnouncement, TenantSocials, TenantInfoFooter, TenantOrderButton, TenantBgGradient, TenantReservation, TenantPromo, TenantFeatured, ImageRounding } from '@core/domain/entities/Tenant'

import type { CommerceFormValues } from '../components/CommerceForm/CommerceForm'

export const SettingsService = {
  async updateProfile(tenantId: string, values: ProfileFormValues): Promise<void> {
    await updateDoc(doc(db, firestorePaths.tenant(tenantId)), {
      name: values.name,
      timezone: values.timezone,
      locale: values.locale,
      'branding.orderButton.whatsapp': values.whatsapp ?? '',
      'branding.socials.instagram': values.instagram ?? '',
      'branding.socials.facebook': values.facebook ?? '',
      'branding.socials.tiktok': values.tiktok ?? '',
      'branding.socials.enabled': !!(values.instagram || values.facebook || values.tiktok),
      'branding.infoFooter.hours': values.hours ?? '',
      'branding.infoFooter.address': values.address ?? '',
      'branding.infoFooter.phone': values.phone ?? '',
      'branding.infoFooter.wazeUrl': values.wazeUrl ?? '',
      'branding.infoFooter.googleMapsUrl': values.googleMapsUrl ?? '',
      'branding.infoFooter.sinpeNumber': values.sinpeNumber ?? '',
      'branding.infoFooter.enabled': !!(values.hours || values.address || values.phone || values.wazeUrl || values.googleMapsUrl || values.sinpeNumber),
      updatedAt: serverTimestamp(),
    })
  },

  async updateCommerce(tenantId: string, values: CommerceFormValues): Promise<void> {
    await updateDoc(doc(db, firestorePaths.tenant(tenantId)), {
      deliveryConfig: values.deliveryConfig,
      taxConfig: values.taxConfig,
      updatedAt: serverTimestamp(),
    })
  },

  async updateTemplate(tenantId: string, templateId: string): Promise<void> {
    await updateDoc(doc(db, firestorePaths.tenant(tenantId)), {
      templateId,
      updatedAt: serverTimestamp(),
    })
  },

  async updateAppearance(
    tenantId: string,
    templateId: string,
    branding: {
      name: string
      primaryColor: string
      backgroundColor: string
      fontFamily: string
      logoUrl: string | null
      coverImageUrl: string | null
      tagline: string | null
      cardStyle: 'sharp' | 'rounded' | 'pill'
      coverOpacity: number
      textScale: 'sm' | 'md' | 'lg'
      shadowDepth: 'flat' | 'soft' | 'deep'
      heroHeight: 'compact' | 'normal' | 'tall'
      showPrices: boolean
      showDietaryBadges: boolean
      imageRounding: ImageRounding
      showSearch: boolean
      bgGradient: TenantBgGradient
      detailsCardStyle: 'glass' | 'solid'
      detailsCardOptionStyle: 'list' | 'pills'
      detailsCardShowImage: boolean
      announcement: TenantAnnouncement
      socials: TenantSocials
      infoFooter: TenantInfoFooter
      orderButton: TenantOrderButton
      orderingEnabled: boolean
      reservation: TenantReservation
      promo: TenantPromo
      featuredSection: TenantFeatured
    },
  ): Promise<void> {
    await updateDoc(doc(db, firestorePaths.tenant(tenantId)), {
      name: branding.name,
      templateId,
      'branding.primaryColor': branding.primaryColor,
      'branding.backgroundColor': branding.backgroundColor,
      'branding.fontFamily': branding.fontFamily,
      'branding.logoUrl': branding.logoUrl,
      'branding.coverImageUrl': branding.coverImageUrl,
      'branding.tagline': branding.tagline ?? null,
      'branding.cardStyle': branding.cardStyle,
      'branding.coverOpacity': branding.coverOpacity,
      'branding.textScale': branding.textScale,
      'branding.shadowDepth': branding.shadowDepth,
      'branding.heroHeight': branding.heroHeight,
      'branding.showPrices': branding.showPrices,
      'branding.showDietaryBadges': branding.showDietaryBadges,
      'branding.imageRounding': branding.imageRounding,
      'branding.showSearch': branding.showSearch,
      'branding.bgGradient': branding.bgGradient,
      'branding.detailsCardStyle': branding.detailsCardStyle,
      'branding.detailsCardOptionStyle': branding.detailsCardOptionStyle,
      'branding.detailsCardShowImage': branding.detailsCardShowImage,
      'branding.announcement': branding.announcement,
      'branding.socials': branding.socials,
      'branding.infoFooter': branding.infoFooter,
      'branding.orderButton': branding.orderButton,
      'features.orderingEnabled': branding.orderingEnabled,
      'branding.reservation': branding.reservation,
      'branding.promo': branding.promo,
      'branding.featuredSection': branding.featuredSection,
      updatedAt: serverTimestamp(),
    })
  },

  /** Actualiza solo promo + infoFooter (operativo: lo puede hacer el staff). */
  async updatePromoAndHours(
    tenantId: string,
    promo: TenantPromo,
    infoFooter: TenantInfoFooter,
  ): Promise<void> {
    await updateDoc(doc(db, firestorePaths.tenant(tenantId)), {
      'branding.promo': promo,
      'branding.infoFooter': infoFooter,
      updatedAt: serverTimestamp(),
    })
  },

  async updateEmployeePin(tenantId: string, pinHash: string): Promise<void> {
    await updateDoc(doc(db, firestorePaths.tenant(tenantId)), {
      employeePinHash: pinHash,
      updatedAt: serverTimestamp(),
    })
  },

  async updateLockedModules(tenantId: string, lockedModules: string[]): Promise<void> {
    await updateDoc(doc(db, firestorePaths.tenant(tenantId)), {
      lockedModules,
      updatedAt: serverTimestamp(),
    })
  },

  async updateBranding(
    tenantId: string,
    _values: BrandingFormValues,
    logoUrl: string | null,
    coverImageUrl: string | null,
  ): Promise<void> {
    await updateDoc(doc(db, firestorePaths.tenant(tenantId)), {
      'branding.logoUrl': logoUrl,
      'branding.coverImageUrl': coverImageUrl,
      updatedAt: serverTimestamp(),
    })
  },
}
