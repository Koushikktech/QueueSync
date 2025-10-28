"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, CheckCircle2, Clock, Users, ArrowLeft, UserCheck } from "lucide-react"
import { useQueue } from "@/hooks/use-queue"
import { QueueEntry } from "@/types/queue"
import { formatTime } from "@/lib/date-utils"
import ProtectedRoute from "@/components/protected-route"
import CongestionControl from "@/components/congestion-control"
import Link from "next/link"

export default function HostDashboard() {
  const businessId = "demo-business"
  const { queueEntries, loading } = useQueue(businessId)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [calledEntries, setCalledEntries] = useState<QueueEntry[]>([])

  // Fetch called customers
  useEffect(() => {
    const fetchCalledCustomers = async () => {
      try {
        const response = await fetch(`/api/queue/sync?businessId=${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setCalledEntries(data.called || [])
        }
      } catch (error) {
        console.error('Failed to fetch called customers:', error)
      }
    }

    fetchCalledCustomers()
    const interval = setInterval(fetchCalledCustomers, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [businessId])

  const handleCallNext = useCallback(async () => {
    if (queueEntries.length > 0) {
      const nextEntry = queueEntries[0]
      setProcessingId(nextEntry.id)
      
      try {
        // Update queue entry status to 'called' (this will also recalculate positions)
        const response = await fetch(`/api/queue/call/${nextEntry.id}`, {
          method: 'POST'
        })
        
        if (response.ok) {
          alert(`Called: ${nextEntry.userInfo.name}`)
        } else {
          throw new Error('Failed to call customer')
        }
      } catch (error) {
        console.error('Failed to call next:', error)
        alert('Failed to call customer. Please try again.')
      } finally {
        setProcessingId(null)
      }
    }
  }, [queueEntries])

  const handleRemove = useCallback(async (id: string) => {
    setProcessingId(id)
    
    try {
      // Remove from queue (this will also recalculate positions)
      const response = await fetch(`/api/queue/remove/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove from queue')
      }
    } catch (error) {
      console.error('Failed to remove:', error)
      alert('Failed to remove entry. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }, [])

  const handleCheckIn = useCallback(async (id: string) => {
    setProcessingId(id)
    
    try {
      // Mark customer as served (checked in)
      const response = await fetch(`/api/queue/serve/${id}`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to check in customer')
      }
      
      // Remove from called entries list
      setCalledEntries(prev => prev.filter(entry => entry.id !== id))
    } catch (error) {
      console.error('Failed to check in:', error)
      alert('Failed to check in customer. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }, [])

  const totalPeople = queueEntries.length
  const avgWait = queueEntries.length > 0 ? Math.round(queueEntries.length * 10) : 0
  const totalCalled = calledEntries.length

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading queue...</div>
      </div>
    )
  }

  return (
    <ProtectedRoute title="Queue Management Dashboard">
      <div className="min-h-screen w-full bg-background p-4 sm:p-8">
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(226, 232, 240, 0.12), transparent 60%), #000000",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
            <Link href="/waitlist">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                View Queue
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Host Dashboard</h1>
          <p className="text-muted-foreground">Manage your virtual queue in real-time</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Queue</p>
                <motion.p
                  className="text-3xl font-bold text-foreground"
                  key={queueEntries.length}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {queueEntries.length}
                </motion.p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="border-2 border-secondary/20 bg-card/50 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Wait</p>
                <motion.p
                  className="text-3xl font-bold text-foreground"
                  key={avgWait}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {avgWait}m
                </motion.p>
              </div>
              <Clock className="h-8 w-8 text-secondary opacity-50" />
            </div>
          </Card>

          <Card className="border-2 border-accent/20 bg-card/50 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Called</p>
                <motion.p
                  className="text-3xl font-bold text-foreground"
                  key={totalCalled}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {totalCalled}
                </motion.p>
              </div>
              <UserCheck className="h-8 w-8 text-accent opacity-50" />
            </div>
          </Card>
        </motion.div>

        {/* Congestion Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <CongestionControl businessId={businessId} />
        </motion.div>

        {/* Call Next Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Button
            onClick={handleCallNext}
            disabled={queueEntries.length === 0 || processingId !== null}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {processingId ? "Processing..." : queueEntries.length === 0 ? "Queue Empty" : "Call Next Person"}
          </Button>
        </motion.div>

        {/* Called Customers Section */}
        {calledEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Called Customers ({calledEntries.length})
            </h2>
            
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {calledEntries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Card className="p-4 border-blue-200 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                            #{entry.position}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-foreground">{entry.userInfo.name}</p>
                              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                Called
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Called: {entry.calledAt ? new Date(entry.calledAt).toLocaleTimeString() : 'Just now'}
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleCheckIn(entry.id)}
                          disabled={processingId === entry.id}
                          className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {processingId === entry.id ? 'Checking In...' : 'Check In'}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Queue List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="text-xl font-bold text-foreground mb-4">Waiting Queue</h2>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {queueEntries.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <p className="text-muted-foreground">Queue is empty</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Customers can join at: <Link href="/queue/demo-business" className="text-primary hover:underline">/queue/demo-business</Link>
                  </p>
                </motion.div>
              ) : (
                queueEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Card
                      className={`border-2 bg-card/50 backdrop-blur-sm p-4 flex items-center justify-between transition-all ${
                        index === 0
                          ? "border-primary/50 ring-2 ring-primary/20"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <motion.div
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-bold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          {index + 1}
                        </motion.div>

                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{entry.userInfo.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined: {formatTime(entry.joinedAt)} • Wait: {entry.estimatedWaitTime}min
                          </p>
                        </div>

                        {index === 0 && (
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Next
                          </Badge>
                        )}
                      </div>

                      <motion.button
                        onClick={() => handleRemove(entry.id)}
                        disabled={processingId === entry.id}
                        className="ml-4 p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                        whileHover={{ scale: processingId === entry.id ? 1 : 1.1 }}
                        whileTap={{ scale: processingId === entry.id ? 1 : 0.95 }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </motion.button>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      </div>
    </ProtectedRoute>
  )
}
