'use client'

import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
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
}

/**
 * Composant ChatMessageList
 *
 * Affiche la liste des messages avec auto-scroll automatique.
 * Supporte le formatage Markdown, les indicateurs de méthode GENIA,
 * et le raisonnement CoT pour les modèles experts.
 *
 * @example
 * ```tsx
 * <ChatMessageList
 *   messages={messages}
 *   isLoading={isLoading}
 *   loadingText="GENIA réfléchit..."
 * />
 * ```
 */
export default function ChatMessageList({
  messages,
  isLoading = false,
  loadingText = "GENIA réfléchit..."
}: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Fait défiler vers le bas de la liste des messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Déclenche le scroll à chaque mise à jour des messages
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                ? 'bg-gray-100 text-gray-700'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}
          >
            {/* Method Step Indicator */}
            {message.methodStep && message.role === 'assistant' && (
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${GENIA_METHOD[message.methodStep].color} text-white text-xs mb-2`}>
                <span>{GENIA_METHOD[message.methodStep].icon}</span>
                <span>{GENIA_METHOD[message.methodStep].name}</span>
              </div>
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
            </div>

            {/* CoT Reasoning for Magistral */}
            {message.reasoning && (
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Voir le raisonnement...
                </summary>
                <div className="mt-2 p-2 bg-gray-50 rounded text-gray-600 whitespace-pre-wrap">
                  {message.reasoning}
                </div>
              </details>
            )}

            {/* Timestamp */}
            <div className="text-xs opacity-50 mt-2">
              {message.timestamp.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            <span className="text-gray-500">{loadingText}</span>
          </div>
        </div>
      )}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
