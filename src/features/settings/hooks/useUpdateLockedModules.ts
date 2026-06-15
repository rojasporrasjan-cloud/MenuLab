import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SettingsService } from '../services/SettingsService'

interface UseUpdateLockedModulesReturn {
  updateLockedModules: (lockedModules: string[]) => Promise<void>
  isLoading: boolean
  error: string | null
  success: boolean
}

export function useUpdateLockedModules(tenantId: string): UseUpdateLockedModulesReturn {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const updateLockedModules = async (lockedModules: string[]): Promise<void> => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await SettingsService.updateLockedModules(tenantId, lockedModules)
      await queryClient.invalidateQueries({ queryKey: ['tenant-context'] })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('No se pudieron guardar los módulos bloqueados. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return { updateLockedModules, isLoading, error, success }
}
