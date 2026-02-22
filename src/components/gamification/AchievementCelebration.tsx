'use client'

import { Badge } from '@/types/analytics.types'
import { Trophy, Award, Medal, Star, Crown, Sparkles, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import SocialShareButton from '@/components/gamification/SocialShareButton'

interface AchievementCelebrationProps {
  badge: Badge
  onClose: () => void
  show: boolean
  autoCloseDelay?: number // milliseconds, 0 means no auto-close
}

// Confetti particle component
const ConfettiParticle = ({ delay, color }: { delay: number; color: string }) => {
  const randomX = Math.random() * 100 - 50
  const randomRotate = Math.random() * 360
  const randomDuration = 2 + Math.random() * 2

  return (
    <motion.div
      className={`absolute w-2 h-2 ${color} rounded-sm`}
      style={{
        left: '50%',
        top: '50%'
      }}
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
      animate={{
        opacity: 0,
        x: randomX + 'vw',
        y: ['0vh', '-30vh', '50vh'],
        rotate: randomRotate
      }}
      transition={{
        duration: randomDuration,
        delay: delay,
        ease: 'easeOut'
      }}
    />
  )
}

export default function AchievementCelebration({
  badge,
  onClose,
  show,
  autoCloseDelay = 0
}: AchievementCelebrationProps) {
  const [playSound, setPlaySound] = useState(false)

  // Auto-close logic
  useEffect(() => {
    if (show && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [show, autoCloseDelay, onClose])

  // Sound effect trigger (placeholder for future implementation)
  useEffect(() => {
    if (show) {
      setPlaySound(true)
      // Future: Play celebration sound
      // new Audio('/sounds/achievement.mp3').play()
    }
  }, [show])

  // Get rarity color scheme
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return {
          bg: 'from-gray-50 to-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-700',
          badge: 'bg-gray-500',
          glow: 'shadow-gray-400',
          confetti: ['bg-gray-400', 'bg-gray-500', 'bg-gray-600']
        }
      case 'rare':
        return {
          bg: 'from-blue-50 to-blue-100',
          border: 'border-blue-300',
          text: 'text-blue-700',
          badge: 'bg-blue-500',
          glow: 'shadow-blue-400',
          confetti: ['bg-blue-400', 'bg-blue-500', 'bg-cyan-400']
        }
      case 'epic':
        return {
          bg: 'from-purple-50 to-purple-100',
          border: 'border-purple-300',
          text: 'text-purple-700',
          badge: 'bg-purple-500',
          glow: 'shadow-purple-400',
          confetti: ['bg-purple-400', 'bg-purple-500', 'bg-pink-400']
        }
      case 'legendary':
        return {
          bg: 'from-yellow-50 to-yellow-100',
          border: 'border-yellow-400',
          text: 'text-yellow-700',
          badge: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          glow: 'shadow-yellow-400',
          confetti: ['bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-pink-400']
        }
      default:
        return {
          bg: 'from-gray-50 to-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-700',
          badge: 'bg-gray-500',
          glow: 'shadow-gray-400',
          confetti: ['bg-gray-400', 'bg-gray-500', 'bg-gray-600']
        }
    }
  }

  // Get icon for badge category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'completion':
        return <Trophy className="w-12 h-12" />
      case 'performance':
        return <Star className="w-12 h-12" />
      case 'streak':
        return <Award className="w-12 h-12" />
      case 'social':
        return <Medal className="w-12 h-12" />
      case 'special':
        return <Crown className="w-12 h-12" />
      default:
        return <Trophy className="w-12 h-12" />
    }
  }

  const colors = getRarityColor(badge.rarity)

  // Generate confetti particles
  const confettiCount = badge.rarity === 'legendary' ? 50 : badge.rarity === 'epic' ? 40 : 30
  const confettiParticles = Array.from({ length: confettiCount }, (_, i) => ({
    id: i,
    delay: i * 0.02,
    color: colors.confetti[i % colors.confetti.length]
  }))

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full"
            >
              {/* Confetti Layer */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {confettiParticles.map((particle) => (
                  <ConfettiParticle
                    key={particle.id}
                    delay={particle.delay}
                    color={particle.color}
                  />
                ))}
              </div>

              {/* Achievement Card */}
              <div className={`bg-gradient-to-br ${colors.bg} border-4 ${colors.border} rounded-2xl shadow-2xl ${colors.glow} overflow-hidden`}>
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full transition-all z-10"
                  aria-label="Close celebration"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>

                {/* Header */}
                <div className="relative p-8 text-center">
                  {/* Sparkle Effect */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.2,
                      type: 'spring',
                      stiffness: 200
                    }}
                    className="absolute top-4 left-1/2 transform -translate-x-1/2"
                  >
                    <Sparkles className="w-8 h-8 text-yellow-500" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-gray-900 mb-2"
                  >
                    🎉 Achievement Unlocked!
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-gray-600"
                  >
                    You&apos;ve earned a new badge!
                  </motion.p>
                </div>

                {/* Badge Display */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.5,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15
                  }}
                  className="flex justify-center px-8 pb-6"
                >
                  <div className={`p-8 ${colors.badge} rounded-full text-white shadow-2xl ${colors.glow}`}>
                    {getCategoryIcon(badge.category)}
                  </div>
                </motion.div>

                {/* Badge Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="px-8 pb-6 text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {badge.name}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-bold ${colors.badge} text-white rounded-full uppercase tracking-wide`}>
                      {badge.rarity}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {badge.description}
                  </p>

                  {/* Points Award */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.9,
                      type: 'spring',
                      stiffness: 300
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-lg"
                  >
                    <Star className="w-5 h-5 text-white fill-white" />
                    <span className="text-lg font-bold text-white">
                      +{badge.points} Points
                    </span>
                  </motion.div>
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="px-8 pb-8 flex flex-col gap-3"
                >
                  {/* Social Share */}
                  <div className="flex justify-center">
                    <SocialShareButton
                      shareType="badge"
                      title={badge.name}
                      description={badge.description}
                      data={{
                        badgeName: badge.name,
                        points: badge.points
                      }}
                      compact={false}
                    />
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    Continue Learning
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
