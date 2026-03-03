'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileText, FileCode, FileImage, FileVideo, FileArchive, File, AlertCircle, CheckCircle } from 'lucide-react'

// ============= TYPES =============
interface DownloadableAttachmentProps {
  url: string
  filename: string
  fileSize?: number
  mimeType?: string
  description?: string
  className?: string
}

// ============= HELPERS =============
function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Taille inconnue'

  const units = ['o', 'Ko', 'Mo', 'Go']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

function getFileIcon(filename: string, mimeType?: string) {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
    return FileImage
  }
  if (mimeType?.startsWith('video/') || ['mp4', 'webm', 'avi', 'mov'].includes(ext || '')) {
    return FileVideo
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext || '')) {
    return FileArchive
  }
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb', 'swift'].includes(ext || '')) {
    return FileCode
  }
  if (['txt', 'pdf', 'doc', 'docx', 'md'].includes(ext || '')) {
    return FileText
  }

  return File
}

// ============= COMPOSANT PRINCIPAL =============
export default function DownloadableAttachment({
  url,
  filename,
  fileSize,
  mimeType,
  description,
  className = ''
}: DownloadableAttachmentProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadComplete, setDownloadComplete] = useState(false)
  const [hasError, setHasError] = useState(false)

  const FileIcon = getFileIcon(filename, mimeType)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      setHasError(false)

      const response = await fetch(url)
      if (!response.ok) throw new Error('Échec du téléchargement')

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      setDownloadComplete(true)
      setTimeout(() => setDownloadComplete(false), 3000)
    } catch (error) {
      setHasError(true)
    } finally {
      setIsDownloading(false)
    }
  }

  // ============= ÉTAT D'ERREUR =============
  if (hasError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full ${className}`}
      >
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300 font-medium text-sm">
                Erreur de téléchargement
              </p>
              <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                Impossible de télécharger le fichier: {filename}
              </p>
            </div>
            <button
              onClick={() => setHasError(false)}
              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  // ============= RENDU PRINCIPAL =============
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full ${className}`}
    >
      <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-colors duration-200">
        <div className="p-4 flex items-center gap-4">
          {/* File Icon */}
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 flex-shrink-0">
            <FileIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground text-sm truncate">
              {filename}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {formatFileSize(fileSize)}
              </span>
              {mimeType && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {mimeType.split('/')[1]?.toUpperCase() || 'Fichier'}
                  </span>
                </>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {description}
              </p>
            )}
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading || downloadComplete}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex-shrink-0 ${
              downloadComplete
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95'
            } ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {downloadComplete ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Téléchargé</span>
              </>
            ) : (
              <>
                <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                <span>{isDownloading ? 'En cours...' : 'Télécharger'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ============= EXPORTS =============
export type { DownloadableAttachmentProps }
