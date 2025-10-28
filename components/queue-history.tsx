"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle2, XCircle, History, Trash2 } from 'lucide-react'
import { QueueHistory, QueueHistoryEntry } from '@/lib/queue-history'

export default function QueueHistoryComponent() {
  const [history, setHistory] = useState<QueueHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const loadHistory = () => {
      const recentHistory = QueueHistory.getRecentHistory()
      setHistory(recentHistory)
    }

    loadHistory()
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'queueSync_queueHistory') {
        loadHistory()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const clearHistory = () => {
    QueueHistory.clearHistory()
    setHistory([])
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getStatusIcon = (status: string) => {
    return status === 'served' 
      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
      : <XCircle className="w-4 h-4 text-red-600" />
  }

  const getStatusColor = (status: string) => {
    return status === 'served'
      ? 'bg-green-100 text-green-800 border-green-300'
      : 'bg-red-100 text-red-800 border-red-300'
  }

  if (history.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="gap-2"
        >
          <History className="w-4 h-4" />
          Queue History ({history.length})
        </Button>
        {showHistory && history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {history.map((entry, index) => (
              <motion.div
                key={entry.queueId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(entry.finalStatus)}
                      <div>
                        <p className="font-medium text-foreground">
                          {entry.businessName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.completedAt).toLocaleDateString()} at{' '}
                          {new Date(entry.completedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={`mb-1 ${getStatusColor(entry.finalStatus)}`}
                      >
                        {entry.finalStatus.charAt(0).toUpperCase() + entry.finalStatus.slice(1)}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(entry.totalWaitTime)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}