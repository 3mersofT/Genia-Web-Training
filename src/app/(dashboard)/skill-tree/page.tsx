'use client';

import React, { useState, useEffect } from 'react';
import SkillTreeVisualization from '@/components/gamification/SkillTreeVisualization';
import { SkillNode, UserSkillProgress } from '@/types/skillTree.types';
import { Trophy, Target } from 'lucide-react';

export default function SkillTreePage() {
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserSkillProgress>>({});

  useEffect(() => {
    // TODO: Fetch skill nodes and user progress from API
  }, []);

  const handleNodeClick = (node: SkillNode) => {
    console.log('Node clicked:', node);
  };

  const handleUnlockClick = (node: SkillNode) => {
    console.log('Unlock clicked:', node);
    // TODO: Implement unlock logic via API
  };

  // Calculer les statistiques
  const stats = {
    total: nodes.length,
    unlocked: Object.values(userProgress).filter(p => p.status !== 'locked').length,
    completed: Object.values(userProgress).filter(p => ['completed', 'mastered'].includes(p.status)).length,
    mastered: Object.values(userProgress).filter(p => p.status === 'mastered').length
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
        {nodes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune comp&eacute;tence disponible</h3>
            <p className="text-gray-500">L&apos;arbre de comp&eacute;tences sera affich&eacute; ici lorsque les donn&eacute;es seront disponibles.</p>
          </div>
        ) : (
          <SkillTreeVisualization
            nodes={nodes}
            userProgress={userProgress}
            onNodeClick={handleNodeClick}
            onUnlockClick={handleUnlockClick}
          />
        )}

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
