'use client'

import React, { useEffect, useRef } from 'react';
import { Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Message } from '@/types/chat.types';
import { GENIA_METHOD } from '@/constants/geniaMethod';

/**
 * Props pour le composant ChatMessageList
 */
export interface ChatMessageListProps {
  /** Liste des messages à afficher */
  messages: Message[];
  /** Indique si un message est en cours de chargement */
  isLoading?: boolean;
  /** Texte à afficher pendant le chargement (optionnel) */
  loadingText?: string;
  /** Callback pour envoyer un feedback */
  onFeedback?: (messageId: string, feedback: 'up' | 'down') => void;
}

/**
 * Composant ChatMessageList
 *
 * Affiche la liste des messages avec auto-scroll automatique.
 * Supporte le formatage Markdown, les indicateurs de méthode GENIA,
 * le raisonnement CoT, le streaming avec curseur animé, et le feedback.
 */
export default function ChatMessageList({
  messages,
  isLoading = false,
  loadingText = "GENIA réfléchit...",
  onFeedback,
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-4"
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              message.role === 'user'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : message.role === 'system'
                ? 'bg-muted text-foreground'
                : 'bg-card border border-border text-foreground'
            }`}
          >
            {/* Method Step Indicator */}
            {message.methodStep && message.role === 'assistant' && (
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${GENIA_METHOD[message.methodStep].color} text-white text-xs mb-2`}>
                <span>{GENIA_METHOD[message.methodStep].icon}</span>
                <span>{GENIA_METHOD[message.methodStep].name}</span>
              </div>
            )}

            {/* Provider Badge */}
            {message.provider && message.role === 'assistant' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground ml-2 mb-2">
                via {message.provider}
              </span>
            )}

            {/* Message Content */}
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                  strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
              {/* Streaming Cursor */}
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse rounded-sm ml-0.5" />
              )}
            </div>

            {/* CoT Reasoning for Magistral */}
            {message.reasoning && (
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-accent-foreground">
                  Voir le raisonnement...
                </summary>
                <div className="mt-2 p-2 bg-muted rounded text-muted-foreground whitespace-pre-wrap">
                  {message.reasoning}
                </div>
              </details>
            )}

            {/* Footer: Timestamp + Feedback */}
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs opacity-50">
                {message.timestamp.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              {/* Feedback Buttons (assistant messages only, not streaming) */}
              {message.role === 'assistant' && !message.isStreaming && onFeedback && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onFeedback(message.id, 'up')}
                    className={`p-1 rounded transition-colors ${
                      message.feedback === 'up'
                        ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30'
                        : 'text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                    }`}
                    title="Bonne réponse"
                    aria-label="Marquer comme bonne réponse"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onFeedback(message.id, 'down')}
                    className={`p-1 rounded transition-colors ${
                      message.feedback === 'down'
                        ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                        : 'text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                    }`}
                    title="Mauvaise réponse"
                    aria-label="Marquer comme mauvaise réponse"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Loading Indicator */}
      {isLoading && !messages.some(m => m.isStreaming) && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">{loadingText}</span>
          </div>
        </div>
      )}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
