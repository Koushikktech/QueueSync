"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConnectionStatusProps {
  connected: boolean
  error: string | null
  onRetry?: () => void
}

export default function ConnectionStatus({ connected, error, onRetry }: ConnectionStatusProps) {
  if (connected && !error) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">
            {error || 'Connection lost'}
          </span>
          {onRetry && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRetry}
              className="text-white hover:bg-red-600 h-6 px-2"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}