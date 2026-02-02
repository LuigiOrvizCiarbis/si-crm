'use client'

import { useState, useEffect, useCallback } from 'react'
import { getChannels } from '@/lib/api/channels'
import { Channel } from 'pusher-js'

interface UseAccountsReturn {
  accounts: Channel[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook para obtener y gestionar cuentas/canales conectados.
 * Maneja loading, error states y cleanup automático.
 * 
 * @returns {UseAccountsReturn} Estado de cuentas con refetch capability
 */
export function useAccounts(): UseAccountsReturn {
  const [accounts, setAccounts] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const data = await getChannels()
      setAccounts(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Error desconocido al cargar cuentas')
      setError(errorMessage)
      setAccounts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const loadAccounts = async () => {
      if (!mounted) return
      await fetchAccounts()
    }

    loadAccounts()

    return () => {
      mounted = false
    }
  }, [fetchAccounts])

  return {
    accounts,
    isLoading,
    error,
    refetch: fetchAccounts,
  }
}