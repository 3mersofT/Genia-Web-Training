// Templates prédéfinis pour créer rapidement des modules

export interface ModuleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: string;
  estimatedDuration: number;
  capsuleStructure: CapsuleTemplate[];
  tags: string[];
}

export interface CapsuleTemplate {
  title: string;
  duration: number;
  sections: {
    hook: string;
    concept: string;
    demo: string;
    exercise: string;
    recap: string;
  };
}

export const moduleTemplates: ModuleTemplate[] = [
  {
    id: 'technical-tutorial',
    name: 'Tutoriel Technique',
    description: 'Pour enseigner une compétence technique step-by-step',
    icon: '⚙️',
    color: '#2563EB',
    difficulty: 'intermediate',
    estimatedDuration: 120,
    tags: ['technique', 'pratique', 'outils'],
    capsuleStructure: [
      {
        title: 'Introduction et Installation',
        duration: 15,
        sections: {
          hook: 'Pourquoi cette technologie est-elle révolutionnaire ?',
          concept: 'Vue d\'ensemble et architecture',
          demo: 'Installation et configuration pas à pas',
          exercise: 'Configurez votre environnement',
          recap: 'Points clés de l\'installation'
        }
      },
      {
        title: 'Concepts Fondamentaux',
        duration: 20,
        sections: {
          hook: 'Les 3 erreurs classiques des débutants',
          concept: 'Principes de base et syntaxe',
          demo: 'Premier exemple concret',
          exercise: 'Créez votre premier projet',
          recap: 'Checklist des bonnes pratiques'
        }
      },
      {
        title: 'Techniques Avancées',
        duration: 25,
        sections: {
          hook: 'Comment les experts optimisent leurs workflows',
          concept: 'Patterns avancés et optimisations',
          demo: 'Exemple professionnel complet',
          exercise: 'Challenge technique',
          recap: 'Ressources pour aller plus loin'
        }
      }
    ]
  },
  
  {
    id: 'business-strategy',
    name: 'Stratégie Business',
    description: 'Pour enseigner les concepts de stratégie d\'entreprise',
    icon: '📊',
    color: '#059669',
    difficulty: 'advanced',
    estimatedDuration: 180,
    tags: ['business', 'stratégie', 'management'],
    capsuleStructure: [
      {
        title: 'Analyse du Marché',
        duration: 30,
        sections: {
          hook: 'Comment une startup a dominé un marché saturé',
          concept: 'Frameworks d\'analyse concurrentielle',
          demo: 'Étude de cas : Netflix vs Blockbuster',
          exercise: 'Analysez votre marché cible',
          recap: 'Outils d\'analyse à retenir'
        }
      },
      {
        title: 'Définition de la Stratégie',
        duration: 35,
        sections: {
          hook: 'La stratégie qui a sauvé Apple de la faillite',
          concept: 'Canvas stratégique et positionnement',
          demo: 'Construction d\'une stratégie complète',
          exercise: 'Créez votre canvas stratégique',
          recap: 'Validation de votre stratégie'
        }
      },
      {
        title: 'Exécution et Mesure',
        duration: 40,
        sections: {
          hook: 'Pourquoi 90% des stratégies échouent',
          concept: 'KPIs et tableau de bord stratégique',
          demo: 'Mise en place d\'un système de suivi',
          exercise: 'Définissez vos indicateurs clés',
          recap: 'Plan d\'action pour les 90 prochains jours'
        }
      }
    ]
  },
  
  {
    id: 'creative-workshop',
    name: 'Atelier Créatif',
    description: 'Pour stimuler la créativité et l\'innovation',
    icon: '🎨',
    color: '#7C3AED',
    difficulty: 'beginner',
    estimatedDuration: 90,
    tags: ['créativité', 'innovation', 'design thinking'],
    capsuleStructure: [
      {
        title: 'Réveil Créatif',
        duration: 15,
        sections: {
          hook: 'Le secret des génies créatifs',
          concept: 'Neurologie de la créativité',
          demo: 'Exercices de déblocage mental',
          exercise: 'Challenge créatif 5 minutes',
          recap: 'Votre boîte à outils créative'
        }
      },
      {
        title: 'Méthodes de Créativité',
        duration: 25,
        sections: {
          hook: 'Comment Pixar invente ses histoires',
          concept: 'Brainstorming, Mind Mapping, SCAMPER',
          demo: 'Session de brainstorming guidée',
          exercise: 'Résolvez un défi créatif',
          recap: 'Choisissez votre méthode préférée'
        }
      },
      {
        title: 'De l\'Idée au Prototype',
        duration: 30,
        sections: {
          hook: 'L\'idée à 1 million d\'euros née d\'un Post-it',
          concept: 'Prototypage rapide et test d\'idées',
          demo: 'Création d\'un prototype en 10 minutes',
          exercise: 'Prototypez votre meilleure idée',
          recap: 'Plan pour développer vos idées'
        }
      }
    ]
  },
  
  {
    id: 'soft-skills',
    name: 'Compétences Relationnelles',
    description: 'Pour développer les soft skills essentielles',
    icon: '🤝',
    color: '#DC2626',
    difficulty: 'intermediate',
    estimatedDuration: 150,
    tags: ['communication', 'leadership', 'relationnel'],
    capsuleStructure: [
      {
        title: 'Communication Efficace',
        duration: 25,
        sections: {
          hook: 'Le mot qui peut changer votre carrière',
          concept: 'Principes de communication interpersonnelle',
          demo: 'Techniques d\'écoute active',
          exercise: 'Simulation de conversation difficile',
          recap: 'Votre plan de communication personnalisé'
        }
      },
      {
        title: 'Leadership Situationnel',
        duration: 30,
        sections: {
          hook: 'Comment un introverti est devenu CEO',
          concept: 'Styles de leadership et adaptation',
          demo: 'Analyse de situations de leadership',
          exercise: 'Auto-évaluation de votre style',
          recap: 'Votre feuille de route leadership'
        }
      },
      {
        title: 'Gestion des Conflits',
        duration: 25,
        sections: {
          hook: 'Le conflit qui a révolutionné une entreprise',
          concept: 'Typologie des conflits et résolutions',
          demo: 'Médiation d\'un conflit réel',
          exercise: 'Jeu de rôle conflit constructif',
          recap: 'Votre boîte à outils anti-conflit'
        }
      }
    ]
  }
];

