"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, Zap, Star, Gift } from "lucide-react"

interface MiniGameProps {
  onPointsEarned?: (points: number) => void
}

export default function WaitingMiniGame({ onPointsEarned }: MiniGameProps) {
  const [gameActive, setGameActive] = useState(false)
  const [score, setScore] = useState(0)
  const [targets, setTargets] = useState<Array<{ id: number; x: number; y: number; hit: boolean }>>([])
  const [gameTime, setGameTime] = useState(10)
  const [showReward, setShowReward] = useState(false)

  const startGame = () => {
    setGameActive(true)
    setScore(0)
    setGameTime(10)
    setTargets([])
    generateTarget()
  }

  const generateTarget = () => {
    const newTarget = {
      id: Date.now(),
      x: Math.random() * 200 + 50, // Random position within card
      y: Math.random() * 150 + 50,
      hit: false
    }
    setTargets(prev => [...prev.filter(t => !t.hit), newTarget])
  }

  const hitTarget = (targetId: number) => {
    setTargets(prev => prev.map(t => 
      t.id === targetId ? { ...t, hit: true } : t
    ))
    setScore(prev => prev + 10)
    
    // Generate new target after a short delay
    setTimeout(generateTarget, 500)
  }

  // Game timer
  useEffect(() => {
    if (gameActive && gameTime > 0) {
      const timer = setTimeout(() => setGameTime(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (gameActive && gameTime === 0) {
      // Game over
      setGameActive(false)
      setTargets([])
      if (score > 0) {
        onPointsEarned?.(score)
        setShowReward(true)
        setTimeout(() => setShowReward(false), 3000)
      }
    }
  }, [gameActive, gameTime, score, onPointsEarned])

  // Auto-generate targets during game
  useEffect(() => {
    if (gameActive) {
      const interval = setInterval(() => {
        if (targets.length < 3) {
          generateTarget()
        }
      }, 1500)
      return () => clearInterval(interval)
    }
  }, [gameActive, targets.length])

  return (
    <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-100 border-indigo-200 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-indigo-800">Quick Game</span>
        </div>
        {score > 0 && (
          <Badge className="bg-indigo-200 text-indigo-800">
            {score} points
          </Badge>
        )}
      </div>

      {!gameActive ? (
        <div className="text-center py-8">
          <div className="mb-4">
            <Gift className="w-12 h-12 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-semibold text-indigo-800 mb-2">Earn Bonus Points!</h3>
            <p className="text-sm text-indigo-600">
              Play a quick target game while you wait
            </p>
          </div>
          <Button onClick={startGame} className="bg-indigo-600 hover:bg-indigo-700">
            <Zap className="w-4 h-4 mr-2" />
            Start Game
          </Button>
        </div>
      ) : (
        <div className="relative h-48">
          {/* Game timer */}
          <div className="absolute top-0 right-0 z-10">
            <Badge className="bg-red-500 text-white">
              {gameTime}s
            </Badge>
          </div>

          {/* Game area */}
          <div className="absolute inset-0 bg-indigo-100/50 rounded-lg border-2 border-dashed border-indigo-300">
            <AnimatePresence>
              {targets.map(target => (
                <motion.button
                  key={target.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: target.hit ? 0 : 1, 
                    opacity: target.hit ? 0 : 1,
                    rotate: target.hit ? 180 : 0
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => hitTarget(target.id)}
                  className="absolute w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-lg hover:scale-110 transition-transform"
                  style={{
                    left: target.x,
                    top: target.y,
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                >
                  <Target className="w-4 h-4 text-white mx-auto" />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Score display */}
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-green-500 text-white">
              Score: {score}
            </Badge>
          </div>
        </div>
      )}

      {/* Reward notification */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center"
          >
            <div className="text-center text-white">
              <Star className="w-12 h-12 mx-auto mb-2" />
              <div className="text-xl font-bold">+{score} Bonus Points!</div>
              <div className="text-sm opacity-90">Great job waiting patiently!</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}