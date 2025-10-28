"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/simple-auth'
import AdminLogin from '@/components/admin-login'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, Clock, User } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  title?: string
}

export default function ProtectedRoute({ children, title = "Admin Dashboard" }: ProtectedRouteProps) {
  const { isAuthenticated, session, login, logout, extendSession, timeRemaining } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Small delay to prevent flash
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={login} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Admin Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-sm border-b border-border shadow-sm"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
              {session && (
                <Badge variant="secondary" className="gap-1">
                  <User className="w-3 h-3" />
                  {session.username}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Session Timer */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{timeRemaining}</span>
                <Button
                  onClick={extendSession}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                >
                  Extend
                </Button>
              </div>
              
              {/* Logout Button */}
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Protected Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {children}
      </motion.div>
    </div>
  )
}