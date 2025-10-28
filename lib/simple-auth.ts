// Simple dummy authentication for admin access
// In production, use proper authentication like NextAuth.js

interface AdminCredentials {
  username: string
  password: string
}

interface AuthSession {
  isAuthenticated: boolean
  username: string
  loginTime: number
  expiresAt: number
}

const ADMIN_CREDENTIALS: AdminCredentials[] = [
  { username: 'admin', password: 'admin123' },
  { username: 'manager', password: 'manager123' },
  { username: 'staff', password: 'staff123' }
]

const SESSION_DURATION = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
const STORAGE_KEY = 'queueSync_adminSession'

export class SimpleAuth {
  // Authenticate user with username/password
  static authenticate(username: string, password: string): boolean {
    const isValid = ADMIN_CREDENTIALS.some(
      cred => cred.username === username && cred.password === password
    )

    if (isValid) {
      const session: AuthSession = {
        isAuthenticated: true,
        username,
        loginTime: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION
      }
      
      // Store session in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      }
      
      return true
    }
    
    return false
  }

  // Check if user is currently authenticated
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const sessionData = localStorage.getItem(STORAGE_KEY)
      if (!sessionData) return false

      const session: AuthSession = JSON.parse(sessionData)
      
      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        this.logout()
        return false
      }

      return session.isAuthenticated
    } catch (error) {
      console.error('Error checking authentication:', error)
      return false
    }
  }

  // Get current session info
  static getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null
    
    try {
      const sessionData = localStorage.getItem(STORAGE_KEY)
      if (!sessionData) return null

      const session: AuthSession = JSON.parse(sessionData)
      
      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        this.logout()
        return null
      }

      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  }

  // Logout user
  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Extend session (refresh expiration)
  static extendSession(): boolean {
    const session = this.getSession()
    if (!session) return false

    session.expiresAt = Date.now() + SESSION_DURATION
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    }
    
    return true
  }

  // Get time remaining in session
  static getTimeRemaining(): number {
    const session = this.getSession()
    if (!session) return 0
    
    return Math.max(0, session.expiresAt - Date.now())
  }

  // Format time remaining as string
  static formatTimeRemaining(): string {
    const remaining = this.getTimeRemaining()
    if (remaining === 0) return 'Expired'
    
    const hours = Math.floor(remaining / (60 * 60 * 1000))
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }
}

// Hook for React components
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [session, setSession] = useState<AuthSession | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = SimpleAuth.isAuthenticated()
      const currentSession = SimpleAuth.getSession()
      
      setIsAuthenticated(authenticated)
      setSession(currentSession)
    }

    // Check initially
    checkAuth()

    // Check every minute
    const interval = setInterval(checkAuth, 60000)

    return () => clearInterval(interval)
  }, [])

  const login = (username: string, password: string): boolean => {
    const success = SimpleAuth.authenticate(username, password)
    if (success) {
      setIsAuthenticated(true)
      setSession(SimpleAuth.getSession())
    }
    return success
  }

  const logout = () => {
    SimpleAuth.logout()
    setIsAuthenticated(false)
    setSession(null)
  }

  const extendSession = () => {
    const success = SimpleAuth.extendSession()
    if (success) {
      setSession(SimpleAuth.getSession())
    }
    return success
  }

  return {
    isAuthenticated,
    session,
    login,
    logout,
    extendSession,
    timeRemaining: SimpleAuth.formatTimeRemaining()
  }
}

// Import useState and useEffect for the hook
import { useState, useEffect } from 'react'