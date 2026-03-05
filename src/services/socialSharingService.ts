import type {
  Achievement,
} from '@/types/challenges.types';
import { BRAND_NAME } from '@/config/branding';
import type {
  Tournament,
  TournamentResult,
} from '@/types/tournaments.types';
import type {
  Team,
  TeamAchievement,
} from '@/types/teams.types';
import type {
  UserLevel,
  LevelDefinition,
} from '@/types/levels.types';
import type {
  SkillNode,
} from '@/types/skillTree.types';

/**
 * Types d'achievements partageables
 */
export type ShareableAchievementType =
  | 'level_up'
  | 'tournament_win'
  | 'skill_unlock'
  | 'badge_earned'
  | 'team_achievement'
  | 'challenge_complete'
  | 'streak_milestone';

/**
 * Plateforme de partage social
 */
export type SocialPlatform = 'twitter' | 'linkedin' | 'facebook' | 'link';

/**
 * Configuration d'un partage
 */
export interface ShareConfig {
  type: ShareableAchievementType;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  hashtags?: string[];
}

/**
 * Données pour générer une image de partage
 */
export interface ShareImageData {
  type: ShareableAchievementType;
  title: string;
  subtitle?: string;
  icon?: string;
  iconEmoji?: string;
  backgroundColor?: string;
  userLevel?: string;
  userName?: string;
  stats?: Record<string, string | number>;
}

/**
 * Résultat d'une génération d'image
 */
export interface ShareImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Service de partage social pour les achievements
 * Permet de partager les réussites sur les réseaux sociaux
 */
export class SocialSharingService {
  private baseUrl: string;

