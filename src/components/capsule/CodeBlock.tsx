'use client'

import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Code, AlertCircle } from 'lucide-react'

// ============= TYPES =============
interface CodeBlockProps {
  code: string
  language?: string
  showLineNumbers?: boolean
  title?: string
  highlightLines?: number[]
  className?: string
  theme?: 'light' | 'dark' | 'auto'
}

// ============= SUPPORTED LANGUAGES =============
const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'python',
  'json',
  'html',
  'css',
  'scss',
  'bash',
  'shell',
  'sql',
  'markdown',
  'yaml',
  'xml',
  'java',
  'php',
  'ruby',
  'go',
  'rust',
  'c',
  'cpp',
  'csharp',
  'swift',
  'kotlin'
]

// ============= HELPERS =============
/**
 * Normalise le nom du langage pour la coloration syntaxique
 */
const normalizeLanguage = (lang?: string): string => {
  if (!lang) return 'text'

  const normalized = lang.toLowerCase().trim()

  // Alias communs
  const aliases: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'sh': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'cs': 'csharp',
    'c++': 'cpp',
    'c#': 'csharp'
  }

  const mappedLang = aliases[normalized] || normalized

  return SUPPORTED_LANGUAGES.includes(mappedLang) ? mappedLang : 'text'
}

/**
 * Obtient le nom d'affichage du langage
 */
const getLanguageDisplayName = (lang: string): string => {
  const displayNames: Record<string, string> = {
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'jsx': 'JSX',
    'tsx': 'TSX',
    'python': 'Python',
    'json': 'JSON',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'bash': 'Bash',
    'shell': 'Shell',
    'sql': 'SQL',
    'markdown': 'Markdown',
    'yaml': 'YAML',
    'xml': 'XML',
    'java': 'Java',
    'php': 'PHP',
    'ruby': 'Ruby',
    'go': 'Go',
    'rust': 'Rust',
    'c': 'C',
    'cpp': 'C++',
    'csharp': 'C#',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'text': 'Text'
  }

  return displayNames[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)
}

// ============= COMPOSANT PRINCIPAL =============
export default function CodeBlock({
  code,
  language = 'text',
  showLineNumbers = true,
  title,
  highlightLines = [],
  className = '',
  theme = 'auto'
}: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [hasError, setHasError] = useState(false)

  const normalizedLanguage = normalizeLanguage(language)
  const displayLanguage = getLanguageDisplayName(normalizedLanguage)

  // Déterminer le thème à utiliser
  const getTheme = () => {
    if (theme === 'light') return prism
    if (theme === 'dark') return vscDarkPlus

    // Auto: détecter le mode système (pour simplifier, on utilise dark par défaut)
    // Dans une vraie implémentation, on utiliserait useTheme() ou window.matchMedia
    return vscDarkPlus
  }

  // ============= COPIER LE CODE =============
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      setHasError(true)
      setTimeout(() => setHasError(false), 2000)
    }
  }

  // ============= ÉTAT D'ERREUR =============
  if (!code || code.trim().length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="relative w-full bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-8 h-8 text-yellow-500 dark:text-yellow-400 mb-2" />
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              Aucun code à afficher
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ============= RENDU PRINCIPAL =============
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full group ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-800 dark:bg-slate-900 px-4 py-2 rounded-t-lg border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-slate-400" />
          {title ? (
            <span className="text-sm font-medium text-slate-300">{title}</span>
          ) : (
            <span className="text-sm text-slate-400">{displayLanguage}</span>
          )}
        </div>

        {/* Copy Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors duration-200 text-slate-200 text-sm font-medium"
          aria-label={isCopied ? 'Code copié' : 'Copier le code'}
        >
          <AnimatePresence mode="wait">
            {isCopied ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Copié!</span>
              </motion.div>
            ) : hasError ? (
              <motion.div
                key="error"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400">Erreur</span>
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>Copier</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Code Block */}
      <div className="relative overflow-hidden rounded-b-lg shadow-lg">
        <SyntaxHighlighter
          language={normalizedLanguage}
          style={getTheme()}
          showLineNumbers={showLineNumbers}
          wrapLines={highlightLines.length > 0}
          lineProps={(lineNumber) => {
            const isHighlighted = highlightLines.includes(lineNumber)
            return {
              style: {
                display: 'block',
                backgroundColor: isHighlighted ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderLeft: isHighlighted ? '3px solid rgb(59, 130, 246)' : 'none',
                paddingLeft: isHighlighted ? '0.5rem' : '0'
              }
            }
          }}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            borderRadius: '0 0 0.5rem 0.5rem',
            maxHeight: '600px',
            overflow: 'auto'
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            }
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {/* Language Badge (visible en bas à droite au survol) */}
      {!title && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-slate-700/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-slate-300 font-mono">
            {displayLanguage}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ============= EXPORTS =============
export { normalizeLanguage, getLanguageDisplayName, SUPPORTED_LANGUAGES }
export type { CodeBlockProps }
