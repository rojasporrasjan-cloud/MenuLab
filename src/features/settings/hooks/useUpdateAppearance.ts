import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SettingsService } from '../services/SettingsService'
import { StorageService } from '@infrastructure/services/StorageService'
import { isFirebaseConfigured } from '@infrastructure/firebase/config'
import type { TenantAnnouncement, TenantSocials, TenantInfoFooter, TenantOrderButton, TenantBgGradient, TenantReservation, TenantPromo, TenantFeatured, ImageRounding } from '@core/domain/entities/Tenant'

const storage = new StorageService()

export interface AppearanceValues {
  templateId: string
  primaryColor: string
  backgroundColor: string
  fontFamily: string
  logoFile: File | null
  logoPreview: string | null
  coverFile: File | null
  coverPreview: string | null
  tagline: string
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
  restaurantName: string
  announcement: TenantAnnouncement
  socials: TenantSocials
  infoFooter: TenantInfoFooter
  orderButton: TenantOrderButton
  reservation: TenantReservation
  promo: TenantPromo
  featuredSection: TenantFeatured
}

export function useUpdateAppearance(tenantId: string) {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const save = async (values: AppearanceValues, _currentLogoUrl: string | null, _currentCoverUrl: string | null) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      let logoUrl: string | null
      let coverUrl: string | null

      if (isFirebaseConfigured) {
        if (values.logoFile) {
          const { getUrl } = storage.upload(tenantId, 'images', values.logoFile)
          logoUrl = await getUrl()
        } else {
          logoUrl = values.logoPreview
        }

        if (values.coverFile) {
          const { getUrl } = storage.upload(tenantId, 'images', values.coverFile)
          coverUrl = await getUrl()
        } else {
          coverUrl = values.coverPreview
        }
      } else {
        logoUrl = values.logoPreview
        coverUrl = values.coverPreview
      }

      await SettingsService.updateAppearance(tenantId, values.templateId, {
        name: values.restaurantName.trim() || '',
        primaryColor: values.primaryColor,
        backgroundColor: values.backgroundColor,
        fontFamily: values.fontFamily,
        logoUrl,
        coverImageUrl: coverUrl,
        tagline: values.tagline.trim() || null,
        cardStyle: values.cardStyle,
        coverOpacity: values.coverOpacity,
        textScale: values.textScale,
        shadowDepth: values.shadowDepth,
        heroHeight: values.heroHeight,
        showPrices: values.showPrices,
        showDietaryBadges: values.showDietaryBadges,
        imageRounding: values.imageRounding,
        showSearch: values.showSearch,
        bgGradient: values.bgGradient,
        detailsCardStyle: values.detailsCardStyle,
        detailsCardOptionStyle: values.detailsCardOptionStyle,
        detailsCardShowImage: values.detailsCardShowImage,
        announcement: values.announcement,
        socials: values.socials,
        infoFooter: values.infoFooter,
        orderButton: values.orderButton,
        reservation: values.reservation,
        promo: values.promo,
        featuredSection: values.featuredSection,
      })

      await queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] })
      await queryClient.invalidateQueries({ queryKey: ['tenant-context'] })
      setSuccess(true)
    } catch (err) {
      console.error("Error updating appearance config in Firestore:", err)
      setError('No se pudo guardar la apariencia. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return { save, isLoading, error, success }
}
