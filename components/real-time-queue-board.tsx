"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Users, TrendingUp, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useQueue } from '@/hooks/use-queue'
import { QueueEntry } from '@/types/queue'

interface RealTimeQueueBoardProps {
  businessId: string
  businessName: string
}

export default function RealTimeQueueBoard({ businessId, businessName }: RealTimeQueueBoardProps) {
  const { queueEntries: rawQueueEntries } = useQueue(businessId)
  
  // Deduplicate entries to prevent React key errors
  const queueEntries = rawQueueEntries.filter((entry, index, array) => 
    array.findIndex(e => e.id === entry.id) === index
  )
  const [waitTimeData, setWaitTimeData] = useState<{
    estimatedWaitTime: number
    queueLength: number
    lastUpdated: string
  } | null>(null)

  useEffect(() => {
    const fetchWaitTime = async () => {
      try {
        const response = await fetch(`/api/business/${businessId}/wait-time`)
        if (response.ok) {
          const data = await response.json()
          setWaitTimeData(data)
        }
      } catch (error) {
        console.error('Failed to fetch wait time:', error)
      }
    }

    fetchWaitTime()
    const interval = setInterval(fetchWaitTime, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [businessId])

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header with real-time wait time */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{businessName}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              <span>Real-time Updates</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {waitTimeData ? formatTime(waitTimeData.estimatedWaitTime) : '--'}
            </div>
            <div className="text-sm text-muted-foreground">Estimated Wait</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <div className="text-lg font-semibold">
                {waitTimeData?.queueLength || queueEntries.length}
              </div>
              <div className="text-sm text-muted-foreground">In Queue</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <div className="text-lg font-semibold text-green-600">Live</div>
              <div className="text-sm text-muted-foreground">Real-time Updates</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Queue List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Current Queue
        </h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {queueEntries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                No one in queue currently
              </motion.div>
            ) : (
              queueEntries.map((entry, index) => (
                <motion.div
                  key={`${entry.id}-${entry.position}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    entry.position === 1 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-muted/50 border-border/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      entry.position === 1 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {entry.position}
                    </div>
                    <div>
                      <div className="font-medium">{entry.userInfo.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Joined {new Date(entry.joinedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatTime(entry.estimatedWaitTime)}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      entry.status === 'waiting' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : entry.status === 'called'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {entry.status}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  )
}