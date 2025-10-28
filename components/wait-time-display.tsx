"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, TrendingUp, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface WaitTimeDisplayProps {
  businessId: string
  businessName: string
}

export default function WaitTimeDisplay({ businessId, businessName }: WaitTimeDisplayProps) {
  const [waitTime, setWaitTime] = useState<number | null>(null)
  const [queueLength, setQueueLength] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWaitTime = async () => {
      try {
        const response = await fetch(`/api/business/${businessId}/wait-time`)
        if (response.ok) {
          const data = await response.json()
          setWaitTime(data.estimatedWaitTime)
          setQueueLength(data.queueLength)
        }
      } catch (error) {
        console.error('Failed to fetch wait time:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWaitTime()
    const interval = setInterval(fetchWaitTime, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [businessId])

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-primary/20 rounded w-3/4"></div>
          <div className="h-8 bg-primary/20 rounded w-1/2"></div>
        </div>
      </Card>
    )
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">{businessName}</h3>
          <Clock className="w-5 h-5 text-primary" />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current Wait Time</span>
            <span className="text-2xl font-bold text-primary">
              {waitTime ? formatTime(waitTime) : 'N/A'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              People in Queue
            </span>
            <span className="text-lg font-semibold text-foreground">
              {queueLength}
            </span>
          </div>
          
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>Updated in real-time</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}