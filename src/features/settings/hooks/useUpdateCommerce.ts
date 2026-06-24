import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SettingsService } from '../services/SettingsService'
import type { CommerceFormValues } from '../components/CommerceForm/CommerceForm'

interface UseUpdateCommerceReturn {
  updateCommerce: (values: CommerceFormValues) => Promise<void>
  isLoading: boolean
  error: string | null
  success: boolean
}

export function useUpdateCommerce(tenantId: string): UseUpdateCommerceReturn {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const updateCommerce = async (values: CommerceFormValues) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await SettingsService.updateCommerce(tenantId, values)
      await queryClient.invalidateQueries({ queryKey: ['tenant-context'] })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('No se pudo guardar la configuración de comercio. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return { updateCommerce, isLoading, error, success }
}
