'use client';

import React, { useState } from 'react';
import SkillTreeVisualization from '@/components/gamification/SkillTreeVisualization';
import { SkillNode, UserSkillProgress } from '@/types/skillTree.types';
import { Trophy, Target } from 'lucide-react';

export default function SkillTreePage() {
  // Mock data pour la démonstration
  const mockNodes: SkillNode[] = [
    // Niveau 0 - Fondamentaux
    {
      id: 'skill-1',
      category_id: 'cat-1',
      skill_key: 'basic_prompting',
      name: 'Basic Prompting',
      name_fr: 'Prompting de Base',
      tree_level: 0,
      display_order: 1,
      prerequisites: [],
      min_level_required: 1,
      xp_required: 0,
      description: 'Apprenez les bases de la création de prompts efficaces',
      detailed_explanation: 'Le prompting de base consiste à structurer vos demandes de manière claire et précise pour obtenir les meilleurs résultats de l\'IA.',
      unlock_type: 'automatic',
      icon_emoji: '🎯',
      difficulty: 'beginner',
      estimated_time: 15,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      examples: [
        {
          title: 'Prompt simple',
          prompt: 'Explique-moi le concept de photosynthèse en termes simples.',
          explanation: 'Un prompt clair et direct qui spécifie le niveau de complexité souhaité.'
        }
      ]
    },
    {
      id: 'skill-2',
      category_id: 'cat-1',
      skill_key: 'clear_instructions',
      name: 'Clear Instructions',
      name_fr: 'Instructions Claires',
      tree_level: 0,
      display_order: 2,
      prerequisites: [],
      min_level_required: 1,
      xp_required: 0,
      description: 'Maîtrisez l\'art de donner des instructions précises',
      unlock_type: 'automatic',
      icon_emoji: '📝',
      difficulty: 'beginner',
      estimated_time: 20,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    // Niveau 1 - Techniques intermédiaires
    {
      id: 'skill-3',
      category_id: 'cat-2',
      skill_key: 'context_setting',
      name: 'Context Setting',
      name_fr: 'Définition du Contexte',
      tree_level: 1,
      display_order: 1,
      prerequisites: ['skill-1'],
      min_level_required: 2,
      xp_required: 500,
      description: 'Apprenez à fournir le contexte approprié pour vos prompts',
      detailed_explanation: 'Le contexte aide l\'IA à mieux comprendre votre demande et à fournir des réponses plus pertinentes et adaptées.',
      unlock_type: 'challenge',
      icon_emoji: '🎨',
      difficulty: 'intermediate',
      estimated_time: 30,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      examples: [
        {
          title: 'Avec contexte',
          prompt: 'En tant que professeur de biologie enseignant à des élèves de 5e, explique la photosynthèse.',
          explanation: 'Le contexte (professeur, niveau 5e) aide à adapter la réponse au public cible.'
        }
      ]
    },
    {
      id: 'skill-4',
      category_id: 'cat-2',
      skill_key: 'role_prompting',
      name: 'Role Prompting',
      name_fr: 'Prompting par Rôle',
      tree_level: 1,
      display_order: 2,
      prerequisites: ['skill-2'],
      min_level_required: 2,
      xp_required: 500,
      description: 'Utilisez les rôles pour guider les réponses de l\'IA',
      unlock_type: 'challenge',
      icon_emoji: '🎭',
      difficulty: 'intermediate',
      estimated_time: 25,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    // Niveau 2 - Techniques avancées
    {
      id: 'skill-5',
      category_id: 'cat-3',
      skill_key: 'chain_of_thought',
      name: 'Chain of Thought',
      name_fr: 'Chaîne de Pensée',
      tree_level: 2,
      display_order: 1,
      prerequisites: ['skill-3', 'skill-4'],
      min_level_required: 3,
      xp_required: 2000,
      description: 'Guidez l\'IA à travers un raisonnement étape par étape',
      detailed_explanation: 'La technique Chain of Thought encourage l\'IA à décomposer les problèmes complexes en étapes logiques, améliorant la qualité du raisonnement.',
      unlock_type: 'challenge',
      icon_emoji: '🧠',
      difficulty: 'advanced',
      estimated_time: 45,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      examples: [
        {
          title: 'Raisonnement étape par étape',
          prompt: 'Résous ce problème étape par étape:\nSi un train parcourt 120 km en 2 heures, quelle distance parcourra-t-il en 5 heures à la même vitesse?',
          explanation: 'Demander un raisonnement étape par étape améliore la précision des calculs.'
        }
      ]
    },
    {
      id: 'skill-6',
      category_id: 'cat-3',
      skill_key: 'few_shot_learning',
      name: 'Few-Shot Learning',
      name_fr: 'Apprentissage Few-Shot',
      tree_level: 2,
      display_order: 2,
      prerequisites: ['skill-3'],
      min_level_required: 3,
      xp_required: 2000,
      description: 'Utilisez des exemples pour guider l\'IA',
      unlock_type: 'challenge',
      icon_emoji: '📚',
      difficulty: 'advanced',
      estimated_time: 40,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    // Niveau 3 - Techniques expertes
    {
      id: 'skill-7',
      category_id: 'cat-4',
      skill_key: 'prompt_chaining',
      name: 'Prompt Chaining',
      name_fr: 'Enchaînement de Prompts',
      tree_level: 3,
      display_order: 1,
      prerequisites: ['skill-5', 'skill-6'],
      min_level_required: 4,
      xp_required: 5000,
      description: 'Maîtrisez l\'art d\'enchaîner plusieurs prompts',
      detailed_explanation: 'L\'enchaînement de prompts consiste à décomposer une tâche complexe en plusieurs étapes, chaque prompt s\'appuyant sur les résultats du précédent.',
      unlock_type: 'challenge',
      icon_emoji: '⛓️',
      difficulty: 'expert',
      estimated_time: 60,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const mockProgress: Record<string, UserSkillProgress> = {
    'skill-1': {
      id: 'prog-1',
      user_id: 'user-1',
      skill_node_id: 'skill-1',
      status: 'mastered',
      progress_percentage: 100,
      practice_count: 15,
      success_count: 15,
      unlocked_at: '2024-01-15T10:00:00Z',
      started_at: '2024-01-15T10:00:00Z',
      completed_at: '2024-01-20T14:30:00Z',
      mastered_at: '2024-01-25T16:00:00Z',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    'skill-2': {
      id: 'prog-2',
      user_id: 'user-1',
      skill_node_id: 'skill-2',
      status: 'completed',
      progress_percentage: 100,
      practice_count: 10,
      success_count: 9,
      unlocked_at: '2024-01-16T10:00:00Z',
      started_at: '2024-01-16T10:00:00Z',
      completed_at: '2024-01-22T14:30:00Z',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    'skill-3': {
      id: 'prog-3',
      user_id: 'user-1',
      skill_node_id: 'skill-3',
      status: 'in_progress',
      progress_percentage: 65,
      practice_count: 6,
      success_count: 4,
      unlocked_at: '2024-01-23T10:00:00Z',
      started_at: '2024-01-23T10:00:00Z',
      last_practiced_at: '2024-02-20T12:00:00Z',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    'skill-4': {
      id: 'prog-4',
      user_id: 'user-1',
      skill_node_id: 'skill-4',
      status: 'available',
      progress_percentage: 0,
      practice_count: 0,
      success_count: 0,
      unlocked_at: '2024-01-23T10:00:00Z',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    // skill-5, skill-6, skill-7 sont verrouillées (pas dans userProgress)
  };

  const handleNodeClick = (node: SkillNode) => {
    console.log('Node clicked:', node);
  };

  const handleUnlockClick = (node: SkillNode) => {
    console.log('Unlock clicked:', node);
    // TODO: Implémenter la logique de déverrouillage
    alert(`Débloquer: ${node.name_fr}`);
  };

  // Calculer les statistiques
  const stats = {
    total: mockNodes.length,
    unlocked: Object.values(mockProgress).filter(p => p.status !== 'locked').length,
    completed: Object.values(mockProgress).filter(p => ['completed', 'mastered'].includes(p.status)).length,
    mastered: Object.values(mockProgress).filter(p => p.status === 'mastered').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Target className="w-8 h-8 text-indigo-600" />
                Arbre de Compétences
              </h1>
              <p className="text-gray-600 mt-2">
                Progressez dans votre maîtrise du prompt engineering en débloquant de nouvelles compétences
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">
                {stats.mastered}/{stats.total}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
              <div className="text-sm text-indigo-600 font-medium mb-1">Total</div>
              <div className="text-3xl font-bold text-indigo-900">{stats.total}</div>
              <div className="text-xs text-indigo-600 mt-1">Compétences disponibles</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">Débloquées</div>
              <div className="text-3xl font-bold text-blue-900">{stats.unlocked}</div>
              <div className="text-xs text-blue-600 mt-1">En cours ou terminées</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium mb-1">Complétées</div>
              <div className="text-3xl font-bold text-green-900">{stats.completed}</div>
              <div className="text-xs text-green-600 mt-1">Prêtes à utiliser</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
              <div className="text-sm text-yellow-600 font-medium mb-1">Maîtrisées</div>
              <div className="text-3xl font-bold text-yellow-900">{stats.mastered}</div>
              <div className="text-xs text-yellow-600 mt-1">Expertise atteinte</div>
            </div>
          </div>
        </div>

        {/* Skill Tree Visualization */}
        <SkillTreeVisualization
          nodes={mockNodes}
          userProgress={mockProgress}
          onNodeClick={handleNodeClick}
          onUnlockClick={handleUnlockClick}
        />

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Comment utiliser l&apos;arbre de compétences</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Cliquez sur un nœud pour voir les détails de la compétence</li>
            <li>• Les nœuds verts sont des prérequis déjà complétés</li>
            <li>• Les nœuds bleus sont disponibles pour déverrouillage</li>
            <li>• Les nœuds gris sont verrouillés - complétez les prérequis d&apos;abord</li>
            <li>• Les lignes en pointillés montrent les prérequis non remplis</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
