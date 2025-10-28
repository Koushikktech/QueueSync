"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, Users } from "lucide-react"

export default function WaitPage({ params }: { params: { id: string } }) {
  const [queuePosition, setQueuePosition] = useState(12)
  const [estimatedWait, setEstimatedWait] = useState(45)
  const [isCalled, setIsCalled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updateQueue = useCallback(() => {
    setQueuePosition((prev) => Math.max(1, prev - 1))
    setEstimatedWait((prev) => Math.max(0, prev - 3))
  }, [])

  useEffect(() => {
    const interval = setInterval(updateQueue, 5000)
    return () => clearInterval(interval)
  }, [updateQueue])

  useEffect(() => {
    if (queuePosition === 1 && !isCalled) {
      const timer = setTimeout(() => {
        setIsCalled(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [queuePosition, isCalled])

  if (!mounted) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(226, 232, 240, 0.12), transparent 60%), #000000",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {isCalled ? (
            <motion.div
              key="called"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="space-y-6"
            >
              {/* Celebration animation */}
              <motion.div
                className="text-center"
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              >
                <div className="text-6xl mb-4">🎉</div>
              </motion.div>

              <Card className="border-2 border-primary bg-card/50 backdrop-blur-sm p-8 text-center">
                <h1 className="text-4xl font-bold text-foreground mb-2">You're up!</h1>
                <p className="text-muted-foreground mb-6">Please proceed to the counter</p>

                <motion.div
                  className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold"
                  animate={{
                    boxShadow: ["0 0 0 0 rgba(231, 138, 83, 0.7)", "0 0 0 20px rgba(231, 138, 83, 0)"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                >
                  Queue ID: {params.id}
                </motion.div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Queue Position Display */}
              <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm p-8">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground text-sm">Your Position</p>

                  <motion.div
                    className="text-7xl font-bold text-primary"
                    key={queuePosition}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {queuePosition}
                  </motion.div>

                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">in queue</span>
                  </div>
                </div>
              </Card>

              {/* Estimated Wait Time */}
              <Card className="border-2 border-secondary/20 bg-card/50 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Wait</p>
                      <motion.p
                        className="text-2xl font-bold text-foreground"
                        key={estimatedWait}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {estimatedWait} min
                      </motion.p>
                    </div>
                  </div>
                  <Badge variant="secondary">Live</Badge>
                </div>
              </Card>

              {/* Queue ID */}
              <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Queue ID</p>
                    <p className="text-lg font-mono font-bold text-foreground">{params.id}</p>
                  </div>
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>

              {/* Info Message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-sm text-muted-foreground"
              >
                <p>Updates every 5 seconds</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
