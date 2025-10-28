"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"

interface CheckInNotificationProps {
  show: boolean
  businessName: string
}

export default function CheckInNotification({ show, businessName }: CheckInNotificationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <Card className="p-8 max-w-md w-full text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            {/* Success Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                delay: 0.2 
              }}
              className="mb-6"
            >
              <div className="relative inline-block">
                <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto" />
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </motion.div>
              </div>
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                You're All Set!
              </h2>
              <p className="text-green-700 mb-4">
                You have been successfully checked in at {businessName}.
              </p>
              <p className="text-sm text-green-600">
                Thank you for using our queue system!
              </p>
            </motion.div>

            {/* Confetti Effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute inset-0 pointer-events-none"
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                  initial={{ 
                    x: "50%", 
                    y: "50%",
                    scale: 0
                  }}
                  animate={{ 
                    x: `${50 + (Math.random() - 0.5) * 200}%`,
                    y: `${50 + (Math.random() - 0.5) * 200}%`,
                    scale: [0, 1, 0],
                    rotate: 360
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: 0.8 + i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
            </motion.div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}