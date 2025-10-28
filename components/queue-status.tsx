"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Users, MapPin } from 'lucide-react'
import { QueueEntry } from '@/types/queue'
import { useQueue } from '@/hooks/use-queue'

interface QueueStatusProps {
  queueId: string
  businessName: string
}

export default function QueueStatus({ queueId, businessName }: QueueStatusProps) {
  const [queueEntry, setQueueEntry] = useState<QueueEntry | null>(null)
  const { getQueueStatus, loading, error } = useQueue()

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getQueueStatus(queueId)
        setQueueEntry(status)
      } catch (err) {
        console.error('Failed to fetch queue status:', err)
      }
    }

    fetchStatus()
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [queueId, getQueueStatus])

  if (loading && !queueEntry) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (!queueEntry) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">Queue entry not found</p>
      </div>
    )
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
        <h2 className="text-xl font-bold mb-2">{businessName}</h2>
        <div className="flex items-center gap-2 text-primary-foreground/80">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">Queue Status</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Position in Queue */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-3">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">#{queueEntry.position}</h3>
          <p className="text-gray-600">Position in queue</p>
        </div>

        {/* Estimated Wait Time */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-medium text-gray-900">Estimated Wait</span>
            </div>
            <span className="text-xl font-bold text-primary">
              {formatTime(queueEntry.estimatedWaitTime)}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between py-2">
          <span className="text-gray-600">Status</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            queueEntry.status === 'waiting' 
              ? 'bg-yellow-100 text-yellow-800'
              : queueEntry.status === 'called'
              ? 'bg-blue-100 text-blue-800'
              : queueEntry.status === 'served'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {queueEntry.status.charAt(0).toUpperCase() + queueEntry.status.slice(1)}
          </span>
        </div>

        {/* Joined Time */}
        <div className="flex items-center justify-between py-2 text-sm text-gray-600">
          <span>Joined at</span>
          <span>{new Date(queueEntry.joinedAt).toLocaleTimeString()}</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.max(0, 100 - (queueEntry.position - 1) * 10)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, 100 - (queueEntry.position - 1) * 10)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}