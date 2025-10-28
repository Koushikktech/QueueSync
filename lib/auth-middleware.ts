// Simple auth middleware for API routes
// This is optional - for demo purposes, we'll keep API routes open
// In production, you'd want to protect sensitive API endpoints

import { NextRequest } from 'next/server'

interface AuthSession {
  isAuthenticated: boolean
  username: string
  loginTime: number
  expiresAt: number
}

export function validateAuthHeader(request: NextRequest): AuthSession | null {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // In a real app, you'd validate a JWT token here
    // For demo purposes, we'll decode a simple JSON token
    const session: AuthSession = JSON.parse(atob(token))
    
    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      return null
    }

    return session
  } catch (error) {
    return null
  }
}

export function createAuthToken(session: AuthSession): string {
  // In a real app, you'd create a JWT token here
  // For demo purposes, we'll use base64 encoded JSON
  return btoa(JSON.stringify(session))
}

// Helper to check if request is from authenticated admin
export function isAdminRequest(request: NextRequest): boolean {
  const session = validateAuthHeader(request)
  return session !== null && session.isAuthenticated
}

// Response helpers
export function unauthorizedResponse() {
  return new Response(
    JSON.stringify({ error: 'Unauthorized', message: 'Admin authentication required' }),
    { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    }
  )
}

export function forbiddenResponse() {
  return new Response(
    JSON.stringify({ error: 'Forbidden', message: 'Insufficient permissions' }),
    { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    }
  )
}