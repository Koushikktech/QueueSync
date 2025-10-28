import { useState, useEffect, useCallback } from 'react'
import { LocalQueueStorage, LocalQueueEntry } from '@/lib/local-queue-storage'
import { QueueHistory } from '@/lib/queue-history'

export function useLocalQueue() {
  const [currentQueue, setCurrentQueue] = useState<LocalQueueEntry | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing queue entry
  const checkQueue = useCallback(() => {
    const existingQueue = LocalQueueStorage.getCurrentQueueEntry()
    
    // If queue exists, check if it's still valid (not served/cancelled)
    if (existingQueue) {
      // Check if this queue was recently completed
      const recentHistory = QueueHistory.getRecentHistory()
      const wasRecentlyCompleted = recentHistory.some(entry => 
        entry.queueId === existingQueue.queueId && 
        (entry.finalStatus === 'served' || entry.finalStatus === 'cancelled')
      )
      
      if (wasRecentlyCompleted) {
        // Clear the queue if it was completed
        LocalQueueStorage.clearQueueEntry()
        setCurrentQueue(null)
      } else {
        setCurrentQueue(existingQueue)
      }
    } else {
      setCurrentQueue(null)
    }
    
    setLoading(false)
  }, [])

  // Join queue and save to local storage
  const joinQueue = useCallback(async (
    businessId: string,
    businessName: string,
    userInfo: { name: string; phone?: string; email?: string }
  ) => {
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
      
      // Save to local storage
      LocalQueueStorage.saveQueueEntry({
        queueId: result.queueId,
        businessId,
        businessName,
        userInfo
      })
      
      // Update state
      const newQueue = LocalQueueStorage.getCurrentQueueEntry()
      setCurrentQueue(newQueue)
      
      return result
    } catch (error) {
      console.error('Failed to join queue:', error)
      throw error
    }
  }, [])

  // Leave queue
  const leaveQueue = useCallback(() => {
    LocalQueueStorage.clearQueueEntry()
    setCurrentQueue(null)
  }, [])

  // Complete service (when customer is served)
  const completeService = useCallback((queueData: any) => {
    if (!currentQueue) return

    // Add to history (but don't mark as viewed yet)
    QueueHistory.addToHistory({
      queueId: currentQueue.queueId,
      businessId: currentQueue.businessId,
      businessName: currentQueue.businessName,
      userInfo: currentQueue.userInfo,
      joinedAt: currentQueue.joinedAt,
      finalStatus: 'served',
      finalPosition: queueData?.position || 1,
    })

    // Clear from local storage immediately
    LocalQueueStorage.clearQueueEntry()
    setCurrentQueue(null)

    // Don't auto-redirect, let the waitlist page handle showing completion
  }, [currentQueue])

  // Check if user is in queue
  const isInQueue = useCallback(() => {
    return LocalQueueStorage.isInQueue()
  }, [])

  // Get current queue ID
  const getCurrentQueueId = useCallback(() => {
    return LocalQueueStorage.getCurrentQueueId()
  }, [])

  // Initial check on mount
  useEffect(() => {
    checkQueue()
  }, [checkQueue])

  // Listen for storage changes (if user joins/leaves in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'queueSync_currentQueue') {
        checkQueue()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [checkQueue])

  return {
    currentQueue,
    loading,
    joinQueue,
    leaveQueue,
    completeService,
    isInQueue,
    getCurrentQueueId,
    refresh: checkQueue
  }
}