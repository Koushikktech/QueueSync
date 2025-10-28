"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, CheckCircle } from "lucide-react"

type CongestionLevel = 'low' | 'moderate' | 'high'

interface CongestionData {
  businessId: string
  congestionLevel: CongestionLevel
  updatedAt: string
}

export default function CongestionIndicator({ businessId = 'demo-business' }: { businessId?: string }) {
  const [congestion, setCongestion] = useState<CongestionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCongestion = async () => {
      try {
        const response = await fetch(`/api/congestion?businessId=${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setCongestion(data)
        }
      } catch (error) {
        console.error('Failed to fetch congestion:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCongestion()
    
    // Update every 30 seconds
    const interval = setInterval(fetchCongestion, 30000)
    return () => clearInterval(interval)
  }, [businessId])

  if (loading || !congestion) {
    return (
      <Badge variant="secondary" className="gap-2">
        <Clock className="w-3 h-3" />
        Loading...
      </Badge>
    )
  }

  const getIndicatorProps = (level: CongestionLevel) => {
    switch (level) {
      case 'low':
        return {
          icon: CheckCircle,
          text: 'Low Traffic',
          className: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
          dotColor: 'bg-green-500'
        }
      case 'moderate':
        return {
          icon: Clock,
          text: 'Moderate Traffic',
          className: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
          dotColor: 'bg-orange-500'
        }
      case 'high':
        return {
          icon: AlertTriangle,
          text: 'High Traffic',
          className: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
          dotColor: 'bg-red-500'
        }
    }
  }

  const { icon: Icon, text, className, dotColor } = getIndicatorProps(congestion.congestionLevel)

  return (
    <Badge className={`gap-2 font-medium ${className}`}>
      <div className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
      <Icon className="w-3 h-3" />
      {text}
    </Badge>
  )
}