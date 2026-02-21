import { createClient } from '@/lib/supabase/client';
import type { 
  SessionMemory, 
  LearningInsights, 
  PromptPattern, 
  InteractionLog,
  MemoryContext 
} from '@/types/geniaMemory.types';

/**
 * Service de gestion de la mémoire augmentée pour GENIA
 * Gère la mémoire de session, les insights d'apprentissage et les patterns
 */
export class GENIAMemoryService {
  private supabase = createClient();
  private currentSessionId: string | null = null;

  /**
   * Initialise ou récupère une session mémoire
   */
  async initializeSession(userId: string, moduleId?: string, capsuleId?: string): Promise<SessionMemory> {
    try {
      // Générer un ID de session unique
      this.currentSessionId = crypto.randomUUID();

      // Créer la nouvelle session mémoire
      const { data, error } = await this.supabase
        .from('genia_session_memory')
        .insert({
          user_id: userId,
          session_id: this.currentSessionId,
          module_id: moduleId,
          capsule_id: capsuleId,
          interactions_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data as SessionMemory;
    } catch (error) {
      console.error('Erreur initialisation session mémoire:', error);
      throw error;
    }
  }

  /**
   * Récupère la mémoire de session actuelle
   */
  async getCurrentSession(userId: string, sessionId: string): Promise<SessionMemory | null> {
    try {
      const { data, error } = await this.supabase
        .from('genia_session_memory')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as SessionMemory | null;
    } catch (error) {
      console.error('Erreur récupération session mémoire:', error);
      return null;
    }
  }

  /**
   * Récupère les sessions récentes pour contexte
   */
  async getRecentSessions(userId: string, limit: number = 5): Promise<SessionMemory[]> {
    try {
      const { data, error } = await this.supabase
        .from('genia_session_memory')
        .select('*')
        .eq('user_id', userId)
        .order('last_interaction_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as SessionMemory[]) || [];
    } catch (error) {
      console.error('Erreur récupération sessions récentes:', error);
      return [];
    }
  }

  /**
   * Met à jour la mémoire de session avec de nouveaux insights
   */
  async updateSessionMemory(
    sessionId: string,
    updates: Partial<SessionMemory>
  ): Promise<SessionMemory | null> {
    try {
      const { data, error } = await this.supabase
        .from('genia_session_memory')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as SessionMemory;
    } catch (error) {
      console.error('Erreur mise à jour session mémoire:', error);
      return null;
    }
  }

  /**
   * Ajoute un point de difficulté détecté
   */
  async addDifficultyPoint(sessionId: string, difficulty: string): Promise<void> {
    try {
      await this.supabase.rpc('update_session_memory', {
        p_session_id: sessionId,
        p_difficulty_point: difficulty
      });
    } catch (error) {
      console.error('Erreur ajout point difficulté:', error);
    }
  }

  /**
   * Ajoute un pattern réussi
   */
  async addSuccessfulPattern(sessionId: string, pattern: string): Promise<void> {
    try {
      await this.supabase.rpc('update_session_memory', {
        p_session_id: sessionId,
        p_successful_pattern: pattern
      });
    } catch (error) {
      console.error('Erreur ajout pattern réussi:', error);
    }
  }

  /**
   * Récupère les insights d'apprentissage de l'utilisateur
   */
  async getLearningInsights(userId: string): Promise<LearningInsights | null> {
    try {
      const { data, error } = await this.supabase
        .from('genia_learning_insights')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as LearningInsights | null;
    } catch (error) {
      console.error('Erreur récupération insights:', error);
      return null;
    }
  }

  /**
   * Met à jour les insights d'apprentissage
   */
  async updateLearningInsights(
    userId: string,
    insights: Partial<LearningInsights>
  ): Promise<LearningInsights | null> {
    try {
      const { data, error } = await this.supabase
        .from('genia_learning_insights')
        .upsert({
          user_id: userId,
          ...insights,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as LearningInsights;
    } catch (error) {
      console.error('Erreur mise à jour insights:', error);
      return null;
    }
  }

  /**
   * Récupère les patterns de prompts publics ou de l'utilisateur
   */
  async getPromptPatterns(userId?: string, isPublic: boolean = false): Promise<PromptPattern[]> {
    try {
      let query = this.supabase.from('genia_prompt_patterns').select('*');
      
      if (isPublic) {
        query = query.eq('is_public', true).eq('is_verified', true);
      } else if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query
        .order('success_rate', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data as PromptPattern[]) || [];
    } catch (error) {
      console.error('Erreur récupération patterns:', error);
      return [];
    }
  }

  /**
   * Enregistre une nouvelle interaction pour analyse
   */
  async logInteraction(log: Omit<InteractionLog, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('genia_interaction_logs')
        .insert(log);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur log interaction:', error);
    }
  }

  /**
   * Construit le contexte enrichi pour l'IA
   */
  async buildEnrichedContext(userId: string, sessionId: string): Promise<MemoryContext> {
    try {
      // Récupérer les données en parallèle pour performance
      const [currentSession, recentSessions, insights, patterns] = await Promise.all([
        this.getCurrentSession(userId, sessionId),
        this.getRecentSessions(userId, 3),
        this.getLearningInsights(userId),
        this.getPromptPatterns(userId)
      ]);

      // Construire le contexte enrichi
      const context: MemoryContext = {
        currentSession,
        recentSessions,
        learningInsights: insights,
        availablePatterns: patterns,
        
        // Analyser les points clés
        keyDifficulties: this.extractKeyDifficulties(currentSession, recentSessions),
        successfulApproaches: this.extractSuccessfulApproaches(currentSession, recentSessions),
        recommendedFocus: insights?.recommended_focus || [],
        learningStyle: currentSession?.learning_style || insights?.preferred_learning_style || 'mixed',
        
        // Métriques de performance
        currentProgress: this.calculateProgress(currentSession, insights),
        streakDays: insights?.streak_days || 0,
        
        // Personnalisation
        preferredExplanationLength: currentSession?.preferred_explanation_length || 'detailed',
        prefersExamples: insights?.prefers_examples ?? true,
        skillLevel: currentSession?.skill_level || 'beginner'
      };

      return context;
    } catch (error) {
      console.error('Erreur construction contexte enrichi:', error);
      return this.getDefaultContext();
    }
  }

  /**
   * Extrait les difficultés principales
   */
  private extractKeyDifficulties(
    current: SessionMemory | null,
    recent: SessionMemory[]
  ): string[] {
    const allDifficulties = [
      ...(current?.difficulty_points || []),
      ...recent.flatMap(s => s.difficulty_points || [])
    ];

    // Compter les occurrences et retourner les plus fréquentes
    const counts = allDifficulties.reduce((acc, diff) => {
      acc[diff] = (acc[diff] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([difficulty]) => difficulty);
  }

  /**
   * Extrait les approches qui fonctionnent
   */
  private extractSuccessfulApproaches(
    current: SessionMemory | null,
    recent: SessionMemory[]
  ): string[] {
    const allPatterns = [
      ...(current?.successful_patterns || []),
      ...recent.flatMap(s => s.successful_patterns || [])
    ];

    // Dédupliquer et retourner
    return [...new Set(allPatterns)].slice(0, 5);
  }

  /**
   * Calcule le progrès actuel
   */
  private calculateProgress(
    session: SessionMemory | null,
    insights: LearningInsights | null
  ): number {
    if (!session && !insights) return 0;

    const sessionProgress = session 
      ? (session.successful_exercises / Math.max(1, session.successful_exercises + session.failed_exercises)) * 100
      : 0;

    const overallProgress = insights?.overall_progress || 0;

    // Moyenne pondérée (session actuelle compte plus)
    return Math.round(sessionProgress * 0.7 + overallProgress * 0.3);
  }

  /**
   * Contexte par défaut si erreur
   */
  private getDefaultContext(): MemoryContext {
    return {
      currentSession: null,
      recentSessions: [],
      learningInsights: null,
      availablePatterns: [],
      keyDifficulties: [],
      successfulApproaches: [],
      recommendedFocus: [],
      learningStyle: 'mixed',
      currentProgress: 0,
      streakDays: 0,
      preferredExplanationLength: 'detailed',
      prefersExamples: true,
      skillLevel: 'beginner'
    };
  }

  /**
   * Analyse et met à jour le style d'apprentissage
   */
  async analyzeAndUpdateLearningStyle(userId: string): Promise<void> {
    try {
      await this.supabase.rpc('analyze_learning_style', {
        p_user_id: userId
      });
    } catch (error) {
      console.error('Erreur analyse style apprentissage:', error);
    }
  }

  /**
   * Nettoie les anciennes sessions (+ de 30 jours)
   */
  async cleanupOldSessions(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await this.supabase
        .from('genia_session_memory')
        .delete()
        .lt('last_interaction_at', thirtyDaysAgo.toISOString());

      if (error) throw error;
      console.log('Sessions anciennes nettoyées');
    } catch (error) {
      console.error('Erreur nettoyage sessions:', error);
    }
  }

  /**
   * Sauvegarde un pattern de prompt réussi
   */
  async saveSuccessfulPattern(
    userId: string,
    pattern: Omit<PromptPattern, 'id' | 'created_at' | 'updated_at'>
  ): Promise<PromptPattern | null> {
    try {
      const { data, error } = await this.supabase
        .from('genia_prompt_patterns')
        .insert({
          ...pattern,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      return data as PromptPattern;
    } catch (error) {
      console.error('Erreur sauvegarde pattern:', error);
      return null;
    }
  }

  /**
   * Calcule et retourne des métriques de session
   */
  async getSessionMetrics(sessionId: string): Promise<{
    duration: number;
    interactions: number;
    successRate: number;
    topics: string[];
  }> {
    try {
      const session = await this.getCurrentSession('', sessionId);
      
      if (!session) {
        return {
          duration: 0,
          interactions: 0,
          successRate: 0,
          topics: []
        };
      }

      const duration = session.average_response_time || 0;
      const interactions = session.interactions_count;
      const total = session.successful_exercises + session.failed_exercises;
      const successRate = total > 0 
        ? (session.successful_exercises / total) * 100 
        : 0;

      return {
        duration,
        interactions,
        successRate: Math.round(successRate),
        topics: session.topics_covered || []
      };
    } catch (error) {
      console.error('Erreur récupération métriques:', error);
      return {
        duration: 0,
        interactions: 0,
        successRate: 0,
        topics: []
      };
    }
  }
}

// Export instance singleton
export const geniaMemoryService = new GENIAMemoryService();
