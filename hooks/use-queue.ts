import { useState, useEffect, useCallback } from 'react'
import { QueueEntry } from '@/types/queue'
import { QueueService } from '@/lib/queue-service'

export function useQueue(businessId?: string) {
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Subscribe to queue updates
  useEffect(() => {
    if (!businessId) return

    const unsubscribe = QueueService.subscribeToQueue(businessId, (entries) => {
      setQueueEntries(entries)
    })

    return unsubscribe
  }, [businessId])

  // Join queue
  const joinQueue = useCallback(async (
    businessId: string, 
    userInfo: { name: string; phone?: string; email?: string; partySize?: number }
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/queue/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessId, userInfo })
      })
      
      if (!response.ok) {
        throw new Error('Failed to join queue')
      }
      
      const result = await response.json()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join queue'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Get queue status
  const getQueueStatus = useCallback(async (queueId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/queue/status/${queueId}`)
      
      if (!response.ok) {
        throw new Error('Failed to get queue status')
      }
      
      const queueStatus = await response.json()
      return queueStatus
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get queue status'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    queueEntries,
    loading,
    error,
    joinQueue,
    getQueueStatus
  }
}