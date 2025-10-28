import { useState, useEffect, useCallback, useRef } from 'react'
import { QueueEntry } from '@/types/queue'

export function useFallbackPolling(queueId: string | null, enabled: boolean = false) {
  const [queueData, setQueueData] = useState<QueueEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRef = useRef(false)

  const fetchQueueStatus = useCallback(async () => {
    if (!queueId || !enabled) return

    try {
      setError(null)
      const response = await fetch(`/api/queue/status/${queueId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setQueueData(null)
          setError('Queue entry not found')
          return
        }
        throw new Error('Failed to fetch queue status')
      }
      
      const data: QueueEntry = await response.json()
      
      // Convert joinedAt to Date if it's a string
      if (typeof data.joinedAt === 'string') {
        data.joinedAt = new Date(data.joinedAt)
      }
      
      setQueueData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch queue status'
      setError(errorMessage)
      console.error('Polling error:', err)
    }
  }, [queueId, enabled])

  // Start/stop polling based on enabled state
  useEffect(() => {
    if (!enabled || !queueId) {
      // Clear polling when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      isActiveRef.current = false
      return
    }

    // Start polling
    isActiveRef.current = true
    setLoading(true)
    
    // Initial fetch
    fetchQueueStatus().finally(() => setLoading(false))
    
    // Set up polling interval (every 10 seconds)
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        fetchQueueStatus()
      }
    }, 10000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      isActiveRef.current = false
    }
  }, [enabled, queueId, fetchQueueStatus])

  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && enabled && queueId && isActiveRef.current) {
        fetchQueueStatus()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enabled, queueId, fetchQueueStatus])

  return {
    queueData,
    loading,
    error,
    refresh: fetchQueueStatus
  }
}