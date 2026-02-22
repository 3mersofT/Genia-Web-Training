import { createClient } from '@/lib/supabase/client';
import { studentNotificationService } from '@/lib/services/studentNotificationService';
import type {
  DailyChallenge,
  ChallengeParticipation,
  LeaderboardEntry,
  ChallengeUserStats,
  ChallengeTemplate,
  PeerReview,
  AIEvaluation,
  ChallengeNotification
} from '@/types/challenges.types';

/**
 * Service de gestion des défis quotidiens
 */
export class ChallengeService {
  private supabase = createClient();
  private lastNotificationDate: string | null = null;

  /**
   * Templates de défis prédéfinis
   */
  private challengeTemplates: ChallengeTemplate[] = [
    {
      type: 'transform',
      difficulty: 'beginner',
      templates: [
        'Transforme ce prompt vague en version RCTF : "{prompt}"',
        'Améliore ce prompt pour {industry} : "{prompt}"',
        'Rends ce prompt 50% plus concis : "{prompt}"',
        'Ajoute du contexte à ce prompt : "{prompt}"',
        'Structure ce prompt avec la méthode STAR : "{prompt}"'
      ],
      variables: {
        prompt: [
          'Écris-moi un article',
          'Fais-moi un CV',
          'Crée une présentation',
          'Aide-moi avec mon projet',
          'Résous ce problème',
          'Analyse ces données',
          'Crée du contenu',
          'Optimise ce texte'
        ],
        industry: ['e-commerce', 'education', 'santé', 'finance', 'tech', 'marketing', 'RH', 'juridique']
      },
      success_criteria: {
        has_role: 'Contient un rôle défini',
        has_context: 'Inclut le contexte nécessaire',
        has_task: 'Tâche claire et précise',
        has_format: 'Format de sortie spécifié'
      },
      scoring_rules: [
        { criterion: 'has_role', weight: 0.25, max_points: 25, evaluation_method: 'keywords', parameters: { keywords: ['agis', 'rôle', 'expert', 'consultant'] } },
        { criterion: 'has_context', weight: 0.25, max_points: 25, evaluation_method: 'length', parameters: { min_words: 20 } },
        { criterion: 'has_task', weight: 0.25, max_points: 25, evaluation_method: 'keywords', parameters: { keywords: ['créer', 'générer', 'analyser', 'développer'] } },
        { criterion: 'has_format', weight: 0.25, max_points: 25, evaluation_method: 'keywords', parameters: { keywords: ['format', 'structure', 'bullet', 'tableau', 'json'] } }
      ]
    },
    {
      type: 'create',
      difficulty: 'intermediate',
      templates: [
        'Crée un persona expert en {domain} avec la méthode ACTEUR',
        'Développe un template de prompt pour {use_case}',
        'Conçois une séquence de prompts pour {goal}',
        'Crée un prompt de débogage pour {problem_type}',
        'Développe un prompt d\'analyse pour {data_type}'
      ],
      variables: {
        domain: ['marketing', 'développement', 'design', 'vente', 'RH', 'juridique', 'médical', 'finance'],
        use_case: ['email professionnel', 'post LinkedIn', 'rapport mensuel', 'pitch deck', 'proposition commerciale', 'analyse de performance'],
        goal: ['analyse de données', 'brainstorming créatif', 'résolution de problème', 'optimisation de processus', 'formation d\'équipe'],
        problem_type: ['bug de code', 'problème de performance', 'erreur de logique', 'problème de design'],
        data_type: ['données de vente', 'métriques de performance', 'feedback utilisateur', 'données financières']
      },
      success_criteria: {
        completeness: 'Persona/template complet',
        specificity: 'Détails spécifiques au domaine',
        reusability: 'Réutilisable dans différents contextes'
      },
      scoring_rules: [
        { criterion: 'completeness', weight: 0.4, max_points: 40, evaluation_method: 'ai' },
        { criterion: 'specificity', weight: 0.3, max_points: 30, evaluation_method: 'ai' },
        { criterion: 'reusability', weight: 0.3, max_points: 30, evaluation_method: 'ai' }
      ]
    },
    {
      type: 'speed',
      difficulty: 'intermediate',
      templates: [
        'Crée 5 prompts différents pour {topic} en moins de 10 minutes',
        'Transforme ces 3 prompts vagues en versions professionnelles rapidement',
        'Génère 10 variations d\'un prompt en 5 minutes',
        'Crée une série de prompts pour {workflow} en moins de 8 minutes'
      ],
      variables: {
        topic: ['génération de contenu', 'analyse de texte', 'création visuelle', 'code', 'traduction', 'résumé', 'traduction', 'création de quiz'],
        workflow: ['onboarding client', 'formation employé', 'processus de vente', 'support client', 'développement produit']
      },
      success_criteria: {
        quantity: 'Nombre de prompts créés',
        quality: 'Qualité des prompts',
        time: 'Temps de réalisation'
      },
      scoring_rules: [
        { criterion: 'quantity', weight: 0.3, max_points: 30, evaluation_method: 'regex', parameters: { pattern: '\\d+\\.', min_matches: 5 } },
        { criterion: 'quality', weight: 0.4, max_points: 40, evaluation_method: 'ai' },
        { criterion: 'time', weight: 0.3, max_points: 30, evaluation_method: 'time', parameters: { max_seconds: 600 } }
      ]
    },
    {
      type: 'analysis',
      difficulty: 'advanced',
      templates: [
        'Analyse ce prompt et identifie {analysis_type}',
        'Compare ces deux prompts et évalue {comparison_aspect}',
        'Décompose ce prompt complexe en étapes simples',
        'Évalue l\'efficacité de ce prompt pour {use_case}'
      ],
      variables: {
        analysis_type: ['les points faibles', 'les améliorations possibles', 'la structure', 'la clarté'],
        comparison_aspect: ['la clarté', 'la spécificité', 'l\'efficacité', 'la concision'],
        use_case: ['la génération de contenu', 'l\'analyse de données', 'la résolution de problème', 'la créativité']
      },
      success_criteria: {
        depth: 'Analyse approfondie',
        accuracy: 'Identification précise des problèmes',
        suggestions: 'Suggestions d\'amélioration concrètes'
      },
      scoring_rules: [
        { criterion: 'depth', weight: 0.4, max_points: 40, evaluation_method: 'ai' },
        { criterion: 'accuracy', weight: 0.3, max_points: 30, evaluation_method: 'ai' },
        { criterion: 'suggestions', weight: 0.3, max_points: 30, evaluation_method: 'ai' }
      ]
    },
    {
      type: 'creative',
      difficulty: 'expert',
      templates: [
        'Crée un prompt qui génère {creative_output} de manière {creative_style}',
        'Développe un prompt créatif pour {creative_challenge}',
        'Conçois un prompt qui inspire {creative_goal}',
        'Crée un prompt artistique pour {artistic_medium}'
      ],
      variables: {
        creative_output: ['des histoires originales', 'des poèmes', 'des designs', 'des concepts innovants'],
        creative_style: ['surréaliste', 'minimaliste', 'baroque', 'futuriste', 'rétro'],
        creative_challenge: ['un brainstorming', 'une session créative', 'un atelier d\'écriture', 'un concours d\'idées'],
        creative_goal: ['la réflexion', 'l\'innovation', 'l\'expression artistique', 'la résolution créative'],
        artistic_medium: ['la peinture numérique', 'la sculpture', 'la musique', 'la danse', 'la photographie']
      },
      success_criteria: {
        originality: 'Approche créative unique',
        inspiration: 'Capacité à inspirer',
        adaptability: 'Adaptabilité à différents contextes'
      },
      scoring_rules: [
        { criterion: 'originality', weight: 0.4, max_points: 40, evaluation_method: 'ai' },
        { criterion: 'inspiration', weight: 0.3, max_points: 30, evaluation_method: 'ai' },
        { criterion: 'adaptability', weight: 0.3, max_points: 30, evaluation_method: 'ai' }
      ]
    }
  ];

