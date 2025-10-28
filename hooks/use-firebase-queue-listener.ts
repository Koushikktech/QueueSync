import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { QueueEntry } from '@/types/queue'
import { LocalQueueStorage } from '@/lib/local-queue-storage'
import { QueueHistory } from '@/lib/queue-history'
import { notificationSound } from '@/lib/notification-sound'

export function useFirebaseQueueListener(queueId: string | null) {
  const [queueData, setQueueData] = useState<QueueEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previousPosition, setPreviousPosition] = useState<number | null>(null)
  const [wasJustCalled, setWasJustCalled] = useState(false)
  
  const notificationShownRef = useRef(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)

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

  // Set up real-time Firebase listener
  useEffect(() => {
    if (!queueId) {
      setLoading(false)
      setQueueData(null)
      return
    }

    setLoading(true)
    setError(null)

    // Request notification permission
    requestNotificationPermission()

    // Create Firebase real-time listener
    const queueDocRef = doc(db, 'queues', queueId)
    
    const unsubscribe = onSnapshot(
      queueDocRef,
      (docSnapshot) => {
        if (!docSnapshot.exists()) {
          // Document doesn't exist - queue entry was deleted
          LocalQueueStorage.clearQueueEntry()
          setQueueData(null)
          setError('Queue entry not found')
          setLoading(false)
          return
        }

        const data = docSnapshot.data()
        const newQueueData: QueueEntry = {
          id: docSnapshot.id,
          ...data,
          joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(data.joinedAt || Date.now()),
        } as QueueEntry

        // Check for changes and trigger notifications
        if (queueData) {
          const oldPosition = queueData.position
          const newPosition = newQueueData.position
          const oldStatus = queueData.status
          const newStatus = newQueueData.status
          
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
            } else if (newPosition > 1) {
              // Show position update notification
              showNotification(
                'Position Updated!', 
                `You moved from #${oldPosition} to #${newPosition}`
              )
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
                finalPosition: newQueueData.position
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

        setQueueData(newQueueData)
        setLoading(false)
      },
      (error) => {
        console.error('Firebase listener error:', error)
        setError('Failed to connect to real-time updates')
        setLoading(false)
      }
    )

    unsubscribeRef.current = unsubscribe

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [queueId, queueData, playNotificationSound, showNotification, requestNotificationPermission])

  // Reset notification flag when queue ID changes
  useEffect(() => {
    notificationShownRef.current = false
    setWasJustCalled(false)
    setPreviousPosition(null)
  }, [queueId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  return {
    queueData,
    loading,
    error,
    previousPosition,
    wasJustCalled
  }
}