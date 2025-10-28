"use client"

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { LocalQueueStorage } from '@/lib/local-queue-storage'
import Link from 'next/link'

export default function QueueIndicator() {
  const [isInQueue, setIsInQueue] = useState(false)

  useEffect(() => {
    // Check queue status on mount
    const checkQueue = () => {
      setIsInQueue(LocalQueueStorage.isInQueue())
    }

    checkQueue()

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'queueSync_currentQueue') {
        checkQueue()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically in case of updates
    const interval = setInterval(checkQueue, 5000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  if (!isInQueue) return null

  return (
    <Link href="/waitlist">
      <Badge 
        variant="secondary" 
        className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-colors cursor-pointer gap-1"
      >
        <Clock className="w-3 h-3" />
        In Queue
      </Badge>
    </Link>
  )
}