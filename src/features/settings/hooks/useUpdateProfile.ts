import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SettingsService } from '../services/SettingsService'
import type { ProfileFormValues } from '../types/settings.types'

interface UseUpdateProfileReturn {
  updateProfile: (values: ProfileFormValues) => Promise<void>
  isLoading: boolean
  error: string | null
  success: boolean
}

export function useUpdateProfile(tenantId: string): UseUpdateProfileReturn {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const updateProfile = async (values: ProfileFormValues) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await SettingsService.updateProfile(tenantId, values)
      // Invalidate the tenant cache so Sidebar + TenantProvider reflect changes
      await queryClient.invalidateQueries({ queryKey: ['tenant-context'] })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('No se pudo guardar el perfil. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return { updateProfile, isLoading, error, success }
}
