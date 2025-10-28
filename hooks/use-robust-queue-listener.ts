import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { QueueEntry } from '@/types/queue'
import { LocalQueueStorage } from '@/lib/local-queue-storage'
import { QueueHistory } from '@/lib/queue-history'
import { notificationSound } from '@/lib/notification-sound'

interface QueueState {
  data: QueueEntry | null
  loading: boolean
  error: string | null
  connected: boolean
}

export function useRobustQueueListener(queueId: string | null) {
  const [state, setState] = useState<QueueState>({
    data: null,
    loading: true,
    error: null,
    connected: false
  })
  
  const [previousPosition, setPreviousPosition] = useState<number | null>(null)
  const [wasJustCalled, setWasJustCalled] = useState(false)
  
  // Refs to prevent infinite loops and manage state
  const unsubscribeRef = useRef<Unsubscribe | null>(null)
  const isInitialLoad = useRef(true)
  const lastUpdateTime = useRef<number>(0)
  const notificationShownRef = useRef(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Notification functions
  const playNotificationSound = useCallback(() => {
    try {
      notificationSound.play()
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }, [])

  const showNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'queue-update' // Prevents duplicate notifications
        })
      } catch (error) {
        console.error('Failed to show notification:', error)
      }
    }
  }, [])

  // Request notification permission once
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch (error) {
        console.error('Failed to request notification permission:', error)
      }
    }
  }, [])

  // Handle queue data updates
  const handleQueueUpdate = useCallback((newData: QueueEntry) => {
    const now = Date.now()
    
    // Prevent rapid updates (debounce)
    if (now - lastUpdateTime.current < 100) {
      return
    }
    lastUpdateTime.current = now

    setState(prevState => {
      const oldData = prevState.data
      
      // Check for meaningful changes
      if (oldData && 
          oldData.position === newData.position && 
          oldData.status === newData.status &&
          oldData.estimatedWaitTime === newData.estimatedWaitTime) {
        // No meaningful change, don't update
        return prevState
      }

      // Handle notifications for changes (not on initial load)
      if (!isInitialLoad.current && oldData) {
        const oldPosition = oldData.position
        const newPosition = newData.position
        const oldStatus = oldData.status
        const newStatus = newData.status
        
        // Position improved
        if (oldPosition > newPosition) {
          setPreviousPosition(oldPosition)
          
          if (newPosition === 1 && !notificationShownRef.current) {
            playNotificationSound()
            showNotification('You\'re Next!', 'You\'re now first in line. Get ready!')
            notificationShownRef.current = true
          } else if (newPosition > 1) {
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
          
          setTimeout(() => {
            setWasJustCalled(false)
            notificationShownRef.current = false
          }, 5000)
        }

        // Status changed to completed - add to history and clear queue
        if ((oldStatus === 'called' && newStatus === 'served') || 
            (oldStatus === 'waiting' && newStatus === 'cancelled') ||
            (oldStatus === 'called' && newStatus === 'cancelled')) {
          
          const currentQueue = LocalQueueStorage.getCurrentQueueEntry()
          if (currentQueue) {
            QueueHistory.addToHistory({
              queueId: currentQueue.queueId,
              businessId: currentQueue.businessId,
              businessName: currentQueue.businessName,
              userInfo: currentQueue.userInfo,
              joinedAt: currentQueue.joinedAt,
              finalStatus: newStatus as 'served' | 'cancelled',
              finalPosition: newData.position
            })
            
            // Clear queue data immediately
            LocalQueueStorage.clearQueueEntry()
            
            if (newStatus === 'served') {
              showNotification('Service Complete!', 'Thank you for using our queue system. You have been checked in.')
              playNotificationSound()
              
              // Redirect to home after a short delay
              setTimeout(() => {
                window.location.href = '/'
              }, 3000)
            } else {
              // For cancelled status, redirect immediately
              setTimeout(() => {
                window.location.href = '/'
              }, 1000)
            }
          }
        }
      }

      isInitialLoad.current = false
      
      return {
        ...prevState,
        data: newData,
        loading: false,
        error: null,
        connected: true
      }
    })
  }, [playNotificationSound, showNotification])

  // Setup Firebase listener
  const setupListener = useCallback(() => {
    if (!queueId) {
      setState({
        data: null,
        loading: false,
        error: null,
        connected: false
      })
      return
    }

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setState(prevState => ({
      ...prevState,
      loading: true,
      error: null
    }))

    try {
      const queueDocRef = doc(db, 'queues', queueId)
      
      const unsubscribe = onSnapshot(
        queueDocRef,
        {
          includeMetadataChanges: false // Only listen to actual data changes
        },
        (docSnapshot) => {
          if (!docSnapshot.exists()) {
            // Document doesn't exist
            LocalQueueStorage.clearQueueEntry()
            setState({
              data: null,
              loading: false,
              error: 'Queue entry not found',
              connected: false
            })
            return
          }

          const data = docSnapshot.data()
          const queueData: QueueEntry = {
            id: docSnapshot.id,
            ...data,
            joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(data.joinedAt || Date.now()),
          } as QueueEntry

          handleQueueUpdate(queueData)
        },
        (error) => {
          console.error('Firebase listener error:', error)
          setState(prevState => ({
            ...prevState,
            loading: false,
            error: 'Connection lost. Attempting to reconnect...',
            connected: false
          }))
          
          // Attempt to reconnect after a delay
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...')
            setupListener()
          }, 3000)
        }
      )

      unsubscribeRef.current = unsubscribe
      
    } catch (error) {
      console.error('Failed to setup Firebase listener:', error)
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: 'Failed to connect to real-time updates',
        connected: false
      }))
    }
  }, [queueId, handleQueueUpdate])

  // Initialize listener
  useEffect(() => {
    // Reset state when queueId changes
    isInitialLoad.current = true
    notificationShownRef.current = false
    setWasJustCalled(false)
    setPreviousPosition(null)
    
    // Request notification permission
    requestNotificationPermission()
    
    // Setup listener
    setupListener()
    
    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [setupListener, requestNotificationPermission])

  // Handle visibility changes for reconnection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && state.error && queueId) {
        console.log('Tab became visible, attempting reconnect...')
        setupListener()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [state.error, queueId, setupListener])

  // Manual retry function
  const retry = useCallback(() => {
    if (queueId) {
      setupListener()
    }
  }, [queueId, setupListener])

  return {
    queueData: state.data,
    loading: state.loading,
    error: state.error,
    connected: state.connected,
    previousPosition,
    wasJustCalled,
    retry
  }
}