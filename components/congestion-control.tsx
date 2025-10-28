"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, CheckCircle, Activity } from "lucide-react"

type CongestionLevel = 'low' | 'moderate' | 'high'

interface CongestionData {
  businessId: string
  congestionLevel: CongestionLevel
  updatedAt: string
}

export default function CongestionControl({ businessId = 'demo-business' }: { businessId?: string }) {
  const [congestion, setCongestion] = useState<CongestionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchCongestion()
  }, [businessId])

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

  const updateCongestion = async (level: CongestionLevel) => {
    setUpdating(true)
    try {
      const response = await fetch('/api/congestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          congestionLevel: level
        })
      })

      if (response.ok) {
        await fetchCongestion()
      } else {
        throw new Error('Failed to update congestion')
      }
    } catch (error) {
      console.error('Error updating congestion:', error)
      alert('Failed to update congestion level')
    } finally {
      setUpdating(false)
    }
  }

  const getIndicatorProps = (level: CongestionLevel) => {
    switch (level) {
      case 'low':
        return {
          icon: CheckCircle,
          text: 'Low Congestion',
          description: 'Minimal wait times expected',
          className: 'bg-green-100 text-green-800 border-green-300',
          buttonClass: 'bg-green-600 hover:bg-green-700 text-white'
        }
      case 'moderate':
        return {
          icon: Clock,
          text: 'Moderate Congestion',
          description: 'Average wait times expected',
          className: 'bg-orange-100 text-orange-800 border-orange-300',
          buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white'
        }
      case 'high':
        return {
          icon: AlertTriangle,
          text: 'High TCongestion',
          description: 'Longer wait times expected',
          className: 'bg-red-100 text-red-800 border-red-300',
          buttonClass: 'bg-red-600 hover:bg-red-700 text-white'
        }
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Area Congestion</h3>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Area Congestion Control</h3>
      </div>

      {congestion && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Current Status:</span>
            {(() => {
              const { icon: Icon, text, className } = getIndicatorProps(congestion.congestionLevel)
              return (
                <Badge className={`gap-2 ${className}`}>
                  <Icon className="w-3 h-3" />
                  {text}
                </Badge>
              )
            })()}
          </div>
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(congestion.updatedAt).toLocaleString()}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Set the current congestion level to help customers understand expected wait times:
        </p>

        {(['low', 'moderate', 'high'] as CongestionLevel[]).map((level) => {
          const { icon: Icon, text, description, buttonClass } = getIndicatorProps(level)
          const isActive = congestion?.congestionLevel === level
          
          return (
            <Button
              key={level}
              onClick={() => updateCongestion(level)}
              disabled={updating || isActive}
              className={`w-full justify-start gap-3 h-auto p-4 ${
                isActive 
                  ? buttonClass + ' opacity-75 cursor-default' 
                  : 'bg-background hover:bg-muted border border-border text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">{text}</div>
                <div className="text-xs opacity-80">{description}</div>
              </div>
              {isActive && (
                <Badge variant="secondary" className="ml-auto">
                  Active
                </Badge>
              )}
            </Button>
          )
        })}
      </div>

      {updating && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Updating congestion level...
        </p>
      )}
    </Card>
  )
}