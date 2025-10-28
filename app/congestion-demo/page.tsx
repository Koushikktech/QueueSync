"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import CongestionIndicator from "@/components/congestion-indicator"
import CongestionControl from "@/components/congestion-control"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function CongestionDemo() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Congestion System Demo</h1>
            <p className="text-muted-foreground">Test the congestion indicator and control system</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Admin Control Panel */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Admin Control Panel</h2>
            <CongestionControl businessId="demo-business" />
          </div>

          {/* Customer View */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Customer View</h2>
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Current Status</h3>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm text-muted-foreground">Area Traffic:</span>
                <CongestionIndicator key={refreshKey} businessId="demo-business" />
              </div>
              
              <Button onClick={handleRefresh} variant="outline" className="w-full">
                Refresh Status
              </Button>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">How it works:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Admin sets congestion level in real-time</li>
                  <li>• Customers see color-coded indicators</li>
                  <li>• Green = Low traffic, Orange = Moderate, Red = High</li>
                  <li>• Updates automatically every 30 seconds</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>

        {/* Integration Examples */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Integration Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="font-medium mb-2">Landing Page</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Shows congestion status next to the join queue form
              </p>
              <Link href="/">
                <Button variant="outline" size="sm" className="w-full">
                  View Landing Page
                </Button>
              </Link>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-2">Waitlist Page</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Displays current status in the header for waiting customers
              </p>
              <Link href="/waitlist">
                <Button variant="outline" size="sm" className="w-full">
                  View Waitlist
                </Button>
              </Link>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-2">Admin Dashboard</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Full control panel for managing congestion levels
              </p>
              <Link href="/host">
                <Button variant="outline" size="sm" className="w-full">
                  View Admin Panel
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}