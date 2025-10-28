// Queue history management for completed queues

export interface QueueHistoryEntry {
  queueId: string
  businessId: string
  businessName: string
  userInfo: {
    name: string
    phone?: string
    email?: string
  }
  joinedAt: string
  completedAt: string
  finalStatus: 'served' | 'cancelled'
  finalPosition: number
  totalWaitTime: number // in minutes
}

const HISTORY_STORAGE_KEY = 'queueSync_queueHistory'
const MAX_HISTORY_ENTRIES = 10

export class QueueHistory {
  // Add completed queue to history
  static addToHistory(entry: Omit<QueueHistoryEntry, 'completedAt' | 'totalWaitTime'> & { 
    joinedAt: string | Date 
  }): void {
    try {
      const joinedTime = typeof entry.joinedAt === 'string' 
        ? new Date(entry.joinedAt) 
        : entry.joinedAt
      
      const completedTime = new Date()
      const totalWaitTime = Math.round((completedTime.getTime() - joinedTime.getTime()) / (1000 * 60))
      
      const historyEntry: QueueHistoryEntry = {
        ...entry,
        joinedAt: joinedTime.toISOString(),
        completedAt: completedTime.toISOString(),
        totalWaitTime
      }
      
      const history = this.getHistory()
      history.unshift(historyEntry) // Add to beginning
      
      // Keep only the most recent entries
      const trimmedHistory = history.slice(0, MAX_HISTORY_ENTRIES)
      
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmedHistory))
    } catch (error) {
      console.error('Failed to add queue to history:', error)
    }
  }

  // Get queue history
  static getHistory(): QueueHistoryEntry[] {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get queue history:', error)
      return []
    }
  }

  // Clear history
  static clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear queue history:', error)
    }
  }

  // Get history for a specific business
  static getBusinessHistory(businessId: string): QueueHistoryEntry[] {
    return this.getHistory().filter(entry => entry.businessId === businessId)
  }

  // Get recent history (last 5 entries)
  static getRecentHistory(): QueueHistoryEntry[] {
    return this.getHistory().slice(0, 5)
  }

  // Check if there's an unviewed completion (within last 60 seconds)
  static getUnviewedCompletion(): QueueHistoryEntry | null {
    const history = this.getHistory()
    const lastEntry = history[0]
    
    if (lastEntry && 
        lastEntry.finalStatus === 'served' && 
        new Date().getTime() - new Date(lastEntry.completedAt).getTime() < 60000) {
      
      // Check if it's been marked as viewed
      const viewedKey = `completion_viewed_${lastEntry.queueId}`
      const isViewed = localStorage.getItem(viewedKey)
      
      if (!isViewed) {
        return lastEntry
      }
    }
    
    return null
  }

  // Mark completion as viewed
  static markCompletionAsViewed(queueId: string): void {
    try {
      const viewedKey = `completion_viewed_${queueId}`
      localStorage.setItem(viewedKey, 'true')
      
      // Clean up old viewed markers (older than 1 hour)
      this.cleanupOldViewedMarkers()
    } catch (error) {
      console.error('Failed to mark completion as viewed:', error)
    }
  }

  // Clean up old viewed markers
  private static cleanupOldViewedMarkers(): void {
    try {
      const keys = Object.keys(localStorage)
      const completionKeys = keys.filter(key => key.startsWith('completion_viewed_'))
      
      // Remove markers older than 1 hour
      const oneHourAgo = new Date().getTime() - (60 * 60 * 1000)
      
      completionKeys.forEach(key => {
        const timestamp = localStorage.getItem(key + '_timestamp')
        if (timestamp && parseInt(timestamp) < oneHourAgo) {
          localStorage.removeItem(key)
          localStorage.removeItem(key + '_timestamp')
        }
      })
    } catch (error) {
      console.error('Failed to cleanup old viewed markers:', error)
    }
  }
}