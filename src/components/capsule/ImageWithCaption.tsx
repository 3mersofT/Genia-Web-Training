'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, AlertCircle, Loader2, X } from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

// ============= TYPES =============
interface ImageWithCaptionProps {
  url: string
  alt: string
  caption?: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
}

// ============= COMPOSANT PRINCIPAL =============
export default function ImageWithCaption({
  url,
  alt,
  caption,
  width = 800,
  height = 600,
  priority = false,
  className = ''
}: ImageWithCaptionProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // Si priority, charger immédiatement
  const containerRef = useRef<HTMLDivElement>(null)

  // Lazy loading avec Intersection Observer (sauf si priority)
  useEffect(() => {
    if (priority) return // Skip l'observer si priority est true

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            // Une fois visible, on arrête d'observer
            observer.disconnect()
          }
        })
      },
      {
        // Charger l'image 300px avant qu'elle entre dans le viewport
        rootMargin: '300px',
        threshold: 0.01
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [priority])

  // ============= ÉTAT D'ERREUR =============
  if (hasError) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="relative w-full bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800 p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mb-3" />
            <p className="text-red-700 dark:text-red-300 font-medium mb-2">
              Erreur de chargement de l'image
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm">
              Impossible de charger l'image: {url}
            </p>
          </div>
        </div>
        {caption && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 text-center italic">
            {caption}
          </p>
        )}
      </div>
    )
  }

  // ============= PLACEHOLDER AVANT CHARGEMENT LAZY =============
  if (!isInView) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-lg" style={{ aspectRatio: `${width}/${height}` }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        </div>
        {caption && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 text-center italic">
            {caption}
          </p>
        )}
      </div>
    )
  }

  // ============= RENDU PRINCIPAL =============
  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* Image Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative group cursor-pointer"
        onClick={() => setIsLightboxOpen(true)}
      >
        {/* Loading State */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Image */}
        <div className="relative overflow-hidden rounded-lg shadow-lg">
          <Image
            src={url}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            className={`w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setHasError(true)}
            loading={priority ? 'eager' : 'lazy'}
          />

          {/* Zoom Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <div className="bg-white dark:bg-slate-800 rounded-full p-3 shadow-lg">
                <ZoomIn className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Alt Text Tooltip (visible on hover) */}
        <AnimatePresence>
          {imageLoaded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg pointer-events-none"
            >
              <p className="text-white text-sm font-medium">{alt}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Caption */}
      {caption && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-3 text-sm text-gray-600 dark:text-gray-400 text-center italic"
        >
          {caption}
        </motion.p>
      )}

      {/* Lightbox */}
      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        slides={[
          {
            src: url
          }
        ]}
        carousel={{
          finite: true
        }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null
        }}
        controller={{
          closeOnBackdropClick: true
        }}
        styles={{
          container: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)'
          }
        }}
      />
    </div>
  )
}

// ============= EXPORTS =============
export type { ImageWithCaptionProps }
