'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Edit3,
  RotateCcw,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Info,
  Zap
} from 'lucide-react'
import { useGENIA } from '@/components/providers/GENIAProvider'

// ============= TYPES =============
interface PromptPlaygroundProps {
  starterPrompt: string
  title?: string
  description?: string
  expectedOutput?: string
  concepts?: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  className?: string
  onTryPrompt?: (prompt: string) => void
}

// ============= DIFFICULTÉ BADGES =============
const DIFFICULTY_CONFIG = {
  beginner: {
    label: 'Débutant',
    color: 'from-green-500 to-green-600',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '🌱'
  },
  intermediate: {
    label: 'Intermédiaire',
    color: 'from-yellow-500 to-yellow-600',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: '🔥'
  },
  advanced: {
    label: 'Avancé',
    color: 'from-red-500 to-red-600',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: '🚀'
  }
}

// ============= COMPOSANT PRINCIPAL =============
export default function PromptPlayground({
  starterPrompt,
  title = 'Testez ce prompt',
  description,
  expectedOutput,
  concepts = [],
  difficulty = 'beginner',
  className = '',
  onTryPrompt
}: PromptPlaygroundProps) {
  const [currentPrompt, setCurrentPrompt] = useState(starterPrompt)
  const [isEditing, setIsEditing] = useState(false)
  const [showExpectedOutput, setShowExpectedOutput] = useState(false)
  const [charCount, setCharCount] = useState(starterPrompt.length)
  const { updateContext } = useGENIA()

  const difficultyConfig = DIFFICULTY_CONFIG[difficulty]

  // ============= GESTION DU PROMPT =============
  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setCurrentPrompt(newValue)
    setCharCount(newValue.length)
  }, [])

  const handleReset = useCallback(() => {
    setCurrentPrompt(starterPrompt)
    setCharCount(starterPrompt.length)
    setIsEditing(false)
  }, [starterPrompt])

  // ============= ESSAYER AVEC GENIA =============
  const handleTryWithGENIA = useCallback(() => {
    // Mettre à jour le contexte GENIA avec les concepts du playground
    if (concepts.length > 0) {
      updateContext({
        playgroundContext: {
          concepts,
          difficulty,
          userPrompt: currentPrompt,
          starterPrompt
        }
      })
    }

    // Si une fonction de callback est fournie, l'appeler
    if (onTryPrompt) {
      onTryPrompt(currentPrompt)
    }

    // Simuler l'ouverture du chat GENIA avec le prompt
    // Le bouton GENIA flottant va détecter ce contexte via le provider
    const event = new CustomEvent('genia:openChat', {
      detail: {
        initialMessage: currentPrompt,
        context: {
          type: 'playground',
          concepts,
          difficulty,
          starterPrompt
        }
      }
    })
    window.dispatchEvent(event)
  }, [currentPrompt, concepts, difficulty, starterPrompt, updateContext, onTryPrompt])

  // ============= ÉTAT VIDE =============
  if (!starterPrompt || starterPrompt.trim().length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="relative w-full bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-8 h-8 text-yellow-500 dark:text-yellow-400 mb-2" />
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              Aucun prompt de démarrage fourni
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ============= RENDU PRINCIPAL =============
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`w-full ${className}`}
    >
      {/* Carte principale */}
      <div className="relative w-full bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-slate-800 rounded-xl border-2 border-blue-200 dark:border-blue-900 shadow-lg overflow-hidden">

        {/* Header avec gradient */}
        <div className={`bg-gradient-to-r ${difficultyConfig.color} p-4 text-white`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              {description && (
                <p className="text-sm text-white/90 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {/* Badge de difficulté */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium border border-white/30`}>
              <span>{difficultyConfig.icon}</span>
              <span>{difficultyConfig.label}</span>
            </div>
          </div>

          {/* Concepts tags */}
          {concepts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {concepts.map((concept, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-md text-xs font-medium border border-white/30"
                >
                  {concept}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Zone d'édition du prompt */}
        <div className="p-6 space-y-4">
          {/* Textarea */}
          <div className="relative">
            <label className="block text-sm font-medium text-foreground mb-2">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                <span>Votre prompt</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {charCount} caractères
                </span>
              </div>
            </label>

            <textarea
              value={currentPrompt}
              onChange={handlePromptChange}
              onFocus={() => setIsEditing(true)}
              onBlur={() => setIsEditing(currentPrompt === starterPrompt ? false : true)}
              className={`
                w-full min-h-[150px] px-4 py-3
                bg-white dark:bg-slate-800
                border-2 rounded-lg
                text-foreground
                placeholder-gray-400 dark:placeholder-gray-500
                resize-y
                transition-all duration-200
                focus:outline-none focus:ring-2 focus-visible:ring-ring focus:border-transparent
                ${isEditing
                  ? 'border-blue-400 dark:border-blue-600 shadow-md'
                  : 'border-input'
                }
              `}
              placeholder="Écrivez ou modifiez votre prompt ici..."
              rows={6}
            />

            {/* Indicateur de modification */}
            <AnimatePresence>
              {currentPrompt !== starterPrompt && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute -top-2 left-3 px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  Modifié
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Bouton principal: Essayer avec GENIA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTryWithGENIA}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Play className="w-5 h-5" />
              <span>Essayer avec GENIA</span>
            </motion.button>

            {/* Bouton reset */}
            {currentPrompt !== starterPrompt && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-accent dark:bg-slate-700 dark:hover:bg-slate-600 text-foreground font-medium rounded-lg transition-colors duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Réinitialiser</span>
              </motion.button>
            )}
          </div>

          {/* Expected Output (optionnel) */}
          {expectedOutput && (
            <div className="mt-4">
              <button
                onClick={() => setShowExpectedOutput(!showExpectedOutput)}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                <Info className="w-4 h-4" />
                <span>
                  {showExpectedOutput ? 'Masquer' : 'Voir'} le résultat attendu
                </span>
              </button>

              <AnimatePresence>
                {showExpectedOutput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                          Résultat attendu :
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-400 leading-relaxed whitespace-pre-wrap">
                          {expectedOutput}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer avec tips */}
        <div className="px-6 pb-4">
          <div className="flex items-start gap-2 p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <strong>Astuce :</strong> Modifiez le prompt ci-dessus pour expérimenter différentes formulations,
              puis cliquez sur "Essayer avec GENIA" pour obtenir une réponse personnalisée et des conseils d'amélioration.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============= EXPORTS =============
export type { PromptPlaygroundProps }
