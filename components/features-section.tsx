"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Zap, Users, TrendingUp, Bell, BarChart3, Lock } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Real-time updates with sub-second latency. Your queue position updates instantly.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Users,
    title: "Seamless Experience",
    description: "Guests join once and track their position. No refreshing, no confusion.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: TrendingUp,
    title: "Boost Revenue",
    description: "Reduce no-shows by 40%. Guests are more likely to show up when they know their position.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Guests get notified when they're next. Never miss a customer again.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track wait times, peak hours, and customer flow. Make data-driven decisions.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "Bank-level encryption. Your customer data is always protected.",
    color: "from-slate-500 to-gray-500",
  },
]

export default function FeaturesSection() {
  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(226, 232, 240, 0.08), transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Powerful Features for Modern Businesses
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage queues efficiently and keep customers happy
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-6 h-full hover:border-primary/50 transition-colors">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color} mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
