import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { QRService } from '../services/QRService'
import { qrQueryKeys, type TableFormValues } from '../types/qr.types'

interface UseUpdateTableReturn {
  updateTable: (tableId: string, values: Partial<TableFormValues>) => Promise<void>
  isLoading: boolean
  error: string | null
}

export function useUpdateTable(tenantId: string): UseUpdateTableReturn {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTable = async (tableId: string, values: Partial<TableFormValues>) => {
    setIsLoading(true)
    setError(null)

    try {
      await QRService.updateTable(tenantId, tableId, values)
      await queryClient.invalidateQueries({ queryKey: qrQueryKeys.tables(tenantId) })
    } catch {
      setError('Error al actualizar la mesa. Intenta de nuevo.')
      throw new Error('Update failed')
    } finally {
      setIsLoading(false)
    }
  }

  return { updateTable, isLoading, error }
}
