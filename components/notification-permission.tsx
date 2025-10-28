"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bell, X } from 'lucide-react'

export default function NotificationPermission() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      
      // Show prompt if permission is default and user hasn't dismissed it
      const dismissed = localStorage.getItem('notification-prompt-dismissed')
      if (Notification.permission === 'default' && !dismissed) {
        setTimeout(() => setShowPrompt(true), 2000) // Show after 2 seconds
      }
    }
  }, [])

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      setShowPrompt(false)
      
      if (result === 'granted') {
        // Show a test notification
        new Notification('Notifications Enabled!', {
          body: 'You\'ll now receive alerts when it\'s your turn.',
          icon: '/favicon.ico'
        })
      }
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    localStorage.setItem('notification-prompt-dismissed', 'true')
  }

  if (!('Notification' in window) || permission !== 'default' || !showPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <Card className="p-4 shadow-lg border-primary/20 bg-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">Enable Notifications</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get notified when it's your turn in the queue with sound alerts.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={requestPermission}>
                  Enable
                </Button>
                <Button size="sm" variant="ghost" onClick={dismissPrompt}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}