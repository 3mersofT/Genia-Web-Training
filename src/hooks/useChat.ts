'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Message, ChatContext, QuotaInfo, StreamEvent, SmartSuggestion } from '@/types/chat.types';
import { generateSmartSuggestions } from '@/lib/smart-suggestions';

/**
 * Options de configuration pour le hook useChat
 */
export interface UseChatOptions {
  initialContext?: Partial<ChatContext>;
  conversationId?: string;
  autoLoadQuotas?: boolean;
  enableEnhancedGENIA?: boolean;
  enableStreaming?: boolean;
}

/**
 * Interface de retour du hook useChat
 */
export interface UseChatReturn {
  // État
  user: User | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  context: ChatContext;
  quota: QuotaInfo;
  currentModel: 'magistral-medium' | 'mistral-medium-3';
  suggestions: SmartSuggestion[];

  // Actions
  sendMessage: (content: string) => Promise<void>;
  setCurrentModel: (model: 'magistral-medium' | 'mistral-medium-3') => void;
  loadQuotas: () => Promise<void>;
  clearError: () => void;
  resetConversation: () => void;
  sendFeedback: (messageId: string, feedback: 'up' | 'down') => Promise<void>;
  exportChat: (format: 'markdown' | 'pdf') => void;
}

/**
 * Contexte GENIA par défaut
 */
const DEFAULT_CONTEXT: ChatContext = {
  currentCapsule: {
    id: 'general',
    title: 'Formation GENIA',
    concepts: ['Prompt Engineering', 'Méthode GENIA'],
    difficulty: 'beginner'
  },
  userLevel: 'beginner',
  completedCapsules: 0,
  totalCapsules: 36,
  streakDays: 0
};

/**
 * Message système initial
 */
const INITIAL_SYSTEM_MESSAGE: Message = {
  id: '1',
  role: 'system',
  content: `Bonjour ! Je suis GENIA, ton assistant formateur en Prompt Engineering. 🎓

J'utilise la méthode GENIA pour t'accompagner :
• **G**uide progressif 📘
• **E**xemples concrets 🔍
• **N**iveau adaptatif 📊
• **I**nteraction pratique ⚡
• **A**ssessment continu ✅

Comment puis-je t'aider aujourd'hui ?`,
  timestamp: new Date(),
  methodStep: 'G'
};

