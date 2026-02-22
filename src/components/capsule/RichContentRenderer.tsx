'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

// Import multimedia types
import type { MultimediaBlock } from '@/types/multimedia.types'

// Import renderer components
import VideoEmbed from './VideoEmbed'
import ImageWithCaption from './ImageWithCaption'
import CodeBlock from './CodeBlock'
import PromptPlayground from './PromptPlayground'
import DownloadableAttachment from './DownloadableAttachment'

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
   */
  const renderBlock = (block: MultimediaBlock) => {
    try {
      switch (block.type) {
        case 'video':
          return (
            <VideoEmbed
              url={block.url}
              title={block.title}
              autoplay={block.autoplay}
              className="w-full"
            />
          )

        case 'image':
          return (
            <ImageWithCaption
              url={block.url}
              alt={block.alt}
              caption={block.caption}
              width={block.width}
              height={block.height}
              priority={block.priority}
              className="w-full"
            />
          )

        case 'code':
          return (
            <CodeBlock
              code={block.code}
              language={block.language}
              title={block.title}
              showLineNumbers={block.showLineNumbers}
              highlightLines={block.highlightLines}
              className="w-full"
            />
          )

        case 'playground':
          return (
            <PromptPlayground
              title={block.title}
              description={block.description}
              starterPrompt={block.starterPrompt}
              expectedOutput={block.expectedOutput}
              className="w-full"
            />
          )

        case 'attachment':
          return (
            <DownloadableAttachment
              url={block.url}
              filename={block.filename}
              fileSize={block.fileSize}
              description={block.description}
              className="w-full"
            />
          )

        default:
          // Type non reconnu - afficher un message d'erreur
          return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
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
