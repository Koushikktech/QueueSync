import { useState, useEffect, useCallback, useRef } from 'react'
import { QueueEntry } from '@/types/queue'
import { LocalQueueStorage } from '@/lib/local-queue-storage'
import { QueueHistory } from '@/lib/queue-history'
import { notificationSound } from '@/lib/notification-sound'

interface QueueUpdate {
  position: number
  estimatedWaitTime: number
  status: 'waiting' | 'called' | 'served' | 'cancelled'
  queueLength: number
}

export function useRealTimeQueue(queueId: string | null) {
  const [queueData, setQueueData] = useState<QueueEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previousPosition, setPreviousPosition] = useState<number | null>(null)
  const [wasJustCalled, setWasJustCalled] = useState(false)
  
  const notificationShownRef = useRef(false)

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    notificationSound.play()
  }, [])

  // Show browser notification
  const showNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      })
    }
  }, [])

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }, [])

  // Fetch queue status
  const fetchQueueStatus = useCallback(async () => {
    if (!queueId) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/queue/status/${queueId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          // Queue entry not found, might have been removed
          LocalQueueStorage.clearQueueEntry()
          setQueueData(null)
          return
        }
        throw new Error('Failed to fetch queue status')
      }
      
      const data: QueueEntry = await response.json()
      
      // Convert joinedAt to Date if it's a string
      if (typeof data.joinedAt === 'string') {
        data.joinedAt = new Date(data.joinedAt)
      }
      
      // Check for position changes and status updates
      if (queueData) {
        const oldPosition = queueData.position
        const newPosition = data.position
        const oldStatus = queueData.status
        const newStatus = data.status
        
        // Position improved (moved up in queue)
        if (oldPosition > newPosition) {
          setPreviousPosition(oldPosition)
          
          // If they're now #1, show special notification
          if (newPosition === 1 && !notificationShownRef.current) {
            playNotificationSound()
            showNotification(
              'You\'re Next!', 
              'You\'re now first in line. Get ready!'
            )
            notificationShownRef.current = true
          }
        }
        
        // Status changed to called
        if (oldStatus === 'waiting' && newStatus === 'called') {
          setWasJustCalled(true)
          playNotificationSound()
          showNotification(
            'You\'ve Been Called!', 
            'It\'s your turn! Please proceed to the service area.'
          )
          
          // Reset the flag after showing the notification
          setTimeout(() => {
            setWasJustCalled(false)
            notificationShownRef.current = false
          }, 5000)
        }

        // Status changed to served or cancelled - add to history and clear current queue
        if ((oldStatus === 'called' && newStatus === 'served') || 
            (oldStatus === 'waiting' && newStatus === 'cancelled') ||
            (oldStatus === 'called' && newStatus === 'cancelled')) {
          
          const currentQueue = LocalQueueStorage.getCurrentQueueEntry()
          if (currentQueue) {
            // Add to history
            QueueHistory.addToHistory({
              queueId: currentQueue.queueId,
              businessId: currentQueue.businessId,
              businessName: currentQueue.businessName,
              userInfo: currentQueue.userInfo,
              joinedAt: currentQueue.joinedAt,
              finalStatus: newStatus as 'served' | 'cancelled',
              finalPosition: data.position
            })
            
            // Clear current queue
            LocalQueueStorage.clearQueueEntry()
            
            // Show completion notification
            if (newStatus === 'served') {
              showNotification(
                'Service Complete!', 
                'Thank you for using our queue system.'
              )
            }
          }
        }
      }
      
      setQueueData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch queue status'
      setError(errorMessage)
      console.error('Queue status error:', err)
    } finally {
      setLoading(false)
    }
  }, [queueId, queueData, playNotificationSound, showNotification])

  // Real-time polling
  useEffect(() => {
    if (!queueId) {
      setLoading(false)
      return
    }

    // Initial fetch
    fetchQueueStatus()
    
    // Request notification permission on first load
    requestNotificationPermission()

    // Set up polling every 5 seconds for real-time updates
    const interval = setInterval(fetchQueueStatus, 5000)
    
    // Also fetch when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchQueueStatus()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [queueId, fetchQueueStatus, requestNotificationPermission])

  // Reset notification flag when queue ID changes
  useEffect(() => {
    notificationShownRef.current = false
    setWasJustCalled(false)
    setPreviousPosition(null)
  }, [queueId])

  return {
    queueData,
    loading,
    error,
    previousPosition,
    wasJustCalled,
    refresh: fetchQueueStatus
  }
}