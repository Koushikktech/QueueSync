"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const steps = [
  {
    number: "01",
    title: "Guest Joins Queue",
    description: "Customer enters their name and party size. They instantly get a unique queue ID.",
    icon: "👥",
  },
  {
    number: "02",
    title: "Real-Time Tracking",
    description: "Watch their position update in real-time. See estimated wait time and stay informed.",
    icon: "📍",
  },
  {
    number: "03",
    title: "Smart Notifications",
    description: "Get notified when it's their turn. No more waiting at the counter.",
    icon: "🔔",
  },
  {
    number: "04",
    title: "Seamless Check-In",
    description: "Staff confirms arrival. Guest proceeds to service. Simple and efficient.",
    icon: "✓",
  },
]

export default function HowItWorks() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 inline-flex">How It Works</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Simple, Elegant, Effective
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to transform your customer experience
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6 relative h-full">
                {/* Step Number */}
                <div className="text-5xl font-bold text-primary/20 mb-4">{step.number}</div>

                {/* Icon */}
                <div className="text-4xl mb-4">{step.icon}</div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
