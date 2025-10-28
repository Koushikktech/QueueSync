import { useState, useEffect, useCallback } from 'react'
import { QueueEntry } from '@/types/queue'
import { useRobustQueueListener } from './use-robust-queue-listener'
import { useFallbackPolling } from './use-fallback-polling'

export function useHybridQueueListener(queueId: string | null) {
  const [fallbackMode, setFallbackMode] = useState(false)
  
  // Primary: Firebase real-time listener
  const firebaseResult = useRobustQueueListener(queueId)
  
  // Fallback: Polling system
  const pollingResult = useFallbackPolling(queueId, fallbackMode)

  // Switch to fallback mode if Firebase fails consistently
  useEffect(() => {
    if (firebaseResult.error && !firebaseResult.connected) {
      const timer = setTimeout(() => {
        console.log('Switching to fallback polling mode')
        setFallbackMode(true)
      }, 10000) // Switch after 10 seconds of connection issues

      return () => clearTimeout(timer)
    } else if (firebaseResult.connected && fallbackMode) {
      console.log('Firebase reconnected, switching back from fallback mode')
      setFallbackMode(false)
    }
  }, [firebaseResult.error, firebaseResult.connected, fallbackMode])

  // Return the appropriate result based on mode
  const result = fallbackMode ? {
    ...pollingResult,
    connected: !pollingResult.error,
    previousPosition: null,
    wasJustCalled: false,
    retry: () => {
      setFallbackMode(false)
      firebaseResult.retry()
    }
  } : firebaseResult

  return {
    ...result,
    fallbackMode
  }
}