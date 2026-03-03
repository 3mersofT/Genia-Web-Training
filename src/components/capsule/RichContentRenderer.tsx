'use client'

import React, { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Loader2 } from 'lucide-react'

// Import multimedia types
import type { MultimediaBlock } from '@/types/multimedia.types'

// Dynamic imports for code splitting - components only loaded when needed
const VideoEmbed = lazy(() => import('./VideoEmbed'))
const ImageWithCaption = lazy(() => import('./ImageWithCaption'))
const CodeBlock = lazy(() => import('./CodeBlock'))
const PromptPlayground = lazy(() => import('./PromptPlayground'))
const DownloadableAttachment = lazy(() => import('./DownloadableAttachment'))

// Loading placeholder component
const LoadingPlaceholder = () => (
  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-8 flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
)

// ============= TYPES =============
interface RichContentRendererProps {
  blocks: MultimediaBlock[]
  className?: string
}

// ============= ANIMATIONS =============
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  }
}

// ============= COMPOSANT PRINCIPAL =============
export default function RichContentRenderer({
  blocks,
  className = ''
}: RichContentRendererProps) {
  // Gestion du cas vide
  if (!blocks || blocks.length === 0) {
    return null
  }

  /**
   * Rend un bloc multimédia selon son type
   * Wrapped in Suspense for lazy loading optimization
   */
  const renderBlock = (block: MultimediaBlock) => {
    try {
      switch (block.type) {
        case 'video':
          return (
            <Suspense fallback={<LoadingPlaceholder />}>
              <VideoEmbed
                url={block.url}
                title={block.title}
                autoplay={block.autoplay}
                className="w-full"
              />
            </Suspense>
          )

        case 'image':
          return (
            <Suspense fallback={<LoadingPlaceholder />}>
              <ImageWithCaption
                url={block.url}
                alt={block.alt}
                caption={block.caption}
                width={block.width}
                height={block.height}
                priority={block.priority}
                className="w-full"
              />
            </Suspense>
          )

        case 'code':
          return (
            <Suspense fallback={<LoadingPlaceholder />}>
              <CodeBlock
                code={block.code}
                language={block.language}
                title={block.title}
                showLineNumbers={block.showLineNumbers}
                highlightLines={block.highlightLines}
                className="w-full"
              />
            </Suspense>
          )

        case 'playground':
          return (
            <Suspense fallback={<LoadingPlaceholder />}>
              <PromptPlayground
                title={block.title}
                description={block.description}
                starterPrompt={block.starterPrompt}
                expectedOutput={block.expectedOutput}
                className="w-full"
              />
            </Suspense>
          )

        case 'attachment':
          return (
            <Suspense fallback={<LoadingPlaceholder />}>
              <DownloadableAttachment
                url={block.url}
                filename={block.filename}
                fileSize={block.fileSize}
                description={block.description}
                className="w-full"
              />
            </Suspense>
          )

        default:
          // Type non reconnu - afficher un message d'erreur
          return (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">
                  Type de contenu non reconnu: {(block as any).type}
                </p>
              </div>
            </div>
          )
      }
    } catch (error) {
      // Gestion des erreurs de rendu
      console.error('Erreur lors du rendu du bloc multimédia:', error)
      return (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              Erreur lors du rendu du contenu multimédia
            </p>
          </div>
        </div>
      )
    }
  }

  return (
    <motion.div
      className={`space-y-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {blocks.map((block) => (
        <motion.div
          key={block.id}
          variants={itemVariants}
          className="multimedia-block"
        >
          {renderBlock(block)}
        </motion.div>
      ))}
    </motion.div>
  )
}

// ============= EXPORTS NOMMÉS =============
export type { RichContentRendererProps }
