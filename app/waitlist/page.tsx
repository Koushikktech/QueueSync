"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import RealTimeQueueStatus from "@/components/real-time-queue-status"
import NotificationPermission from "@/components/notification-permission"
import QueueHistoryComponent from "@/components/queue-history"
import ServiceCompletion from "@/components/service-completion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Users, Clock } from "lucide-react"
import { useLocalQueue } from "@/hooks/use-local-queue"
import { QueueHistory } from "@/lib/queue-history"
import CongestionIndicator from "@/components/congestion-indicator"
import Link from "next/link"

export default function WaitlistPage() {
  const { currentQueue, loading, leaveQueue } = useLocalQueue()
  const [showCompletionMessage, setShowCompletionMessage] = useState(false)
  const [completedService, setCompletedService] = useState<any>(null)

  // Check if user just completed service (only show once)
  useEffect(() => {
    // Only show completion if user is NOT currently in a queue
    if (!currentQueue && !loading) {
      const unviewedCompletion = QueueHistory.getUnviewedCompletion()
      
      if (unviewedCompletion) {
        setCompletedService(unviewedCompletion)
        setShowCompletionMessage(true)
        
        // Mark as viewed immediately to prevent showing again
        QueueHistory.markCompletionAsViewed(unviewedCompletion.queueId)
      }
    }
  }, [currentQueue, loading])

  // Handle manual redirect to home
  const handleGoHome = () => {
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading your queue status...</div>
      </div>
    )
  }

  // Show completion message if user just finished service
  if (showCompletionMessage && completedService) {
    return <ServiceCompletion onGoHome={handleGoHome} completedService={completedService} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-foreground">My Queue Status</h1>
              <CongestionIndicator businessId="demo-business" />
            </div>
            <p className="text-muted-foreground">Track your position in real-time</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          {currentQueue ? (
            /* Show Queue Status */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <RealTimeQueueStatus
                queueId={currentQueue.queueId}
                businessName={currentQueue.businessName}
              />
              
              {/* Queue Actions */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Queue Actions</h3>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(currentQueue.joinedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={leaveQueue}
                    className="text-destructive hover:text-destructive"
                  >
                    Leave Queue
                  </Button>
                </div>
              </Card>

              {/* Queue History */}
              <QueueHistoryComponent />

              {/* Staff Access */}
              <div className="text-center">
                <Link href="/host" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Staff Access
                </Link>
              </div>
            </motion.div>
          ) : (
            /* Show Join Queue Prompt */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <Card className="p-12">
                <div className="mb-8">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-12 h-12 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    You're not in a queue
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Join a queue to track your position and get real-time updates on your wait time.
                  </p>
                </div>

                <div className="space-y-4">
                  <Link href="/#main-title">
                    <Button size="lg" className="w-full sm:w-auto">
                      <Clock className="w-4 h-4 mr-2" />
                      Join Queue Now
                    </Button>
                  </Link>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>• Real-time position updates</p>
                    <p>• Estimated wait time</p>
                    <p>• SMS & Email notifications</p>
                  </div>
                </div>
              </Card>

              {/* Queue History */}
              <QueueHistoryComponent />

              {/* Staff Access */}
              <div className="mt-8">
                <Link href="/host" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Staff Access
                </Link>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Notification Permission Prompt */}
        <NotificationPermission />
      </div>
    </div>
  )
}