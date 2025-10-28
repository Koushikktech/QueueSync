import { MLService } from './ml-service';

export class WaitTimeUpdater {
  private static updateInterval: NodeJS.Timeout | null = null;
  private static isUpdating = false;
  private static debounceTimeout: NodeJS.Timeout | null = null;

  // Start periodic wait time updates
  static startPeriodicUpdates(businessId: string, intervalMinutes: number = 2): void {
    if (this.updateInterval) {
      this.stopPeriodicUpdates();
    }

    console.log(`Starting periodic wait time updates every ${intervalMinutes} minutes`);
    
    this.updateInterval = setInterval(async () => {
      if (!this.isUpdating) {
        await this.updateAllWaitTimes(businessId);
      }
    }, intervalMinutes * 60 * 1000);

    // Run initial update
    this.updateAllWaitTimes(businessId);
  }

  // Stop periodic updates
  static stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('Stopped periodic wait time updates');
    }
  }

  // Update all wait times for a business (debounced to prevent blocking)
  private static async updateAllWaitTimes(businessId: string): Promise<void> {
    if (this.isUpdating) return;
    
    // Debounce rapid updates
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    this.debounceTimeout = setTimeout(async () => {
      this.isUpdating = true;
      
      try {
        const isMLAvailable = await MLService.isMLServiceAvailable();
        
        if (!isMLAvailable) {
          console.log('ML service not available, skipping wait time update');
          return;
        }

        console.log('Updating wait times with ML predictions...');
        
        // Import QueueService dynamically to avoid circular dependency
        const { QueueService } = await import('./queue-service');
        
        // Run update in background without blocking UI
        QueueService.updateAllWaitTimes(businessId).catch(error => {
          console.error('Background wait time update failed:', error);
        });
        
      } catch (error) {
        console.error('Error updating wait times:', error);
      } finally {
        this.isUpdating = false;
      }
    }, 500); // 500ms debounce
  }

  // Manual wait time update for a specific queue entry (non-blocking)
  static async updateSingleWaitTime(
    queueSize: number, 
    partySize: number
  ): Promise<number | null> {
    try {
      const isMLAvailable = await MLService.isMLServiceAvailable();
      
      if (!isMLAvailable) {
        return null;
      }

      const currentHour = new Date().getHours();
      
      // Use Promise.race to timeout quickly if ML service is slow
      const timeoutPromise = new Promise<number>((_, reject) => {
        setTimeout(() => reject(new Error('ML service timeout')), 1500);
      });
      
      const mlPromise = MLService.getUpdatedWaitTime({
        queueSize,
        currentHour,
        partySize,
      });
      
      const updatedWaitTime = await Promise.race([mlPromise, timeoutPromise]);
      return updatedWaitTime;
    } catch (error) {
      console.error('Error updating single wait time:', error);
      return null;
    }
  }
}