  /**
   * Récupère le défi du jour
   */
  async getTodayChallenge(): Promise<DailyChallenge | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Générer directement un défi sans interaction avec Supabase
      console.log('Génération d\'un nouveau défi pour aujourd\'hui...');
      const challenge = await this.generateDailyChallenge();

      if (challenge) {
        // Notifier les utilisateurs si c'est la première génération du jour
        await this.notifyUsersOfDailyChallenge(challenge, today);

        return challenge;
      }

      // Fallback vers défi par défaut
      return this.getDefaultChallenge();
    } catch (error) {
      console.error('Erreur récupération défi du jour:', error);
      // En cas d'erreur totale, retourner un défi par défaut
      return this.getDefaultChallenge();
    }
  }

  /**
   * Retourne un défi par défaut en cas d'erreur
   */
  private getDefaultChallenge(): DailyChallenge {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      id: 'default-challenge',
      challenge_date: today,
      challenge_type: 'transform',
      title: 'Transforme ce prompt vague en version RCTF : "Écris-moi un article"',
      description: 'Améliore ce prompt en utilisant la structure RCTF (Rôle, Contexte, Tâche, Format) pour le rendre plus efficace et précis.',
      difficulty: 'beginner',
      base_prompt: 'Écris-moi un article',
      success_criteria: {
        has_role: 'Contient un rôle défini',
        has_context: 'Inclut le contexte nécessaire',
        has_task: 'Tâche claire et précise',
        has_format: 'Format de sortie spécifié'
      },
      max_score: 100,
      time_limit: undefined,
      active: true,
      hints: [
        'Définissez le rôle de l\'IA (ex: expert en rédaction)',
        'Ajoutez le contexte (ex: type d\'article, public cible)',
        'Précisez la tâche (ex: structure, longueur, style)',
        'Spécifiez le format (ex: introduction, développement, conclusion)'
      ],
      tags: ['transform', 'beginner'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Génère un nouveau défi quotidien
   */
  private async generateDailyChallenge(): Promise<DailyChallenge | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Sélectionner un template aléatoire
      const template = this.challengeTemplates[
        Math.floor(Math.random() * this.challengeTemplates.length)
      ];
      
      // Générer le contenu du défi
      const challengeContent = this.generateChallengeFromTemplate(template);
      
      // Retourner directement le défi sans l'insérer en base
      // pour éviter les problèmes RLS
      const challenge: DailyChallenge = {
        id: `challenge-${Date.now()}`,
        challenge_date: today,
        challenge_type: template.type,
        title: challengeContent.title,
        description: challengeContent.description,
        difficulty: template.difficulty,
        base_prompt: challengeContent.base_prompt,
        success_criteria: template.success_criteria,
        max_score: 100,
        time_limit: template.type === 'speed' ? 600 : undefined,
        active: true,
        hints: challengeContent.hints,
        tags: [template.type, template.difficulty],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return challenge;
    } catch (error) {
      console.error('Erreur génération défi:', error);
      return null;
    }
  }

  /**
   * Génère le contenu d'un défi à partir d'un template
   */
  private generateChallengeFromTemplate(template: ChallengeTemplate) {
    // Sélectionner un template de texte aléatoire
    const textTemplate = template.templates[
      Math.floor(Math.random() * template.templates.length)
    ];
    
    // Remplacer les variables
    let title = textTemplate;
    let description = textTemplate;
    let base_prompt = '';
    
    Object.entries(template.variables).forEach(([key, values]) => {
      const value = values[Math.floor(Math.random() * values.length)];
      title = title.replace(`{${key}}`, value);
      description = description.replace(`{${key}}`, value);
      
      if (key === 'prompt') {
        base_prompt = value;
      }
    });

    // Générer des indices
    const hints = this.generateHints(template.type);

    return {
      title: title.length > 100 ? title.substring(0, 97) + '...' : title,
      description,
      base_prompt,
      hints
    };
  }

  /**
   * Génère des indices pour un type de défi
   */
  private generateHints(type: string): string[] {
    const hintsMap: Record<string, string[]> = {
      transform: [
        'Pensez à la structure RCTF',
        'N\'oubliez pas de définir un rôle précis',
        'Le contexte est crucial pour une bonne réponse',
        'Spécifiez toujours le format de sortie souhaité'
      ],
      create: [
        'Utilisez la méthode ACTEUR pour les personas',
        'Incluez des exemples concrets',
        'Pensez à la réutilisabilité',
        'Soyez spécifique au domaine'
      ],
      speed: [
        'Priorisez la structure sur les détails',
        'Utilisez des templates mentaux',
        'Commencez par les éléments essentiels',
        'La pratique améliore la vitesse'
      ]
    };

    return hintsMap[type] || [];
  }

  /**
   * Notifie les utilisateurs de la disponibilité du nouveau défi quotidien
   */
  private async notifyUsersOfDailyChallenge(
    challenge: DailyChallenge,
    date: string
  ): Promise<void> {
    try {
      // Vérifier si nous avons déjà notifié aujourd'hui
      if (this.lastNotificationDate === date) {
        return;
      }

      // Récupérer tous les utilisateurs avec les notifications daily_challenge activées
      const { data: preferences, error } = await this.supabase
        .from('notification_preferences')
        .select('user_id, notification_types_enabled')
        .eq('notification_types_enabled->daily_challenge', true);

      if (error) {
        console.error('Erreur récupération préférences notifications:', error);
        return;
      }

      // Notifier chaque utilisateur
      if (preferences && preferences.length > 0) {
        const notificationPromises = preferences.map((pref: { user_id: string }) =>
          studentNotificationService.notifyDailyChallengeAvailable(
            pref.user_id,
            challenge.title
          )
        );

        await Promise.all(notificationPromises);

        // Marquer que nous avons notifié pour cette date
        this.lastNotificationDate = date;

        console.log(
          `✅ ${preferences.length} utilisateur(s) notifié(s) du nouveau défi quotidien`
        );
      }
    } catch (error) {
      console.error('Erreur notification utilisateurs défi quotidien:', error);
      // Ne pas bloquer l'exécution si les notifications échouent
    }
  }

  /**
   * Récupère la participation d'un utilisateur à un défi
   */
  async getUserParticipation(
    userId: string,
    challengeId: string
  ): Promise<ChallengeParticipation | null> {
    try {
      const { data, error } = await this.supabase
        .from('challenge_participations')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ChallengeParticipation | null;
    } catch (error) {
      console.error('Erreur récupération participation:', error);
      return null;
    }
  }

  /**
   * Soumet une participation à un défi
   */
  async submitChallenge(
    userId: string,
    challengeId: string,
    submission: string
  ): Promise<ChallengeParticipation | null> {
    try {
      // Récupérer le défi pour l'évaluation
      const { data: challenge } = await this.supabase
        .from('daily_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (!challenge) throw new Error('Défi non trouvé');

      // Évaluer la soumission
      const evaluation = await this.evaluateSubmission(
        submission,
        challenge as DailyChallenge
      );

      // Créer la participation
      const { data, error } = await this.supabase
        .from('challenge_participations')
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          submission,
          score: evaluation.score,
          ai_evaluation: evaluation,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour le leaderboard
      await this.updateLeaderboard(challengeId, userId, evaluation.score);

      // Mettre à jour les stats utilisateur
      await this.updateUserStats(userId);

      return data as ChallengeParticipation;
    } catch (error) {
      console.error('Erreur soumission défi:', error);
      return null;
    }
  }

  /**
   * Évalue une soumission
   */
  private async evaluateSubmission(
    submission: string,
    challenge: DailyChallenge
  ): Promise<AIEvaluation> {
    // Évaluation simplifiée basée sur les critères
    // Dans une vraie app, on utiliserait l'IA pour une évaluation plus précise
    
    let totalScore = 0;
    const criteriaScores: Record<string, number> = {};
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Évaluation basique par mots-clés
    if (challenge.challenge_type === 'transform') {
      // Vérifier la présence de RCTF
      const hasRole = /rôle|agis|expert|consultant/i.test(submission);
      const hasContext = submission.split(' ').length > 30;
      const hasTask = /créer|générer|analyser|développer/i.test(submission);
      const hasFormat = /format|structure|bullet|tableau|json/i.test(submission);

      criteriaScores['role'] = hasRole ? 25 : 0;
      criteriaScores['context'] = hasContext ? 25 : 10;
      criteriaScores['task'] = hasTask ? 25 : 0;
      criteriaScores['format'] = hasFormat ? 25 : 0;

      totalScore = Object.values(criteriaScores).reduce((a, b) => a + b, 0);

      if (hasRole) strengths.push('Rôle bien défini');
      else improvements.push('Ajouter un rôle spécifique');

      if (hasContext) strengths.push('Contexte détaillé');
      else improvements.push('Enrichir le contexte');

      if (hasTask) strengths.push('Tâche claire');
      else improvements.push('Préciser la tâche');

      if (hasFormat) strengths.push('Format spécifié');
      else improvements.push('Définir le format de sortie');
    } else {
      // Évaluation générique pour les autres types
      const wordCount = submission.split(' ').length;
      const hasStructure = /\d+\.|•|-|\*/.test(submission);
      
      totalScore = Math.min(100, Math.floor(
        (wordCount / 100) * 50 + (hasStructure ? 30 : 0) + 20
      ));

      if (wordCount > 50) strengths.push('Réponse détaillée');
      if (hasStructure) strengths.push('Bien structuré');
    }

    return {
      score: totalScore,
      feedback: totalScore >= 80 
        ? 'Excellent travail ! Votre prompt est bien structuré et complet.'
        : totalScore >= 60
        ? 'Bon travail ! Quelques améliorations possibles.'
        : 'Des points à améliorer. Consultez les suggestions.',
      strengths,
      improvements,
      criteria_scores: criteriaScores,
      model_used: 'rule-based-v1',
      evaluated_at: new Date().toISOString()
    };
  }

  /**
   * Met à jour le leaderboard
   */
  private async updateLeaderboard(
    challengeId: string,
    userId: string,
    score: number
  ): Promise<void> {
    try {
      // Calculer le rang
      const { count } = await this.supabase
        .from('challenge_participations')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challengeId)
        .gt('score', score);

      const rank = (count || 0) + 1;

      // Insérer ou mettre à jour l'entrée du leaderboard
      await this.supabase
        .from('challenge_leaderboard')
        .upsert({
          challenge_id: challengeId,
          user_id: userId,
          rank,
          score
        });
    } catch (error) {
      console.error('Erreur mise à jour leaderboard:', error);
    }
  }

  /**
   * Récupère le leaderboard d'un défi
   */
  async getLeaderboard(
    challengeId: string,
    userId?: string,
    limit: number = 10
  ): Promise<{ leaderboard: LeaderboardEntry[], userRank: number | null }> {
    try {
      const { data: leaderboard, error } = await this.supabase
        .from('challenge_leaderboard')
        .select(`
          *,
          user_profiles!inner(full_name, avatar_url)
        `)
        .eq('challenge_id', challengeId)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Trouver le rang de l'utilisateur
      let userRank: number | null = null;
      if (userId) {
        const userEntry = (leaderboard || []).find((entry: any) => entry.user_id === userId);
        if (userEntry) {
          userRank = userEntry.rank;
        } else {
          // Si pas dans le top, chercher son rang exact
          const { data: userRankData } = await this.supabase
            .from('challenge_leaderboard')
            .select('rank')
            .eq('challenge_id', challengeId)
            .eq('user_id', userId)
            .single();
          
          userRank = userRankData?.rank || null;
        }
      }

      return {
        leaderboard: (leaderboard || []) as LeaderboardEntry[],
        userRank
      };
    } catch (error) {
      console.error('Erreur récupération leaderboard:', error);
      return { leaderboard: [], userRank: null };
    }
  }

  /**
   * Met à jour les statistiques utilisateur
   */
  private async updateUserStats(userId: string): Promise<void> {
    try {
      // Récupérer toutes les participations de l'utilisateur
      const { data: participations } = await this.supabase
        .from('challenge_participations')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (!participations || participations.length === 0) return;

      // Calculer les stats
      const totalParticipations = participations.length;
      const totalScore = participations.reduce((sum: number, p: any) => sum + (p.score || 0), 0);
      const averageScore = totalScore / totalParticipations;

      // Calculer le streak
      let currentStreak = 0;
      const today = new Date().toDateString();
      const sortedDates = participations
        .map((p: any) => new Date(p.completed_at).toDateString())
        .filter((date: string, index: number, self: string[]) => self.indexOf(date) === index)
        .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());

      if (sortedDates[0] === today) {
        currentStreak = 1;
        let previousDate = new Date();
        
        for (let i = 1; i < sortedDates.length; i++) {
          previousDate.setDate(previousDate.getDate() - 1);
          if (sortedDates[i] === previousDate.toDateString()) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Sauvegarder les stats (simplifié, normalement dans une table dédiée)
      await this.supabase
        .from('user_profiles')
        .update({
          challenge_stats: {
            total_participations: totalParticipations,
            total_score: totalScore,
            average_score: averageScore,
            current_streak: currentStreak
          }
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Erreur mise à jour stats utilisateur:', error);
    }
  }

  /**
   * Récupère les statistiques d'un utilisateur
   */
  async getUserStats(userId: string): Promise<ChallengeUserStats | null> {
    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('challenge_stats')
        .eq('user_id', userId)
        .single();

      if (!profile?.challenge_stats) {
        return {
          user_id: userId,
          total_participations: 0,
          total_wins: 0,
          current_streak: 0,
          best_streak: 0,
          total_score: 0,
          average_score: 0,
          average_time: 0,
          stats_by_type: {
            transform: { count: 0, average_score: 0, best_score: 0 },
            create: { count: 0, average_score: 0, best_score: 0 },
            speed: { count: 0, average_score: 0, best_score: 0 },
            analysis: { count: 0, average_score: 0, best_score: 0 },
            creative: { count: 0, average_score: 0, best_score: 0 }
          },
          badges_earned: [],
          achievements: []
        };
      }

      return profile.challenge_stats as ChallengeUserStats;
    } catch (error) {
      console.error('Erreur récupération stats utilisateur:', error);
      return null;
    }
  }

  /**
   * Récupère les défis récents
   */
  async getRecentChallenges(days: number = 7): Promise<DailyChallenge[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('daily_challenges')
        .select('*')
        .gte('challenge_date', startDate.toISOString().split('T')[0])
        .order('challenge_date', { ascending: false });

      if (error) throw error;
      return (data || []) as DailyChallenge[];
    } catch (error) {
      console.error('Erreur récupération défis récents:', error);
      return [];
    }
  }

  /**
   * Récupère les participations d'un utilisateur
   */
  async getUserParticipations(
    userId: string,
    limit: number = 10
  ): Promise<ChallengeParticipation[]> {
    try {
      const { data, error } = await this.supabase
        .from('challenge_participations')
        .select(`
          *,
          daily_challenges!inner(*)
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as ChallengeParticipation[];
    } catch (error) {
      console.error('Erreur récupération participations:', error);
      return [];
    }
  }

  /**
   * Soumet une évaluation par les pairs
   */
  async submitPeerReview(
    participationId: string,
    reviewerId: string,
    rating: number,
    comment?: string
  ): Promise<PeerReview | null> {
    try {
      const { data, error } = await this.supabase
        .from('peer_reviews')
        .insert({
          participation_id: participationId,
          reviewer_id: reviewerId,
          rating,
          comment
        })
        .select()
        .single();

      if (error) throw error;

      // Notifier l'auteur de la soumission qu'il a reçu une peer review
      try {
        // Récupérer la participation pour obtenir l'ID de l'auteur et le challenge
        const { data: participation } = await this.supabase
          .from('challenge_participations')
          .select(`
            user_id,
            daily_challenges!inner(title)
          `)
          .eq('id', participationId)
          .single();

        // Récupérer le nom du reviewer
        const { data: reviewer } = await this.supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', reviewerId)
          .single();

        if (participation && reviewer) {
          await studentNotificationService.notifyPeerReview(
            participation.user_id,
            reviewer.full_name || 'Un étudiant',
            (participation.daily_challenges as any).title
          );
        }
      } catch (notificationError) {
        console.error('Erreur notification peer review:', notificationError);
        // Ne pas bloquer la création de la review si la notification échoue
      }

      return data as PeerReview;
    } catch (error) {
      console.error('Erreur soumission peer review:', error);
      return null;
    }
  }

  /**
   * Met à jour une participation
   */
  async updateParticipation(
    participationId: string,
    updates: Partial<ChallengeParticipation>
  ): Promise<void> {
    try {
      await this.supabase
        .from('challenge_participations')
        .update(updates)
        .eq('id', participationId);
    } catch (error) {
      console.error('Erreur mise à jour participation:', error);
    }
  }

  /**
   * Crée une notification
   */
  async createNotification(
    userId: string,
    type: 'new_challenge' | 'challenge_ending' | 'achievement' | 'leaderboard_update',
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await this.supabase
        .from('challenge_notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data,
          read: false
        });
    } catch (error) {
      console.error('Erreur création notification:', error);
    }
  }

  /**
   * Marque une notification comme lue
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      await this.supabase
        .from('challenge_notifications')
        .update({ read: true })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  }
}

// Export instance singleton
export const challengeService = new ChallengeService();
