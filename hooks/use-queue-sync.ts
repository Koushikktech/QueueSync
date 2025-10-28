import { useState, useEffect, useCallback } from 'react'

interface QueueSyncData {
  businessId: string
  queueLength: number
  estimatedWaitTime: number
  totalServedToday: number
  waiting: any[]
  called: any[]
  served: any[]
  lastUpdated: string
  businessInfo: {
    name: string
    isOpen: boolean
    averageServiceTime: number
  }
}

export function useQueueSync(businessId: string) {
  const [data, setData] = useState<QueueSyncData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/queue/sync?businessId=${businessId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch queue data')
      }
      
      const syncData = await response.json()
      setData(syncData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync queue data'
      setError(errorMessage)
      console.error('Queue sync error:', err)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  const updateQueueEntry = useCallback(async (queueId: string, action: 'call' | 'serve' | 'cancel') => {
    try {
      const response = await fetch('/api/queue/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queueId,
          action,
          businessId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} queue entry`)
      }

      // Refresh data after update
      await fetchData()
      
      return true
    } catch (err) {
      console.error(`Error ${action}ing queue entry:`, err)
      throw err
    }
  }, [businessId, fetchData])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Listen for visibility changes to refresh when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    updateQueueEntry
  }
}