export class ModuleTemplateService {
  /**
   * Obtenir tous les templates disponibles
   */
  static getAllTemplates(): ModuleTemplate[] {
    return moduleTemplates;
  }
  
  /**
   * Obtenir un template par ID
   */
  static getTemplateById(id: string): ModuleTemplate | null {
    return moduleTemplates.find(template => template.id === id) || null;
  }
  
  /**
   * Filtrer templates par difficulté
   */
  static getTemplatesByDifficulty(difficulty: string): ModuleTemplate[] {
    return moduleTemplates.filter(template => template.difficulty === difficulty);
  }
  
  /**
   * Rechercher templates par tag
   */
  static getTemplatesByTag(tag: string): ModuleTemplate[] {
    return moduleTemplates.filter(template => 
      template.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }
  
  /**
   * Créer un module à partir d'un template
   */
  static createModuleFromTemplate(
    template: ModuleTemplate, 
    customData: {
      title?: string;
      description?: string;
      customizations?: any;
    }
  ): any {
    const moduleData = {
      id: `module-${Date.now()}`,
      title: customData.title || `${template.name} - ${new Date().toLocaleDateString('fr-FR')}`,
      description: customData.description || template.description,
      icon: template.icon,
      color: template.color,
      difficulty: template.difficulty,
      duration_minutes: template.estimatedDuration,
      order_index: 999, // À réorganiser
      is_published: false,
      created_from_template: template.id,
      capsules: template.capsuleStructure.map((capsuleTemplate, index) => ({
        id: `capsule-${Date.now()}-${index}`,
        title: capsuleTemplate.title,
        duration_minutes: capsuleTemplate.duration,
        difficulty: template.difficulty,
        order_index: index + 1,
        is_published: false,
        sections: capsuleTemplate.sections,
        tags: template.tags,
        stats: {
          views: 0,
          completions: 0,
          avgScore: 0,
          avgTime: capsuleTemplate.duration
        }
      }))
    };
    
    return moduleData;
  }
  
  /**
   * Obtenir des suggestions de templates basées sur des keywords
   */
  static suggestTemplates(keywords: string[]): ModuleTemplate[] {
    const suggestions = moduleTemplates.filter(template => {
      const searchText = `${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
      return keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
    });
    
    return suggestions.slice(0, 3); // Top 3 suggestions
  }
}
