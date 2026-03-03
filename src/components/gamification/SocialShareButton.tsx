'use client'

import { Share2, Twitter, Linkedin, Facebook, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface SocialShareButtonProps {
  shareType: 'achievement' | 'level-up' | 'tournament' | 'badge' | 'team'
  title: string
  description?: string
  data?: {
    points?: number
    level?: string
    rank?: number
    badgeName?: string
    tournamentName?: string
    teamName?: string
  }
  url?: string
  compact?: boolean
  showLabel?: boolean
}

export default function SocialShareButton({
  shareType,
  title,
  description,
  data = {},
  url,
  compact = false,
  showLabel = true
}: SocialShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Generate share text based on type
  const generateShareText = (): string => {
    const baseUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
    let text = ''

    switch (shareType) {
      case 'achievement':
        text = `🎯 J'ai débloqué "${title}" sur GENIA! ${description ? description : ''}`
        if (data.points) text += ` (+${data.points} points)`
        break
      case 'level-up':
        text = `🚀 Je viens d'atteindre le niveau "${data.level || title}" sur GENIA!`
        if (data.points) text += ` J'ai accumulé ${data.points} XP!`
        break
      case 'tournament':
        text = `🏆 ${data.rank === 1 ? 'Victoire' : `${data.rank}ème place`} au tournoi "${data.tournamentName || title}" sur GENIA!`
        break
      case 'badge':
        text = `⭐ J'ai gagné le badge "${data.badgeName || title}" sur GENIA!`
        if (description) text += ` ${description}`
        break
      case 'team':
        text = `👥 Mon équipe "${data.teamName || title}" performe sur GENIA!`
        if (data.rank) text += ` Classement: ${data.rank}ème`
        break
      default:
        text = `🎓 ${title} sur GENIA - La plateforme d'apprentissage du Prompt Engineering!`
    }

    text += ` 🔗 ${baseUrl}`
    return text
  }

  // Get platform-specific share URLs
  const getShareUrl = (platform: 'twitter' | 'linkedin' | 'facebook'): string => {
    const text = generateShareText()
    const encodedText = encodeURIComponent(text)
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
    const encodedUrl = encodeURIComponent(currentUrl)

    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedText}`
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`
      default:
        return ''
    }
  }

  // Handle share click
  const handleShare = (platform: 'twitter' | 'linkedin' | 'facebook') => {
    const shareUrl = getShareUrl(platform)
    window.open(shareUrl, '_blank', 'width=600,height=400')
    setIsOpen(false)
  }

  // Copy to clipboard
  const handleCopyLink = async () => {
    const text = generateShareText()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Get icon color based on share type
  const getTypeColor = () => {
    switch (shareType) {
      case 'achievement':
        return 'text-yellow-600'
      case 'level-up':
        return 'text-purple-600'
      case 'tournament':
        return 'text-blue-600'
      case 'badge':
        return 'text-orange-600'
      case 'team':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-muted-foreground'
    }
  }

  // Compact version (icon button only)
  if (compact) {
    return (
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-lg bg-card border border-input hover:bg-accent transition-colors ${getTypeColor()}`}
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border z-50 overflow-hidden">
              <button
                onClick={() => handleShare('twitter')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left"
              >
                <Twitter className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span className="text-sm font-medium text-foreground">Twitter</span>
              </button>

              <button
                onClick={() => handleShare('linkedin')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left"
              >
                <Linkedin className="w-5 h-5 text-blue-700" />
                <span className="text-sm font-medium text-foreground">LinkedIn</span>
              </button>

              <button
                onClick={() => handleShare('facebook')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left"
              >
                <Facebook className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-foreground">Facebook</span>
              </button>

              <div className="border-t border-border" />

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-green-500 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Copié!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Copier le texte</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // Full version with label
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
      >
        <Share2 className="w-4 h-4" />
        {showLabel && <span className="text-sm font-medium">Partager</span>}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Share Dialog */}
          <div className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-xl border border-border z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <div className="flex items-center gap-2">
                <Share2 className={`w-5 h-5 ${getTypeColor()}`} />
                <h3 className="font-semibold text-foreground">Partager votre succès</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{title}</p>
            </div>

            {/* Social Platforms */}
            <div className="p-2">
              <button
                onClick={() => handleShare('twitter')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left group"
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Twitter className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Twitter</p>
                  <p className="text-xs text-muted-foreground">Partagez avec vos followers</p>
                </div>
              </button>

              <button
                onClick={() => handleShare('linkedin')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left group"
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Linkedin className="w-5 h-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">LinkedIn</p>
                  <p className="text-xs text-muted-foreground">Partagez sur votre réseau professionnel</p>
                </div>
              </button>

              <button
                onClick={() => handleShare('facebook')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left group"
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Facebook className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Facebook</p>
                  <p className="text-xs text-muted-foreground">Partagez avec vos amis</p>
                </div>
              </button>

              <div className="border-t border-border my-2" />

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left group"
              >
                <div className={`p-2 ${copied ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'} rounded-lg group-hover:bg-accent transition-colors`}>
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500 dark:text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${copied ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                    {copied ? 'Copié!' : 'Copier le texte'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {copied ? 'Le texte a été copié' : 'Copiez le texte de partage'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
