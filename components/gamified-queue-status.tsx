"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Users, Trophy, Star, Zap, Gift, Target, Award } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useHybridQueueListener } from "@/hooks/use-hybrid-queue-listener"
import { useLocalQueue } from "@/hooks/use-local-queue"

interface GamifiedQueueStatusProps {
  queueId: string
  businessName: string
}

export default function GamifiedQueueStatus({ queueId, businessName }: GamifiedQueueStatusProps) {
  const { queueData, loading, error, connected, previousPosition, wasJustCalled } = useHybridQueueListener(queueId)
  const { leaveQueue } = useLocalQueue()
  
  const [points, setPoints] = useState(0)
  const [level, setLevel] = useState(1)
  const [achievements, setAchievements] = useState<string[]>([])
  const [showAchievement, setShowAchievement] = useState<string | null>(null)
  const [waitTime, setWaitTime] = useState(0)

  // Calculate progress and rewards
  useEffect(() => {
    if (queueData) {
      const totalWaitTime = Math.floor((Date.now() - queueData.joinedAt.getTime()) / 60000)
      setWaitTime(totalWaitTime)
      
      // Award points for waiting
      const newPoints = Math.floor(totalWaitTime * 10) + (previousPosition ? (previousPosition - queueData.position) * 50 : 0)
      setPoints(newPoints)
      
      // Calculate level
      const newLevel = Math.floor(newPoints / 100) + 1
      if (newLevel > level) {
        setLevel(newLevel)
        triggerAchievement(`Level ${newLevel} Reached!`)
      }
      
      // Check for achievements
      checkAchievements(totalWaitTime, queueData.position, newPoints)
    }
  }, [queueData, previousPosition, level])

  const checkAchievements = (waitTime: number, position: number, points: number) => {
    const newAchievements = [...achievements]
    
    if (waitTime >= 5 && !achievements.includes('patient')) {
      newAchievements.push('patient')
      triggerAchievement('Patient Waiter - 5 minutes!')
    }
    
    if (position === 1 && !achievements.includes('nextUp')) {
      newAchievements.push('nextUp')
      triggerAchievement("You're Next! 🎉")
    }
    
    if (points >= 100 && !achievements.includes('centurion')) {
      newAchievements.push('centurion')
      triggerAchievement('Centurion - 100 points!')
    }
    
    if (previousPosition && previousPosition > position && !achievements.includes('mover')) {
      newAchievements.push('mover')
      triggerAchievement('Position Climber!')
    }
    
    setAchievements(newAchievements)
  }

  const triggerAchievement = (achievement: string) => {
    setShowAchievement(achievement)
    setTimeout(() => setShowAchievement(null), 3000)
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getProgressPercentage = () => {
    if (!queueData) return 0
    return Math.max(0, 100 - (queueData.position - 1) * 20)
  }

  const getLevelProgress = () => {
    return (points % 100) / 100 * 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (error || !queueData) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <p className="text-red-600">{error || 'Queue not found'}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Achievement Notification */}
      <AnimatePresence>
        {showAchievement && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <Card className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6" />
                <span className="font-bold">{showAchievement}</span>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Called Notification */}
      <AnimatePresence>
        {wasJustCalled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 animate-bounce" />
              <h3 className="text-xl font-bold">🎉 You've Been Called!</h3>
            </div>
            <p className="text-blue-100">It's your turn! Please proceed to the service area.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Status Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200">
        {/* Header with business info */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full"
                animate={{
                  x: [0, Math.random() * 400],
                  y: [0, Math.random() * 200],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">{businessName}</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-sm opacity-90">
                {connected ? 'Live Updates' : 'Reconnecting...'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Position Display with Animation */}
          <div className="text-center">
            <motion.div
              key={queueData.position}
              initial={{ scale: 1.2, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="relative inline-block mb-4"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden">
                {/* Animated ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 border-2 border-white/30 rounded-full"
                />
                
                <div className="text-center z-10">
                  <div className="text-4xl font-bold text-white">#{queueData.position}</div>
                  <div className="text-xs text-white/80">in line</div>
                </div>
                
                {queueData.position === 1 && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
                  >
                    <Star className="w-4 h-4 text-yellow-800" />
                  </motion.div>
                )}
              </div>
            </motion.div>

            {queueData.position === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <Badge className="bg-yellow-400 text-yellow-900 text-lg px-4 py-2 animate-pulse">
                  🎯 You're Next!
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Queue Progress</span>
              <span className="font-medium">{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/30"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm text-green-600">Est. Wait</div>
                  <div className="text-lg font-bold text-green-800">
                    {formatTime(queueData.estimatedWaitTime)}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-sm text-purple-600">Wait Time</div>
                  <div className="text-lg font-bold text-purple-800">
                    {formatTime(waitTime)}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Gamification Section */}
          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Level {level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">{points} pts</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-yellow-700">
                  <span>Level Progress</span>
                  <span>{points % 100}/100</span>
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-2">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${getLevelProgress()}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              
              <div className="text-xs text-yellow-700">
                🎯 Earn points by waiting patiently and moving up in line!
              </div>
            </div>
          </Card>

          {/* Achievements */}
          {achievements.length > 0 && (
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-indigo-800">Achievements</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Badge variant="secondary" className="bg-indigo-200 text-indigo-800">
                      {achievement === 'patient' && '⏰ Patient'}
                      {achievement === 'nextUp' && '🎯 Next Up'}
                      {achievement === 'centurion' && '💯 Centurion'}
                      {achievement === 'mover' && '📈 Climber'}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          {/* Action Button */}
          <Button
            onClick={leaveQueue}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
          >
            Leave Queue
          </Button>
        </div>
      </Card>
    </div>
  )
}