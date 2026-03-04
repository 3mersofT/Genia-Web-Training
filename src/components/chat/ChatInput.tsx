'use client'

import React, { KeyboardEvent, ChangeEvent, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';

// ============= TYPES =============
export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

// ============= COMPOSANT =============
export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder,
  className = "",
  'aria-label': ariaLabel
}: ChatInputProps) {
  const t = useTranslations('chat');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  /**
   * Gère les événements clavier avec comportement différent selon les touches
   * - Enter seul : envoie le message
   * - Shift+Enter : ajoute une nouvelle ligne
   * - Ctrl/Alt/Meta+Enter : comportement par défaut (pas d'envoi)
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Seulement Enter sans aucun modificateur
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      // Vérifie explicitement que le contenu n'est pas vide après trim
      if (value.trim().length > 0 && !disabled) {
        onSend();
      }
    }
    // Shift+Enter et autres combinaisons sont gérés par défaut par le textarea
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleSendClick = () => {
    if (value.trim().length > 0 && !disabled) {
      onSend();
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t('placeholder')}
        disabled={disabled}
        rows={1}
        className="flex-1 px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus-visible:ring-ring focus:border-transparent resize-none overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ minHeight: '42px', maxHeight: '120px' }}
        aria-label={ariaLabel}
      />
      <button
        onClick={handleSendClick}
        disabled={!value.trim() || disabled}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        aria-label={t('send')}
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
