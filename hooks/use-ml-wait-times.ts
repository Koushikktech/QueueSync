import { useState, useEffect, useCallback } from 'react';
import { MLService } from '@/lib/ml-service';
import { WaitTimeUpdater } from '@/lib/wait-time-updater';

interface UseMLWaitTimesProps {
  businessId: string;
  enablePeriodicUpdates?: boolean;
  updateIntervalMinutes?: number;
}

interface MLWaitTimeState {
  isMLAvailable: boolean;
  lastUpdateTime: Date | null;
  isUpdating: boolean;
  error: string | null;
}

export function useMLWaitTimes({
  businessId,
  enablePeriodicUpdates = true,
  updateIntervalMinutes = 2,
}: UseMLWaitTimesProps) {
  const [state, setState] = useState<MLWaitTimeState>({
    isMLAvailable: false,
    lastUpdateTime: null,
    isUpdating: false,
    error: null,
  });

  // Check ML service availability
  const checkMLAvailability = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isUpdating: true, error: null }));
      
      const isAvailable = await MLService.isMLServiceAvailable();
      
      setState(prev => ({
        ...prev,
        isMLAvailable: isAvailable,
        lastUpdateTime: new Date(),
        isUpdating: false,
      }));

      return isAvailable;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isMLAvailable: false,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return false;
    }
  }, []);

  // Get updated wait time for specific conditions (non-blocking)
  const getUpdatedWaitTime = useCallback(async (
    queueSize: number,
    partySize: number
  ): Promise<number | null> => {
    try {
      if (!state.isMLAvailable) {
        return null;
      }

      const currentHour = new Date().getHours();
      
      // Use WaitTimeUpdater for optimized, non-blocking updates
      const { WaitTimeUpdater } = await import('@/lib/wait-time-updater');
      const waitTime = await WaitTimeUpdater.updateSingleWaitTime(queueSize, partySize);

      if (waitTime !== null) {
        setState(prev => ({ ...prev, lastUpdateTime: new Date() }));
      }
      
      return waitTime;
    } catch (error) {
      console.error('Error getting updated wait time:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get wait time',
      }));
      return null;
    }
  }, [state.isMLAvailable]);

  // Initialize ML service and periodic updates
  useEffect(() => {
    checkMLAvailability();

    if (enablePeriodicUpdates) {
      WaitTimeUpdater.startPeriodicUpdates(businessId, updateIntervalMinutes);
    }

    return () => {
      if (enablePeriodicUpdates) {
        WaitTimeUpdater.stopPeriodicUpdates();
      }
    };
  }, [businessId, enablePeriodicUpdates, updateIntervalMinutes, checkMLAvailability]);

  // Periodic availability check
  useEffect(() => {
    const availabilityCheck = setInterval(() => {
      if (!state.isMLAvailable) {
        checkMLAvailability();
      }
    }, 30000); // Check every 30 seconds if ML is not available

    return () => clearInterval(availabilityCheck);
  }, [state.isMLAvailable, checkMLAvailability]);

  return {
    ...state,
    checkMLAvailability,
    getUpdatedWaitTime,
    refreshWaitTimes: () => checkMLAvailability(),
  };
}