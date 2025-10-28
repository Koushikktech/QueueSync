"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  speed: number
  direction: number
}

export default function InteractiveBackground() {
  const [particles, setParticles] = useState<Particle[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isInteracting, setIsInteracting] = useState(false)

  // Initialize particles
  useEffect(() => {
    const initialParticles: Particle[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 4 + 2,
      color: ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'][Math.floor(Math.random() * 5)],
      speed: Math.random() * 0.5 + 0.2,
      direction: Math.random() * Math.PI * 2
    }))
    
    setParticles(initialParticles)
  }, [])

  // Mouse tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
    setIsInteracting(true)
    
    // Reset interaction state after a delay
    setTimeout(() => setIsInteracting(false), 2000)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  // Animate particles
  useEffect(() => {
    const animateParticles = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let newX = particle.x + Math.cos(particle.direction) * particle.speed
          let newY = particle.y + Math.sin(particle.direction) * particle.speed
          
          // Bounce off edges
          if (newX < 0 || newX > window.innerWidth) {
            particle.direction = Math.PI - particle.direction
            newX = Math.max(0, Math.min(window.innerWidth, newX))
          }
          if (newY < 0 || newY > window.innerHeight) {
            particle.direction = -particle.direction
            newY = Math.max(0, Math.min(window.innerHeight, newY))
          }
          
          // Mouse interaction
          if (isInteracting) {
            const dx = mousePosition.x - newX
            const dy = mousePosition.y - newY
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < 100) {
              const force = (100 - distance) / 100
              newX -= dx * force * 0.01
              newY -= dy * force * 0.01
            }
          }
          
          return {
            ...particle,
            x: newX,
            y: newY
          }
        })
      )
    }

    const interval = setInterval(animateParticles, 16) // ~60fps
    return () => clearInterval(interval)
  }, [mousePosition, isInteracting])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-green-50/30" />
      
      {/* Animated particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full opacity-60"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
          }}
          animate={{
            scale: isInteracting ? [1, 1.5, 1] : 1,
            opacity: isInteracting ? [0.6, 0.9, 0.6] : 0.6
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
      
      {/* Floating geometric shapes */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`shape-${i}`}
          className="absolute opacity-10"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 30}%`,
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
            y: [0, -20, 0]
          }}
          transition={{
            rotate: { duration: 20 + i * 5, repeat: Infinity, ease: "linear" },
            scale: { duration: 4 + i, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {i % 3 === 0 && <div className="w-8 h-8 bg-blue-400 rounded-full" />}
          {i % 3 === 1 && <div className="w-6 h-6 bg-purple-400 rotate-45" />}
          {i % 3 === 2 && <div className="w-7 h-7 bg-green-400 rounded-sm rotate-12" />}
        </motion.div>
      ))}
      
      {/* Pulsing circles */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200/20 rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.1, 0.2]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-purple-200/20 rounded-full"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.1, 0.3]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </div>
  )
}