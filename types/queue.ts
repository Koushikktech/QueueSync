export interface QueueEntry {
  id: string
  userId: string
  businessId: string
  position: number
  estimatedWaitTime: number
  actualWaitTime?: number
  joinedAt: Date
  status: 'waiting' | 'called' | 'served' | 'cancelled'
  userInfo: {
    name: string
    phone?: string
    email?: string
    partySize?: number
  }
  mlPredicted?: boolean // Flag to indicate if ML was used for prediction
  lastUpdated?: Date // When the wait time was last updated
}

export interface Business {
  id: string
  name: string
  description: string
  category: string
  averageServiceTime: number
  currentQueueLength: number
  isOpen: boolean
  congestionLevel?: 'low' | 'moderate' | 'high'
  congestionUpdatedAt?: Date
  location: {
    address: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  settings: {
    maxQueueSize: number
    estimatedServiceTime: number
    allowPhoneNotifications: boolean
    allowEmailNotifications: boolean
  }
}

export interface WaitTimeData {
  businessId: string
  timestamp: Date
  queueLength: number
  averageWaitTime: number
  actualWaitTimes: number[]
  dayOfWeek: number
  hourOfDay: number
  weatherCondition?: string
  specialEvents?: string[]
}

export type CongestionLevel = 'low' | 'moderate' | 'high'

export interface CongestionData {
  businessId: string
  congestionLevel: CongestionLevel
  updatedAt: Date
}