'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { geniaMemoryService } from '@/services/geniaMemoryService';
import type {
  UseEnhancedGENIA,
  EnhancedMessage,
  SessionMemory,
  LearningInsights,
  MemoryContext,
  SessionMetrics,
  PromptEnrichmentOptions,
  InteractionFeedback,
  PromptPattern,
  LearningStyle,
  EnrichedPrompt
} from '@/types/geniaMemory.types';

/**
 * Hook amélioré pour GENIA avec mémoire de session et contexte enrichi
 */
export function useEnhancedGENIA(
  moduleId?: string,
  capsuleId?: string,
  enableMemory: boolean = true
): UseEnhancedGENIA {
  // États
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionMemory, setSessionMemory] = useState<SessionMemory | null>(null);
  const [learningInsights, setLearningInsights] = useState<LearningInsights | null>(null);
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [currentContext, setCurrentContext] = useState<MemoryContext | null>(null);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs pour éviter les re-renders
  const sessionStartTime = useRef<Date>(new Date());
  const interactionCount = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  // Créer le client Supabase
  const supabase = createClient();

  /**
   * Initialise la session avec mémoire
   */
  const initializeSession = useCallback(async () => {
    if (!user?.id || !enableMemory) {
      setIsInitialized(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Initialiser la session mémoire
      const session = await geniaMemoryService.initializeSession(
        user.id,
        moduleId,
        capsuleId
      );

      if (session) {
        setSessionId(session.session_id);
        setSessionMemory(session);

        // Charger les insights et le contexte
        const [insights, context] = await Promise.all([
          geniaMemoryService.getLearningInsights(user.id),
          geniaMemoryService.buildEnrichedContext(user.id, session.session_id)
        ]);

        setLearningInsights(insights);
        setCurrentContext(context);
        
        // Message système initial avec contexte
        const systemMessage = buildSystemMessage(context);
        setMessages([systemMessage]);
      }

      setIsInitialized(true);
    } catch (err) {
      console.error('Erreur initialisation session GENIA:', err);
      setError('Impossible d\'initialiser la session');
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, moduleId, capsuleId, enableMemory]);

  /**
   * Construit le message système initial
   */
  const buildSystemMessage = (context: MemoryContext): EnhancedMessage => {
    const parts: string[] = [];

    // Style d'apprentissage
    if (context.learningStyle) {
      parts.push(`Style d'apprentissage détecté : ${context.learningStyle}`);
    }

    // Niveau
    parts.push(`Niveau : ${context.skillLevel}`);

    // Difficultés principales
    if (context.keyDifficulties.length > 0) {
      parts.push(`Points d'attention : ${context.keyDifficulties.slice(0, 3).join(', ')}`);
    }

    // Approches qui fonctionnent
    if (context.successfulApproaches.length > 0) {
      parts.push(`Méthodes efficaces : ${context.successfulApproaches.slice(0, 2).join(', ')}`);
    }

    // Progression
    if (context.currentProgress > 0) {
      parts.push(`Progression actuelle : ${context.currentProgress}%`);
    }

    // Streak
    if (context.streakDays > 0) {
      parts.push(`🔥 Série de ${context.streakDays} jours !`);
    }

    return {
      role: 'system',
      content: `Bonjour ! Je suis GENIA, votre assistant personnalisé. ${parts.join('. ')}.`,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  };

  /**
   * Enrichit le prompt avec le contexte
   */
  const enrichPrompt = useCallback((
    originalPrompt: string,
    options: PromptEnrichmentOptions = {
      includeSessionHistory: true,
      includeLearningStyle: true,
      includeSuccessPatterns: false,
      includeDifficultyAreas: true,
      includeRecommendations: false,
      maxHistoryItems: 3
    }
  ): EnrichedPrompt => {
    if (!currentContext || !enableMemory) {
      return {
        originalPrompt,
        enrichedPrompt: originalPrompt,
        context: currentContext || geniaMemoryService['getDefaultContext'](),
        systemInstructions: [],
        suggestedPatterns: []
      };
    }

    const instructions: string[] = [];
    const contextParts: string[] = [];

    // Style d'apprentissage
    if (options.includeLearningStyle && currentContext.learningStyle) {
      instructions.push(
        `Adapte ta réponse au style ${currentContext.learningStyle} de l'apprenant.`
      );
      if (currentContext.preferredExplanationLength) {
        instructions.push(
          `Préférence pour des explications ${
            currentContext.preferredExplanationLength === 'concise' ? 'concises' :
            currentContext.preferredExplanationLength === 'detailed' ? 'détaillées' :
            'très détaillées'
          }.`
        );
      }
    }

    // Historique de session
    if (options.includeSessionHistory && messages.length > 1) {
      const recentMessages = messages
        .slice(-options.maxHistoryItems * 2)
        .filter(m => m.role !== 'system')
        .map(m => `${m.role}: ${m.content.substring(0, 100)}...`)
        .join('\n');
      
      contextParts.push(`Historique récent:\n${recentMessages}`);
    }

    // Difficultés
    if (options.includeDifficultyAreas && currentContext.keyDifficulties.length > 0) {
      instructions.push(
        `L'apprenant a des difficultés avec : ${currentContext.keyDifficulties.join(', ')}. ` +
        `Sois particulièrement clair sur ces points.`
      );
    }

    // Patterns de succès
    let suggestedPatterns: PromptPattern[] = [];
    if (options.includeSuccessPatterns && currentContext.availablePatterns.length > 0) {
      suggestedPatterns = currentContext.availablePatterns.slice(0, 3);
      contextParts.push(
        `Patterns suggérés :\n${suggestedPatterns.map(p => p.pattern_template).join('\n')}`
      );
    }

    // Recommandations
    if (options.includeRecommendations && currentContext.recommendedFocus.length > 0) {
      instructions.push(
        `Focus recommandé : ${currentContext.recommendedFocus.join(', ')}`
      );
    }

    // Construire le prompt enrichi
    const enrichedPrompt = [
      ...contextParts,
      originalPrompt
    ].filter(Boolean).join('\n\n');

    return {
      originalPrompt,
      enrichedPrompt,
      context: currentContext,
      systemInstructions: instructions,
      suggestedPatterns
    };
  }, [currentContext, messages, enableMemory]);

  /**
   * Envoie un message avec contexte enrichi
   */
  const sendMessage = useCallback(async (
    message: string,
    options?: PromptEnrichmentOptions
  ) => {
    if (!message.trim() || isLoading) return;

    // Annuler la requête précédente si elle existe
    if (abortController.current) {
      abortController.current.abort();
    }

    setIsLoading(true);
    setError(null);
    interactionCount.current++;

    try {
      // Créer un nouveau controller pour cette requête
      abortController.current = new AbortController();

      // Enrichir le prompt si la mémoire est activée
      const enrichedData = enableMemory 
        ? enrichPrompt(message, options)
        : { 
            enrichedPrompt: message, 
            originalPrompt: message,
            context: null,
            suggestedPatterns: [],
            systemInstructions: [] 
          } as EnrichedPrompt;

      // Ajouter le message utilisateur
      const userMessage: EnhancedMessage = {
        role: 'user',
        content: message,
        metadata: {
          timestamp: new Date().toISOString()
        }
      };
      setMessages(prev => [...prev, userMessage]);

      // Préparer les messages pour l'API
      const apiMessages = [
        ...enrichedData.systemInstructions.map(instruction => ({
          role: 'system' as const,
          content: instruction
        })),
        ...messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role,
          content: m.content
        })),
        {
          role: 'user' as const,
          content: enrichedData.enrichedPrompt
        }
      ];

      // Appeler l'API
      const startTime = Date.now();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: 'mistral-medium-3',
          userId: user?.id,
          moduleId,
          capsuleId
        }),
        signal: abortController.current.signal
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // Ajouter la réponse de l'assistant
      const assistantMessage: EnhancedMessage = {
        role: 'assistant',
        content: data.content,
        metadata: {
          timestamp: new Date().toISOString(),
          tokens: data.tokensUsed,
          model: 'mistral-medium-3',
          response_time_ms: responseTime
        }
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Analyser et mettre à jour la mémoire si activée
      if (enableMemory && sessionId && user?.id) {
        await updateMemoryFromInteraction(
          message,
          data.content,
          responseTime,
          data.tokensUsed
        );
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Requête annulée');
        return;
      }
      console.error('Erreur envoi message:', err);
      setError('Impossible d\'envoyer le message');
    } finally {
      setIsLoading(false);
      abortController.current = null;
    }
  }, [user?.id, sessionId, moduleId, capsuleId, messages, isLoading, enableMemory, enrichPrompt]);

  /**
   * Met à jour la mémoire après une interaction
   */
  const updateMemoryFromInteraction = async (
    userInput: string,
    aiResponse: string,
    responseTime: number,
    tokensUsed?: number
  ) => {
    if (!sessionId || !user?.id) return;

    try {
      // Analyser l'interaction (simple heuristique, à améliorer avec ML)
      const updates: Partial<SessionMemory> = {
        interactions_count: (sessionMemory?.interactions_count || 0) + 1,
        average_response_time: responseTime
      };

      // Détecter les difficultés (questions répétées, mots clés)
      const difficultyKeywords = ['comprends pas', 'difficile', 'compliqué', 'aide', 'expliquer'];
      const hasDifficulty = difficultyKeywords.some(keyword => 
        userInput.toLowerCase().includes(keyword)
      );

      if (hasDifficulty) {
        await geniaMemoryService.addDifficultyPoint(sessionId, userInput.substring(0, 100));
      }

      // Détecter les succès (mots clés positifs)
      const successKeywords = ['compris', 'merci', 'parfait', 'super', 'génial'];
      const hasSuccess = successKeywords.some(keyword => 
        userInput.toLowerCase().includes(keyword)
      );

      if (hasSuccess && sessionMemory) {
        updates.successful_exercises = sessionMemory.successful_exercises + 1;
      }

      // Mettre à jour la session
      const updatedSession = await geniaMemoryService.updateSessionMemory(sessionId, updates);
      if (updatedSession) {
        setSessionMemory(updatedSession);
      }

      // Logger l'interaction
      await geniaMemoryService.logInteraction({
        user_id: user.id,
        session_id: sessionId,
        interaction_type: 'question',
        user_input: userInput,
        ai_response: aiResponse,
        response_time_ms: responseTime,
        tokens_used: tokensUsed,
        model_used: 'mistral-medium-3',
        module_context: moduleId,
        capsule_context: capsuleId
      });

      // Rafraîchir le contexte périodiquement
      if (interactionCount.current % 5 === 0) {
        await refreshContext();
      }

    } catch (err) {
      console.error('Erreur mise à jour mémoire:', err);
    }
  };

  /**
   * Rafraîchit le contexte
   */
  const refreshContext = useCallback(async () => {
    if (!user?.id || !sessionId || !enableMemory) return;

    try {
      const context = await geniaMemoryService.buildEnrichedContext(user.id, sessionId);
      setCurrentContext(context);
    } catch (err) {
      console.error('Erreur rafraîchissement contexte:', err);
    }
  }, [user?.id, sessionId, enableMemory]);

  /**
   * Fournit un feedback sur une interaction
   */
  const provideFeedback = useCallback(async (feedback: InteractionFeedback) => {
    if (!sessionId || !user?.id) return;

    try {
      // Enregistrer le feedback
      await geniaMemoryService.logInteraction({
        user_id: user.id,
        session_id: sessionId,
        interaction_type: 'feedback',
        user_satisfaction_score: feedback.satisfactionScore,
        was_helpful: feedback.wasHelpful,
        user_input: feedback.comment
      });

      // Mettre à jour les métriques si négatif
      if (!feedback.wasHelpful && feedback.suggestedImprovement) {
        await geniaMemoryService.addDifficultyPoint(
          sessionId,
          feedback.suggestedImprovement
        );
      }

    } catch (err) {
      console.error('Erreur envoi feedback:', err);
    }
  }, [sessionId, user?.id]);

  /**
   * Marque un point de difficulté
   */
  const markDifficulty = useCallback(async (topic: string) => {
    if (!sessionId) return;

    try {
      await geniaMemoryService.addDifficultyPoint(sessionId, topic);
      await refreshContext();
    } catch (err) {
      console.error('Erreur marquage difficulté:', err);
    }
  }, [sessionId, refreshContext]);

  /**
   * Sauvegarde un pattern de prompt
   */
  const savePattern = useCallback(async (
    pattern: Omit<PromptPattern, 'id' | 'created_at' | 'updated_at'>
  ) => {
    if (!user?.id) return;

    try {
      await geniaMemoryService.saveSuccessfulPattern(user.id, pattern);
      await refreshContext();
    } catch (err) {
      console.error('Erreur sauvegarde pattern:', err);
    }
  }, [user?.id, refreshContext]);

  /**
   * Charge les patterns publics
   */
  const loadPublicPatterns = useCallback(async (): Promise<PromptPattern[]> => {
    try {
      return await geniaMemoryService.getPromptPatterns(undefined, true);
    } catch (err) {
      console.error('Erreur chargement patterns publics:', err);
      return [];
    }
  }, []);

  /**
   * Met à jour le style d'apprentissage
   */
  const updateLearningStyle = useCallback(async (style: LearningStyle) => {
    if (!user?.id || !sessionId) return;

    try {
      await geniaMemoryService.updateSessionMemory(sessionId, {
        learning_style: style
      });
      
      await geniaMemoryService.updateLearningInsights(user.id, {
        preferred_learning_style: style
      });

      await refreshContext();
    } catch (err) {
      console.error('Erreur mise à jour style:', err);
    }
  }, [user?.id, sessionId, refreshContext]);

  /**
   * Régénère une réponse
   */
  const regenerateResponse = useCallback(async (messageId: string) => {
    // Trouver le message et régénérer
    const messageIndex = messages.findIndex(m => 
      m.metadata?.timestamp === messageId
    );

    if (messageIndex > 0 && messages[messageIndex - 1]?.role === 'user') {
      const userMessage = messages[messageIndex - 1].content;
      
      // Retirer l'ancienne réponse
      setMessages(prev => prev.slice(0, messageIndex));
      
      // Régénérer
      await sendMessage(userMessage);
    }
  }, [messages, sendMessage]);

  /**
   * Termine la session
   */
  const endSession = useCallback(async () => {
    if (!sessionId || !user?.id) return;

    try {
      // Calculer les métriques finales
      const duration = Math.floor(
        (Date.now() - sessionStartTime.current.getTime()) / 1000 / 60
      );

      // Mettre à jour la session finale
      await geniaMemoryService.updateSessionMemory(sessionId, {
        average_response_time: duration
      });

      // Analyser le style d'apprentissage
      await geniaMemoryService.analyzeAndUpdateLearningStyle(user.id);

      // Réinitialiser
      setSessionId(null);
      setSessionMemory(null);
      setMessages([]);
      setCurrentContext(null);
      setIsInitialized(false);
    } catch (err) {
      console.error('Erreur fin de session:', err);
    }
  }, [sessionId, user?.id]);

  /**
   * Calcule les métriques de session
   */
  useEffect(() => {
    if (!sessionMemory) return;

    const metrics: SessionMetrics = {
      duration: Math.floor((Date.now() - sessionStartTime.current.getTime()) / 1000 / 60),
      interactions: sessionMemory.interactions_count,
      successRate: sessionMemory.successful_exercises + sessionMemory.failed_exercises > 0
        ? (sessionMemory.successful_exercises / (sessionMemory.successful_exercises + sessionMemory.failed_exercises)) * 100
        : 0,
      topics: sessionMemory.topics_covered || [],
      difficulties: sessionMemory.difficulty_points || [],
      improvements: sessionMemory.successful_patterns || []
    };

    setSessionMetrics(metrics);
  }, [sessionMemory]);

  /**
   * Initialisation au montage
   */
  useEffect(() => {
    if (user?.id && !isInitialized && enableMemory) {
      initializeSession();
    }
  }, [user?.id, isInitialized, enableMemory, initializeSession]);

  /**
   * Récupération et écoute de l'utilisateur
   */
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  /**
   * Nettoyage au démontage
   */
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    // État
    sessionId,
    sessionMemory,
    learningInsights,
    messages,
    isLoading,
    isInitialized,
    hasMemoryEnabled: enableMemory,
    currentContext,
    sessionMetrics,
    error,
    
    // Actions
    initializeSession,
    endSession,
    sendMessage,
    regenerateResponse,
    provideFeedback,
    markDifficulty,
    savePattern,
    loadPublicPatterns,
    refreshContext,
    updateLearningStyle
  };
}
