"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import JoinQueueForm from "@/components/join-queue-form"

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      <section className="relative overflow-hidden min-h-screen flex flex-col">
        <div className="container mx-auto px-4 py-24 sm:py-32 relative z-10 flex-1 flex flex-col">
          <div className="mx-auto max-w-4xl text-center flex-1 flex flex-col justify-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Badge variant="secondary" className="inline-flex items-center gap-2 px-4 py-2 text-sm">
                <Clock className="h-4 w-4" />
                Real-time queue management
              </Badge>
            </motion.div>

            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <h1 id="main-title" className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                The wait is <strong>over</strong>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground"
            >
              QueueSync transforms the waiting experience. Join a virtual queue, track your position in real-time, and
              get notified when it's your turn. Built for businesses that value customer time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center gap-6"
            >
              <JoinQueueForm 
                onSuccess={() => {
                  // Redirect to waitlist after successful join
                  setTimeout(() => {
                    window.location.href = '/waitlist'
                  }, 2000)
                }}
              />
            </motion.div>
          </div>

          {/* Social Proof Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-auto pb-8"
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-6">Trusted by leading businesses</p>
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                  <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    Restaurant
                  </div>
                </div>
                <div className="opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                  <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    Healthcare
                  </div>
                </div>
                <div className="opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                  <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    Retail
                  </div>
                </div>
                <div className="opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                  <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    Events
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
