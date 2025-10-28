import { useState, useEffect, useRef } from 'react';
import { QueueEntry } from '@/types/queue';
import { QueueService } from '@/lib/queue-service';

interface UseLightweightQueueListenerProps {
  queueId: string;
}

interface QueueListenerState {
  queueData: QueueEntry | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  previousPosition: number | null;
  wasJustCalled: boolean;
}

export function useLightweightQueueListener({ queueId }: UseLightweightQueueListenerProps) {
  const [state, setState] = useState<QueueListenerState>({
    queueData: null,
    loading: true,
    error: null,
    connected: false,
    previousPosition: null,
    wasJustCalled: false,
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const wasJustCalledTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lightweight queue status fetcher (non-blocking)
  const fetchQueueStatus = async () => {
    try {
      const queueData = await QueueService.getQueueStatus(queueId);
      
      if (queueData) {
        setState(prev => ({
          ...prev,
          queueData,
          loading: false,
          error: null,
          connected: true,
        }));
      } else {
        setState(prev => ({
          ...prev,
          queueData: null,
          loading: false,
          error: 'Queue entry not found',
          connected: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch queue status',
        connected: false,
      }));
    }
  };

  // Subscribe to direct queue entry updates (real-time)
  useEffect(() => {
    if (!queueId) return;

    let isActive = true;
    
    // Subscribe directly to the specific queue entry for real-time updates
    const unsubscribe = QueueService.subscribeToQueueEntry(queueId, (queueData) => {
      if (!isActive) return;
      
      if (queueData) {
        setState(prev => {
          const wasJustCalled = prev.queueData?.status === 'waiting' && queueData.status === 'called';
          const wasJustServed = prev.queueData?.status === 'called' && queueData.status === 'served';
          
          // Clear previous timeout
          if (wasJustCalledTimeoutRef.current) {
            clearTimeout(wasJustCalledTimeoutRef.current);
          }
          
          // Set new timeout if just called
          if (wasJustCalled) {
            wasJustCalledTimeoutRef.current = setTimeout(() => {
              setState(current => ({ ...current, wasJustCalled: false }));
            }, 5000);
          }

          // Handle service completion
          if (wasJustServed) {
            console.log('🎉 Customer was just served! Starting completion flow...');
            
            // Import and use queue history and local storage
            import('@/lib/queue-history').then(({ QueueHistory }) => {
              import('@/lib/local-queue-storage').then(({ LocalQueueStorage }) => {
                // Record in history (but don't mark as viewed yet)
                QueueHistory.addToHistory({
                  queueId: queueData.id,
                  businessId: queueData.businessId,
                  businessName: 'Demo Restaurant', // You can make this dynamic
                  userInfo: queueData.userInfo,
                  joinedAt: queueData.joinedAt.toISOString(),
                  finalStatus: 'served',
                  finalPosition: queueData.position,
                });

                // Clear from local storage immediately
                LocalQueueStorage.clearQueueEntry();
                
                // Redirect to waitlist page to show completion (if no new queue)
                setTimeout(() => {
                  // Check if user joined a new queue in the meantime
                  const currentQueue = LocalQueueStorage.getCurrentQueueEntry();
                  
                  if (!currentQueue) {
                    // No new queue, show completion page
                    window.location.href = '/waitlist';
                  } else {
                    // User joined new queue, mark old completion as viewed and stay
                    QueueHistory.markCompletionAsViewed(queueData.id);
                  }
                }, 1000);
              });
            });
          }

          return {
            ...prev,
            queueData,
            loading: false,
            error: null,
            connected: true,
            previousPosition: prev.queueData?.position || null,
            wasJustCalled,
          };
        });
      } else {
        // Queue entry was deleted
        setState(prev => ({
          ...prev,
          queueData: null,
          loading: false,
          error: 'Queue entry not found',
          connected: false,
        }));
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      isActive = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (wasJustCalledTimeoutRef.current) {
        clearTimeout(wasJustCalledTimeoutRef.current);
        wasJustCalledTimeoutRef.current = null;
      }
    };
  }, [queueId]);

  // Retry connection
  const retry = () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    fetchQueueStatus();
  };

  return {
    ...state,
    retry,
  };
}