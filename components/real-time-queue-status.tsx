"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, TrendingUp, Bell, CheckCircle2, AlertCircle, Brain, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLightweightQueueListener } from "@/hooks/use-lightweight-queue-listener"
import { useLocalQueue } from "@/hooks/use-local-queue"
import { useMLWaitTimes } from "@/hooks/use-ml-wait-times"
import PositionUpdateAnimation from "@/components/position-update-animation"
import ConnectionStatus from "@/components/connection-status"
import QueueDebugInfo from "@/components/queue-debug-info"
import CheckInNotification from "@/components/check-in-notification"

interface RealTimeQueueStatusProps {
  queueId: string
  businessName: string
}

export default function RealTimeQueueStatus({ queueId, businessName }: RealTimeQueueStatusProps) {
  const { queueData, loading, error, connected, previousPosition, wasJustCalled, retry } = useLightweightQueueListener({ queueId })
  const { leaveQueue, completeService } = useLocalQueue()
  const { 
    isMLAvailable, 
    lastUpdateTime, 
    isUpdating, 
    error: mlError
  } = useMLWaitTimes({ 
    businessId: 'demo-business', // You can make this dynamic
    enablePeriodicUpdates: true,
    updateIntervalMinutes: 2
  })
  
  // Check if user was just served (checked in)
  const wasJustServed = queueData?.status === 'served'

  // Handle service completion
  useEffect(() => {
    if (wasJustServed && queueData) {
      completeService(queueData)
    }
  }, [wasJustServed, queueData, completeService])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-600 font-medium">Connection Error</p>
        </div>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <Button onClick={retry} variant="outline" size="sm">
          Retry Connection
        </Button>
      </Card>
    )
  }

  if (!queueData) {
    return (
      <Card className="p-6 border-gray-200 bg-gray-50">
        <p className="text-gray-600">Queue entry not found. You may have been removed from the queue.</p>
        <Button onClick={leaveQueue} variant="outline" size="sm" className="mt-4">
          Clear Status
        </Button>
      </Card>
    )
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'called': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'served': return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="w-4 h-4" />
      case 'called': return <Bell className="w-4 h-4" />
      case 'served': return <CheckCircle2 className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Check-in Success Notification */}
      <CheckInNotification 
        show={wasJustServed} 
        businessName={businessName} 
      />

      {/* Connection Status */}
      <ConnectionStatus 
        connected={connected} 
        error={error} 
        onRetry={retry} 
      />

      {/* Position Update Animation (Fixed Position) */}
      <PositionUpdateAnimation
        oldPosition={previousPosition}
        newPosition={queueData?.position || 0}
        show={!!previousPosition && !!queueData && previousPosition > queueData.position}
      />

      {/* Called Notification */}
      <AnimatePresence>
        {wasJustCalled && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-6 h-6 animate-bounce" />
              <h3 className="text-xl font-bold">You've Been Called!</h3>
            </div>
            <p className="text-blue-100">It's your turn! Please proceed to the service area.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Queue Status Card */}
      <motion.div
        layout
        className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
          <h2 className="text-xl font-bold mb-2">{businessName}</h2>
          <div className="flex items-center gap-2 text-primary-foreground/80">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Live Updates</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Position in Queue */}
          <div className="text-center">
            <motion.div 
              key={queueData.position}
              initial={{ scale: 1.2, rotate: -5 }}
              animate={{ 
                scale: 1, 
                rotate: 0,
                boxShadow: [
                  "0 0 0 0 rgba(59, 130, 246, 0.7)",
                  "0 0 0 10px rgba(59, 130, 246, 0)",
                  "0 0 0 0 rgba(59, 130, 246, 0)"
                ]
              }}
              transition={{ 
                type: "spring", 
                stiffness: 200,
                boxShadow: { duration: 1, ease: "easeOut" }
              }}
              className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-3 relative"
            >
              <span className="text-3xl font-bold text-primary">#{queueData.position}</span>
              {previousPosition && previousPosition > queueData.position && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <TrendingUp className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.div>
            <motion.p 
              key={`position-${queueData.position}`}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="text-gray-600"
            >
              Your Position
            </motion.p>
            {queueData.position === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Badge className="mt-2 bg-primary/20 text-primary border-primary/30 animate-pulse">
                  <Bell className="w-3 h-3 mr-1" />
                  You're Next!
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Estimated Wait Time with ML Indicator */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-900">Estimated Wait</span>
                {isMLAvailable && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Brain className="w-3 h-3" />
                    AI
                  </Badge>
                )}
              </div>
              <motion.span 
                key={queueData.estimatedWaitTime}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-xl font-bold text-primary"
              >
                {formatTime(queueData.estimatedWaitTime)}
              </motion.span>
            </div>
            
            {/* ML Status Indicator */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  isMLAvailable ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span>
                  {isMLAvailable ? 'ML Predictions Active' : 'Basic Calculation'}
                </span>
                {isUpdating && <Zap className="w-3 h-3 animate-pulse text-blue-500" />}
              </div>
              {lastUpdateTime && (
                <span>
                  Updated {new Date(lastUpdateTime).toLocaleTimeString()}
                </span>
              )}
            </div>
            
            {mlError && (
              <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>ML service unavailable</span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Status</span>
            <Badge className={`${getStatusColor(queueData.status)} gap-1`}>
              {getStatusIcon(queueData.status)}
              {queueData.status.charAt(0).toUpperCase() + queueData.status.slice(1)}
            </Badge>
          </div>

          {/* Joined Time */}
          <div className="flex items-center justify-between py-2 text-sm text-gray-600">
            <span>Joined at</span>
            <span>{new Date(queueData.joinedAt).toLocaleTimeString()}</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.max(0, 100 - (queueData.position - 1) * 10)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, 100 - (queueData.position - 1) * 10)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Real-time Indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <span>
              {connected ? 'Real-time' : 'Disconnected'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Debug Info */}
      <QueueDebugInfo
        queueId={queueId}
        connected={connected}
        error={error}
        fallbackMode={false}
        queueData={queueData}
      />
    </div>
  )
}