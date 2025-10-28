"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react'
import { QueueHistory, QueueHistoryEntry } from '@/lib/queue-history'

interface ServiceCompletionProps {
  onGoHome?: () => void
  completedService?: QueueHistoryEntry | null
}

export default function ServiceCompletion({ onGoHome, completedService: propCompletedService }: ServiceCompletionProps) {
  const [completedService, setCompletedService] = useState<QueueHistoryEntry | null>(null)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Use prop if provided, otherwise check for unviewed completion
    if (propCompletedService) {
      setCompletedService(propCompletedService)
    } else {
      const unviewedCompletion = QueueHistory.getUnviewedCompletion()
      if (unviewedCompletion) {
        setCompletedService(unviewedCompletion)
      }
    }
  }, [propCompletedService])

  useEffect(() => {
    if (completedService && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      handleGoHome()
    }
  }, [countdown, completedService])

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome()
    } else {
      window.location.href = '/'
    }
  }

  if (!completedService) return null

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-green-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center relative"
      >
        {/* Floating sparkles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
            initial={{ 
              x: "50%", 
              y: "50%",
              scale: 0
            }}
            animate={{ 
              x: `${50 + (Math.random() - 0.5) * 300}%`,
              y: `${50 + (Math.random() - 0.5) * 300}%`,
              scale: [0, 1, 0],
              rotate: 360
            }}
            transition={{ 
              duration: 2,
              delay: i * 0.2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          />
        ))}

        <Card className="p-8 bg-white shadow-xl border-green-200 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
          
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="mb-6 relative"
          >
            <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </motion.div>
          </motion.div>
          
          {/* Success message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-2xl font-bold text-green-800 mb-2">
              Service Complete!
            </h1>
            <p className="text-green-700 mb-4">
              Thank you for using our queue system at <strong>{completedService.businessName}</strong>.
            </p>
            
            {/* Service details */}
            <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-green-600 font-medium">Total Wait Time:</span>
                  <div className="text-green-800">{formatDuration(completedService.totalWaitTime)}</div>
                </div>
                <div>
                  <span className="text-green-600 font-medium">Completed:</span>
                  <div className="text-green-800">
                    {new Date(completedService.completedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button 
              onClick={handleGoHome} 
              className="w-full bg-green-600 hover:bg-green-700 gap-2"
            >
              Return to Home
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <motion.p 
              key={countdown}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-sm text-green-600"
            >
              Redirecting automatically in {countdown} seconds...
            </motion.p>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}