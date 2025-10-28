"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bug, ChevronDown, ChevronUp } from 'lucide-react'

interface QueueDebugInfoProps {
  queueId: string | null
  connected: boolean
  error: string | null
  fallbackMode?: boolean
  queueData: any
}

export default function QueueDebugInfo({ 
  queueId, 
  connected, 
  error, 
  fallbackMode, 
  queueData 
}: QueueDebugInfoProps) {
  const [showDebug, setShowDebug] = useState(false)

  // Only show in development or when there are issues
  if (process.env.NODE_ENV === 'production' && connected && !error) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDebug(!showDebug)}
        className="mb-2 gap-2"
      >
        <Bug className="w-4 h-4" />
        Debug
        {showDebug ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      <AnimatePresence>
        {showDebug && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="p-4 max-w-sm bg-white shadow-lg">
              <h3 className="font-semibold text-sm mb-3">Queue Debug Info</h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Queue ID:</span>
                  <span className="font-mono">{queueId || 'None'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Connected:</span>
                  <span className={connected ? 'text-green-600' : 'text-red-600'}>
                    {connected ? 'Yes' : 'No'}
                  </span>
                </div>
                
                {fallbackMode !== undefined && (
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <span className={fallbackMode ? 'text-yellow-600' : 'text-green-600'}>
                      {fallbackMode ? 'Polling' : 'Real-time'}
                    </span>
                  </div>
                )}
                
                {error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-red-600">
                    <div className="font-medium">Error:</div>
                    <div>{error}</div>
                  </div>
                )}
                
                {queueData && (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <div className="font-medium">Queue Data:</div>
                    <div>Position: {queueData.position}</div>
                    <div>Status: {queueData.status}</div>
                    <div>Wait: {queueData.estimatedWaitTime}min</div>
                  </div>
                )}
                
                <div className="mt-2 text-gray-500">
                  Last update: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}