/**
 * Hook personnalisé pour gérer le chat GENIA avec état, quotas et envoi de messages
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    initialContext,
    conversationId: initialConversationId,
    autoLoadQuotas = true,
    enableStreaming = true
  } = options;

  // ============================================
  // ÉTATS
  // ============================================
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([INITIAL_SYSTEM_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [currentModel, setCurrentModel] = useState<'magistral-medium' | 'mistral-medium-3'>(
    'mistral-medium-3'
  );
  const [quota, setQuota] = useState<QuotaInfo>({
    magistralMedium: { used: 0, daily: 0 },
    mistralMedium3: { used: 0, daily: 0 }
  });
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);

  // Contexte combinant le contexte par défaut et celui fourni
  const [context] = useState<ChatContext>({
    ...DEFAULT_CONTEXT,
    ...initialContext,
    currentCapsule: {
      ...DEFAULT_CONTEXT.currentCapsule,
      ...initialContext?.currentCapsule
    }
  });

  // ============================================
  // REFS
  // ============================================
  const abortController = useRef<AbortController | null>(null);

  // ============================================
  // GESTION DE L'AUTHENTIFICATION
  // ============================================
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ============================================
  // CHARGEMENT DES QUOTAS
  // ============================================
  const loadQuotas = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/quotas?userId=${user.id}`);
      if (!response.ok) return;

      const data = await response.json();
      setQuota({
        magistralMedium: {
          used: data.quotas['magistral-medium']?.used || 0,
          daily: data.quotas['magistral-medium']?.limit || 0
        },
        mistralMedium3: {
          used: data.quotas['mistral-medium-3']?.used || 0,
          daily: data.quotas['mistral-medium-3']?.limit || 0
        }
      });
    } catch (error) {
      console.error('Erreur chargement quotas:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (autoLoadQuotas) {
      loadQuotas();
    }
  }, [loadQuotas, autoLoadQuotas]);

  // ============================================
  // DÉTECTION DU PILIER GENIA
  // ============================================
  const detectGENIAStep = useCallback((query: string): 'G' | 'E' | 'N' | 'I' | 'A' => {
    if (query.includes('exemple') || query.includes('montre')) return 'E';
    if (query.includes('exercice') || query.includes('pratique')) return 'I';
    if (query.includes('évalue') || query.includes('correct')) return 'A';
    if (query.includes('niveau') || query.includes('difficile')) return 'N';
    return 'G';
  }, []);

  // ============================================
  // SÉLECTION AUTOMATIQUE DU MODÈLE
  // ============================================
  const selectOptimalModel = useCallback(
    (query: string): 'magistral-medium' | 'mistral-medium-3' => {
      const needsExpertModel =
        query.includes('pourquoi') ||
        query.includes('explique en détail') ||
        query.includes('raisonnement') ||
        query.includes('complexe') ||
        (context.userLevel === 'beginner' && query.includes('comprends pas'));

      if (needsExpertModel && quota.magistralMedium.used < quota.magistralMedium.daily) {
        return 'magistral-medium';
      }

      return 'mistral-medium-3';
    },
    [context.userLevel, quota.magistralMedium]
  );

  // ============================================
  // UPDATE SUGGESTIONS AFTER EACH RESPONSE
  // ============================================
  const updateSuggestions = useCallback(
    (lastAssistantContent: string, userQuery: string) => {
      const newSuggestions = generateSmartSuggestions(
        lastAssistantContent,
        userQuery,
        context.userLevel,
        context.currentCapsule.concepts
      );
      setSuggestions(newSuggestions);
    },
    [context.userLevel, context.currentCapsule.concepts]
  );

  // ============================================
  // STREAMING MESSAGE HANDLER
  // ============================================
  const sendMessageStreaming = useCallback(
    async (content: string, model: string) => {
      const assistantMsgId = (Date.now() + 1).toString();

      // Add placeholder assistant message
      const assistantMessage: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        model: model as any,
        isStreaming: true,
      };
      setMessages(prev => [...prev, assistantMessage]);

      const systemPrompt = `Tu es GENIA, formateur senior en Prompt Engineering utilisant la méthode GENIA.

Contexte actuel :
- Capsule : ${context.currentCapsule?.title || 'Formation GENIA'}
- Concepts : ${context.currentCapsule?.concepts?.join(', ') || 'Prompt Engineering'}
- Niveau : ${context.userLevel || 'beginner'}
- Progression : ${context.completedCapsules || 0}/${context.totalCapsules || 36} capsules

IMPORTANT: Identifie TOUJOURS quel pilier GENIA tu utilises dans ta réponse :
[G - Guide] [E - Exemple] [N - Niveau] [I - Interaction] [A - Assessment]

Applique la méthode GENIA et adapte ton niveau au contexte utilisateur.`;

      const apiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.slice(-6).map(m => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
        { role: 'user' as const, content },
      ];

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model,
          conversationId: conversationId || 'new',
          capsuleId: context.currentCapsule?.id,
          reasoning: model === 'magistral-medium' ? 'explicit' : 'implicit',
        }),
        signal: abortController.current?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'envoi du message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const event: StreamEvent = JSON.parse(trimmed.slice(6));

            if (event.type === 'content' && event.content) {
              fullContent += event.content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: fullContent }
                    : m
                )
              );
            } else if (event.type === 'metadata') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        isStreaming: false,
                        methodStep: (event.methodStep as Message['methodStep']) || detectGENIAStep(fullContent),
                        provider: event.provider,
                      }
                    : m
                )
              );

              if (!conversationId && event.conversationId) {
                setConversationId(event.conversationId);
              }

              if (event.quotaUsed) {
                if (model === 'magistral-medium') {
                  setQuota(prev => ({
                    ...prev,
                    magistralMedium: { ...prev.magistralMedium, used: event.quotaUsed!.used },
                  }));
                } else {
                  setQuota(prev => ({
                    ...prev,
                    mistralMedium3: { ...prev.mistralMedium3, used: event.quotaUsed!.used },
                  }));
                }
              }
            } else if (event.type === 'done') {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, isStreaming: false }
                    : m
                )
              );
            }
          } catch {
            // ignore parse errors
          }
        }
      }

      // Update suggestions based on response
      updateSuggestions(fullContent, content);
      await loadQuotas();
    },
    [messages, conversationId, context, detectGENIAStep, loadQuotas, updateSuggestions]
  );

  // ============================================
  // NON-STREAMING MESSAGE HANDLER (fallback)
  // ============================================
  const sendMessageNonStreaming = useCallback(
    async (content: string, model: string) => {
      const systemPrompt = `Tu es GENIA, formateur senior en Prompt Engineering utilisant la méthode GENIA.

Contexte actuel :
- Capsule : ${context.currentCapsule?.title || 'Formation GENIA'}
- Concepts : ${context.currentCapsule?.concepts?.join(', ') || 'Prompt Engineering'}
- Niveau : ${context.userLevel || 'beginner'}
- Progression : ${context.completedCapsules || 0}/${context.totalCapsules || 36} capsules

IMPORTANT: Identifie TOUJOURS quel pilier GENIA tu utilises dans ta réponse :
[G - Guide] [E - Exemple] [N - Niveau] [I - Interaction] [A - Assessment]

Applique la méthode GENIA et adapte ton niveau au contexte utilisateur.`;

      const apiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.slice(-6).map(m => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
        { role: 'user' as const, content },
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model,
          userId: user?.id,
          conversationId: conversationId || 'new',
          capsuleId: context.currentCapsule?.id,
          reasoning: model === 'magistral-medium' ? 'explicit' : 'implicit',
        }),
        signal: abortController.current?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'envoi du message");
      }

      const data = await response.json();

      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        model: data.model || model,
        methodStep: data.methodStep || detectGENIAStep(data.content),
        reasoning: data.reasoning,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.quotaUsed) {
        if (model === 'magistral-medium') {
          setQuota(prev => ({
            ...prev,
            magistralMedium: { ...prev.magistralMedium, used: data.quotaUsed.used },
          }));
        } else {
          setQuota(prev => ({
            ...prev,
            mistralMedium3: { ...prev.mistralMedium3, used: data.quotaUsed.used },
          }));
        }
      }

      updateSuggestions(data.content, content);
      await loadQuotas();
    },
    [user?.id, messages, conversationId, context, detectGENIAStep, loadQuotas, updateSuggestions]
  );

  // ============================================
  // ENVOI DE MESSAGE
  // ============================================
  const sendMessage = useCallback(
    async (content: string) => {
      if (!user?.id) {
        setError('Vous devez être connecté pour utiliser le chat');
        return;
      }

      if (!content.trim()) return;

      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const model = selectOptimalModel(content);

        if (enableStreaming) {
          await sendMessageStreaming(content, model);
        } else {
          await sendMessageNonStreaming(content, model);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;

        console.error('Erreur chat GENIA:', error);
        setError(error.message || 'Une erreur est survenue');

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Désolé, une erreur est survenue : ${error.message || 'Impossible de traiter votre demande'}. Veuillez réessayer.`,
          timestamp: new Date(),
          methodStep: 'G',
        };

        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        abortController.current = null;
      }
    },
    [user?.id, selectOptimalModel, enableStreaming, sendMessageStreaming, sendMessageNonStreaming]
  );

  // ============================================
  // FEEDBACK
  // ============================================
  const sendFeedback = useCallback(
    async (messageId: string, feedback: 'up' | 'down') => {
      // Update local state
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, feedback } : m
        )
      );

      // Send to server
      try {
        await fetch('/api/chat/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            feedback,
            conversationId,
          }),
        });
      } catch (err) {
        console.error('Error sending feedback:', err);
      }
    },
    [conversationId]
  );

  // ============================================
  // EXPORT
  // ============================================
  const exportChat = useCallback(
    (format: 'markdown' | 'pdf') => {
      import('@/lib/chat-export').then(({ exportToMarkdown, exportToPdf }) => {
        if (format === 'markdown') {
          exportToMarkdown(messages, context);
        } else {
          exportToPdf(messages, context);
        }
      });
    },
    [messages, context]
  );

  // ============================================
  // ACTIONS UTILITAIRES
  // ============================================
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetConversation = useCallback(() => {
    setMessages([INITIAL_SYSTEM_MESSAGE]);
    setConversationId(null);
    setError(null);
    setSuggestions([]);
  }, []);

  // ============================================
  // NETTOYAGE
  // ============================================
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // ============================================
  // RETOUR
  // ============================================
  return {
    user,
    messages,
    isLoading,
    error,
    conversationId,
    context,
    quota,
    currentModel,
    suggestions,

    sendMessage,
    setCurrentModel,
    loadQuotas,
    clearError,
    resetConversation,
    sendFeedback,
    exportChat,
  };
}