  constructor() {
    // En production, utiliser l'URL du site, en dev utiliser localhost
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  /**
   * Génère une configuration de partage pour une montée de niveau
   */
  generateLevelUpShare(
    userLevel: UserLevel,
    levelDefinition: LevelDefinition,
    userName: string
  ): ShareConfig {
    const title = `J'ai atteint le niveau ${levelDefinition.level_name_fr} sur ${BRAND_NAME} ! 🎉`;
    const description = `Je viens de monter au niveau ${levelDefinition.level_name_fr} avec ${userLevel.total_xp} XP total. Rejoignez-moi pour maîtriser le prompt engineering !`;
    const url = `${this.baseUrl}/share/level-up/${userLevel.user_id}`;

    return {
      type: 'level_up',
      title,
      description,
      url,
      hashtags: [BRAND_NAME, 'PromptEngineering', 'AILearning', levelDefinition.level_name_fr],
    };
  }

  /**
   * Génère une configuration de partage pour une victoire en tournoi
   */
  generateTournamentWinShare(
    tournament: Tournament,
    result: TournamentResult,
    userName: string
  ): ShareConfig {
    const position = result.final_rank === 1 ? '1ère' : `${result.final_rank}ème`;
    const title = `J'ai terminé ${position} place du tournoi "${tournament.title}" sur ${BRAND_NAME} ! 🏆`;
    const description = `Score final : ${result.total_score} points. ${result.prize_amount ? `Récompense : ${result.prize_amount} points` : ''}`;
    const url = `${this.baseUrl}/share/tournament/${tournament.id}/${result.participant_id}`;

    return {
      type: 'tournament_win',
      title,
      description,
      url,
      hashtags: [BRAND_NAME, 'PromptEngineering', 'Tournament', 'Winner'],
    };
  }

  /**
   * Génère une configuration de partage pour un déblocage de compétence
   */
  generateSkillUnlockShare(
    skill: SkillNode,
    userName: string,
    totalSkills: number
  ): ShareConfig {
    const title = `J'ai débloqué la compétence "${skill.name}" sur ${BRAND_NAME} ! 🚀`;
    const description = `${skill.description}. ${totalSkills} compétences débloquées au total !`;
    const url = `${this.baseUrl}/share/skill/${skill.id}`;

    return {
      type: 'skill_unlock',
      title,
      description,
      url,
      hashtags: [BRAND_NAME, 'PromptEngineering', 'SkillUnlock'],
    };
  }

  /**
   * Génère une configuration de partage pour un badge gagné
   */
  generateBadgeShare(
    achievement: Achievement,
    userName: string
  ): ShareConfig {
    const rarityEmoji = {
      common: '🥉',
      rare: '🥈',
      epic: '🥇',
      legendary: '💎',
    };

    const title = `J'ai débloqué le badge "${achievement.name}" sur ${BRAND_NAME} ! ${rarityEmoji[achievement.rarity]}`;
    const description = achievement.description;
    const url = `${this.baseUrl}/share/badge/${achievement.id}`;

    return {
      type: 'badge_earned',
      title,
      description,
      url,
      hashtags: [BRAND_NAME, 'Achievement', 'PromptEngineering'],
    };
  }

  /**
   * Génère une configuration de partage pour un achievement d'équipe
   */
  generateTeamAchievementShare(
    team: Team,
    achievement: TeamAchievement,
    userName: string
  ): ShareConfig {
    const title = `Notre équipe "${team.name}" a débloqué "${achievement.achievement_name}" sur ${BRAND_NAME} ! 🎊`;
    const description = achievement.achievement_description || 'Achievement débloqué !';
    const url = `${this.baseUrl}/share/team/${team.id}/achievement/${achievement.id}`;

    return {
      type: 'team_achievement',
      title,
      description,
      url,
      hashtags: [BRAND_NAME, 'TeamWork', 'PromptEngineering'],
    };
  }

  /**
   * Génère une configuration de partage pour un milestone de streak
   */
  generateStreakMilestoneShare(
    streakDays: number,
    userName: string
  ): ShareConfig {
    const title = `${streakDays} jours de suite sur ${BRAND_NAME} ! 🔥`;
    const description = `Je maintiens ma série depuis ${streakDays} jours en m'entraînant quotidiennement au prompt engineering !`;
    const url = `${this.baseUrl}/share/streak/${userName}`;

    return {
      type: 'streak_milestone',
      title,
      description,
      url,
      hashtags: [BRAND_NAME, 'Streak', 'DailyPractice', 'PromptEngineering'],
    };
  }

  /**
   * Obtient le texte de partage pour une plateforme spécifique
   */
  getShareText(config: ShareConfig, platform: SocialPlatform): string {
    switch (platform) {
      case 'twitter':
        // Twitter a une limite de 280 caractères
        const hashtags = config.hashtags?.map(tag => `#${tag}`).join(' ') || '';
        const twitterText = `${config.title}\n\n${config.description}\n\n${hashtags}`;
        return twitterText.length > 280
          ? `${config.title}\n\n${hashtags}`
          : twitterText;

      case 'linkedin':
        // LinkedIn permet des posts plus longs
        return `${config.title}\n\n${config.description}\n\nRejoignez-moi sur ${BRAND_NAME} pour maîtriser le prompt engineering !\n${config.url}`;

      case 'facebook':
        // Facebook permet également des posts longs
        return `${config.title}\n\n${config.description}\n\n${config.url}`;

      case 'link':
        // Pour le partage de lien simple
        return config.url;

      default:
        return `${config.title}\n\n${config.description}\n\n${config.url}`;
    }
  }

  /**
   * Génère l'URL de partage pour Twitter
   */
  shareToTwitter(config: ShareConfig): string {
    const text = encodeURIComponent(this.getShareText(config, 'twitter'));
    const url = encodeURIComponent(config.url);
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  }

  /**
   * Génère l'URL de partage pour LinkedIn
   */
  shareToLinkedIn(config: ShareConfig): string {
    const url = encodeURIComponent(config.url);
    const title = encodeURIComponent(config.title);
    const summary = encodeURIComponent(config.description);
    return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  }

  /**
   * Génère l'URL de partage pour Facebook
   */
  shareToFacebook(config: ShareConfig): string {
    const url = encodeURIComponent(config.url);
    const quote = encodeURIComponent(`${config.title}\n\n${config.description}`);
    return `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`;
  }

  /**
   * Copie le lien de partage dans le presse-papiers
   */
  async copyShareLink(config: ShareConfig): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const shareText = `${config.title}\n\n${config.description}\n\n${config.url}`;
        await navigator.clipboard.writeText(shareText);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur copie lien de partage:', error);
      return false;
    }
  }

  /**
   * Génère une image Open Graph pour le partage
   * Cette méthode retourne les données nécessaires pour générer une image via un API endpoint
   */
  async generateShareImage(data: ShareImageData): Promise<ShareImageResult> {
    try {
      // Dans une implémentation réelle, ceci appellerait un endpoint API
      // qui génère une image avec Canvas ou une bibliothèque comme @vercel/og
      const response = await fetch('/api/share/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération de l\'image');
      }

      const result = await response.json();
      return {
        success: true,
        imageUrl: result.imageUrl,
      };
    } catch (error) {
      console.error('Erreur génération image de partage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Ouvre une fenêtre de partage pour une plateforme spécifique
   */
  openShareWindow(url: string, platform: SocialPlatform): void {
    if (typeof window === 'undefined') return;

    const width = 550;
    const height = 420;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    const features = `width=${width},height=${height},left=${left},top=${top},toolbar=0,status=0,menubar=0,scrollbars=1,resizable=1`;

    window.open(url, `share-${platform}`, features);
  }

  /**
   * Partage sur une plateforme spécifique (ouvre la fenêtre de partage)
   */
  share(config: ShareConfig, platform: SocialPlatform): void {
    let shareUrl: string;

    switch (platform) {
      case 'twitter':
        shareUrl = this.shareToTwitter(config);
        this.openShareWindow(shareUrl, platform);
        break;

      case 'linkedin':
        shareUrl = this.shareToLinkedIn(config);
        this.openShareWindow(shareUrl, platform);
        break;

      case 'facebook':
        shareUrl = this.shareToFacebook(config);
        this.openShareWindow(shareUrl, platform);
        break;

      case 'link':
        this.copyShareLink(config);
        break;

      default:
        console.warn(`Plateforme de partage non supportée: ${platform}`);
    }
  }
}

// Export singleton
export const socialSharingService = new SocialSharingService();
