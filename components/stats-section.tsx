"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

const stats = [
  { value: "50K+", label: "Active Users", suffix: "monthly" },
  { value: "99.9%", label: "Uptime", suffix: "guaranteed" },
  { value: "40%", label: "Reduction", suffix: "in no-shows" },
  { value: "4.9★", label: "Customer Rating", suffix: "out of 5" },
]

export default function StatsSection() {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm p-8 text-center">
                <motion.div
                  className="text-4xl sm:text-5xl font-bold text-primary mb-2"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                >
                  {stat.value}
                </motion.div>
                <p className="text-foreground font-semibold mb-1">{stat.label}</p>
                <p className="text-sm text-muted-foreground">{stat.suffix}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
