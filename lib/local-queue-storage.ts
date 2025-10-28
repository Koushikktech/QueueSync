// Local storage utility for queue management

export interface LocalQueueEntry {
  queueId: string
  businessId: string
  businessName: string
  userInfo: {
    name: string
    phone?: string
    email?: string
  }
  joinedAt: string
  expiresAt: string
}

const STORAGE_KEY = 'queueSync_currentQueue'
const QUEUE_EXPIRY_HOURS = 24 // Queue entries expire after 24 hours

export class LocalQueueStorage {
  // Save queue entry to local storage
  static saveQueueEntry(entry: Omit<LocalQueueEntry, 'joinedAt' | 'expiresAt'>): void {
    try {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + QUEUE_EXPIRY_HOURS * 60 * 60 * 1000)
      
      const queueEntry: LocalQueueEntry = {
        ...entry,
        joinedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queueEntry))
    } catch (error) {
      console.error('Failed to save queue entry to local storage:', error)
    }
  }

  // Get current queue entry from local storage
  static getCurrentQueueEntry(): LocalQueueEntry | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const entry: LocalQueueEntry = JSON.parse(stored)
      
      // Check if entry has expired
      const now = new Date()
      const expiresAt = new Date(entry.expiresAt)
      
      if (now > expiresAt) {
        // Entry has expired, remove it
        this.clearQueueEntry()
        return null
      }
      
      return entry
    } catch (error) {
      console.error('Failed to get queue entry from local storage:', error)
      return null
    }
  }

  // Clear queue entry from local storage
  static clearQueueEntry(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear queue entry from local storage:', error)
    }
  }

  // Check if user is currently in a queue
  static isInQueue(): boolean {
    return this.getCurrentQueueEntry() !== null
  }

  // Get queue ID if user is in queue
  static getCurrentQueueId(): string | null {
    const entry = this.getCurrentQueueEntry()
    return entry?.queueId || null
  }

  // Update queue entry (for status changes)
  static updateQueueEntry(updates: Partial<LocalQueueEntry>): void {
    const current = this.getCurrentQueueEntry()
    if (current) {
      const updated = { ...current, ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }
  }
}