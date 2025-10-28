"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface QueuePageProps {
  params: {
    businessId: string
  }
}

export default function QueuePage({ params }: QueuePageProps) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new waitlist page
    router.replace('/waitlist')
  }, [router])

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Redirecting to queue...</div>
    </div>
  )
}