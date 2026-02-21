// hooks/useGENIAChat.ts

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: 'magistral-medium' | 'mistral-medium-3' | 'mistral-small';
  methodStep?: 'G' | 'E' | 'N' | 'I' | 'A';
  tokens?: number;
  reasoning?: string;
  cost?: number;
}

export interface ChatContext {
  capsuleId?: string;
  capsuleTitle?: string;
  capsuleConcepts?: string[];
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  completedCapsules?: number;
  totalCapsules?: number;
}

export interface Quotas {
  'magistral-medium': QuotaInfo;
  'mistral-medium-3': QuotaInfo;
  'mistral-small': QuotaInfo;
}

interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  tokensUsed?: number;
  cost?: number;
}

interface UseGENIAChatOptions {
  initialContext?: ChatContext;
  conversationId?: string;
  autoLoadQuotas?: boolean;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useGENIAChat(options: UseGENIAChatOptions = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(options.conversationId);
  
  const [context, setContext] = useState<ChatContext>({
    userLevel: 'beginner',
    ...options.initialContext
  });
  
  const [quotas, setQuotas] = useState<Quotas>({
    'magistral-medium': { used: 0, limit: 30, remaining: 30 },
    'mistral-medium-3': { used: 0, limit: 150, remaining: 150 },
    'mistral-small': { used: 0, limit: 500, remaining: 500 }
  });
  
  const [selectedModel, setSelectedModel] = useState<'auto' | 'magistral-medium' | 'mistral-medium-3' | 'mistral-small'>('auto');

  // ============================================
  // GESTION DE L'AUTHENTIFICATION
  // ============================================

  useEffect(() => {
    const supabase = createClient();

    // Charger l'utilisateur actuel
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

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
      if (response.ok) {
        const data = await response.json();
        setQuotas(data.quotas);
      }
    } catch (error) {
      console.error('Erreur chargement quotas:', error);
    }
  }, [user?.id]);
  
  // Charger les quotas au montage si option activée
  useEffect(() => {
    if (options.autoLoadQuotas !== false) {
      loadQuotas();
    }
  }, [loadQuotas, options.autoLoadQuotas]);
  
  // ============================================
  // SÉLECTION AUTOMATIQUE DU MODÈLE
  // ============================================
  
  const selectOptimalModel = useCallback((query: string): 'magistral-medium' | 'mistral-medium-3' | 'mistral-small' => {
    if (selectedModel !== 'auto') {
      return selectedModel as any;
    }
    
    const needsReasoning = /comment|pourquoi|explique|comprendre|analyser/i.test(query);
    const isSimpleQuestion = query.split(' ').length < 10;
    
    if (needsReasoning && quotas['magistral-medium'].remaining > 0) {
      return 'magistral-medium';
    }
    
    if (!isSimpleQuestion && quotas['mistral-medium-3'].remaining > 0) {
      return 'mistral-medium-3';
    }
    
    return 'mistral-small';
  }, [selectedModel, quotas]);
  
  // ============================================
  // ENVOI DE MESSAGE
  // ============================================
  
  const sendMessage = useCallback(async (content: string) => {
    if (!user?.id) {
      setError('Vous devez être connecté pour utiliser le chat');
      return;
    }
    
    if (!content.trim()) return;
    
    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    try {
      // Sélectionner le modèle optimal
      const model = selectOptimalModel(content);
      
      // Préparer le contexte système
      const systemPrompt = `Tu es GENIA, formateur senior en Prompt Engineering.
      
Contexte actuel :
- Capsule : ${context.capsuleTitle || 'Introduction'}
- Concepts : ${context.capsuleConcepts?.join(', ') || 'Bases du prompting'}
- Niveau apprenant : ${context.userLevel}
- Progression : ${context.completedCapsules || 0}/${context.totalCapsules || 10} capsules

Applique TOUJOURS la méthode GENIA et identifie le pilier utilisé.`;
      
      // Construire l'historique des messages pour l'API
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10).map(m => ({ // Garder les 10 derniers messages pour le contexte
          role: m.role,
          content: m.content
        })),
        { role: 'user', content }
      ];
      
      // Appel à l'API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model,
          userId: user.id,
          conversationId: conversationId || 'new',
          capsuleId: context.capsuleId,
          reasoning: model === 'magistral-medium' ? 'explicit' : 'implicit'
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }
      
      const data = await response.json();
      
      // Si nouvelle conversation, sauvegarder l'ID
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Ajouter la réponse de l'assistant
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        model,
        methodStep: data.methodStep,
        tokens: data.usage?.totalTokens,
        reasoning: data.reasoning,
        cost: data.usage?.cost
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Mettre à jour les quotas
      if (data.quotaInfo) {
        setQuotas(prev => ({
          ...prev,
          [model]: {
            ...prev[model],
            used: data.quotaInfo.used,
            remaining: data.quotaInfo.limit - data.quotaInfo.used
          }
        }));
      }
      
    } catch (error) {
      console.error('Erreur envoi message:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      
      // Message d'erreur dans le chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `❌ Désolé, une erreur s'est produite. ${error instanceof Error ? error.message : 'Veuillez réessayer.'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, context, conversationId, messages, selectOptimalModel]);
  
  // ============================================
  // GÉNÉRATION D'EXERCICE
  // ============================================
  
  const generateExercise = useCallback(async () => {
    if (!user?.id || !context.capsuleTitle) {
      setError('Contexte insuffisant pour générer un exercice');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/exercise/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsuleTitle: context.capsuleTitle,
          concepts: context.capsuleConcepts || [],
          userLevel: context.userLevel,
          userId: user.id,
          capsuleId: context.capsuleId
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la génération de l\'exercice');
      }
      
      const data = await response.json();
      
      // Ajouter l'exercice comme message dans le chat
      const exerciseMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        methodStep: 'I'
      };
      
      setMessages(prev => [...prev, exerciseMessage]);
      
      return data;
      
    } catch (error) {
      console.error('Erreur génération exercice:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la génération');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, context]);
  
  // ============================================
  // ÉVALUATION D'UNE RÉPONSE
  // ============================================
  
  const evaluateResponse = useCallback(async (
    userResponse: string,
    expectedCriteria: string[],
    exerciseId?: string
  ) => {
    if (!user?.id) {
      setError('Vous devez être connecté pour soumettre une réponse');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/exercise/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          userResponse,
          expectedCriteria,
          userId: user.id,
          capsuleId: context.capsuleId
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'évaluation');
      }
      
      const data = await response.json();
      
      // Ajouter le feedback comme message dans le chat
      const feedbackMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.feedback,
        timestamp: new Date(),
        methodStep: 'A'
      };
      
      setMessages(prev => [...prev, feedbackMessage]);
      
      return data;
      
    } catch (error) {
      console.error('Erreur évaluation:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'évaluation');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);
  
  // ============================================
  // RÉINITIALISATION
  // ============================================
  
  const resetChat = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    setError(null);
  }, []);
  
  // ============================================
  // MISE À JOUR DU CONTEXTE
  // ============================================
  
  const updateContext = useCallback((newContext: Partial<ChatContext>) => {
    setContext(prev => ({ ...prev, ...newContext }));
  }, []);
  
  // ============================================
  // EXPORT
  // ============================================
  
  return {
    // État
    messages,
    isLoading,
    error,
    context,
    quotas,
    conversationId,
    selectedModel,
    
    // Actions
    sendMessage,
    generateExercise,
    evaluateResponse,
    resetChat,
    updateContext,
    setSelectedModel,
    loadQuotas,
    
    // Utils
    user
  };
}