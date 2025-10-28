"use client"

import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, ArrowUp } from "lucide-react"

interface PositionUpdateAnimationProps {
  oldPosition: number | null
  newPosition: number
  show: boolean
}

export default function PositionUpdateAnimation({ 
  oldPosition, 
  newPosition, 
  show 
}: PositionUpdateAnimationProps) {
  if (!show || !oldPosition || oldPosition <= newPosition) {
    return null
  }

  const positionsImproved = oldPosition - newPosition

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 20,
          duration: 0.6 
        }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-lg border border-green-400">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                y: [0, -5, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 0.8,
                repeat: 2,
                ease: "easeInOut"
              }}
            >
              <ArrowUp className="w-6 h-6" />
            </motion.div>
            <div>
              <div className="font-bold text-lg">
                Position Updated!
              </div>
              <div className="text-green-100 text-sm">
                You moved {positionsImproved} position{positionsImproved > 1 ? 's' : ''} up!
              </div>
              <div className="text-green-200 text-xs">
                From #{oldPosition} → #{newPosition}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}