'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  CheckCircle2,
  Star,
  Loader2,
  Target,
  TrendingUp,
  Award,
  X,
  Zap,
  Clock,
  BookOpen
} from 'lucide-react';
import { SkillNode, UserSkillProgress, SkillProgressStatus, SkillTreeNode } from '@/types/skillTree.types';

interface SkillTreeVisualizationProps {
  nodes: SkillNode[];
  userProgress: Record<string, UserSkillProgress>;
  loading?: boolean;
  onNodeClick?: (node: SkillNode) => void;
  onUnlockClick?: (node: SkillNode) => void;
}

export default function SkillTreeVisualization({
  nodes,
  userProgress,
  loading = false,
  onNodeClick,
  onUnlockClick
}: SkillTreeVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Organiser les nœuds par niveau pour le layout en arbre
  const nodesByLevel = useMemo(() => {
    const levels: SkillNode[][] = [];

    nodes.forEach(node => {
      if (!levels[node.tree_level]) {
        levels[node.tree_level] = [];
      }
      levels[node.tree_level].push(node);
    });

    // Trier chaque niveau par display_order
    levels.forEach(level => {
      level.sort((a, b) => a.display_order - b.display_order);
    });

    return levels;
  }, [nodes]);

  // Calculer le statut de chaque nœud
  const getNodeStatus = (nodeId: string): SkillProgressStatus => {
    const progress = userProgress[nodeId];
    return progress?.status || 'locked';
  };

  // Vérifier si les prérequis sont remplis
  const arePrerequisitesMet = (node: SkillNode): boolean => {
    if (!node.prerequisites || node.prerequisites.length === 0) return true;

    return node.prerequisites.every(prereqId => {
      const prereqProgress = userProgress[prereqId];
      return prereqProgress && ['completed', 'mastered'].includes(prereqProgress.status);
    });
  };

  // Obtenir la couleur selon le statut
  const getStatusColor = (status: SkillProgressStatus): string => {
    switch (status) {
      case 'mastered':
        return 'text-yellow-500 border-yellow-500 bg-yellow-50';
      case 'completed':
        return 'text-green-500 border-green-500 bg-green-50';
      case 'in_progress':
        return 'text-blue-500 border-blue-500 bg-blue-50';
      case 'available':
        return 'text-indigo-500 border-indigo-500 bg-indigo-50';
      case 'locked':
      default:
        return 'text-gray-400 border-gray-300 bg-gray-50';
    }
  };

  // Obtenir l'icône selon le statut
  const getStatusIcon = (status: SkillProgressStatus) => {
    switch (status) {
      case 'mastered':
        return <Star className="w-5 h-5" fill="currentColor" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'in_progress':
        return <TrendingUp className="w-5 h-5" />;
      case 'available':
        return <Unlock className="w-5 h-5" />;
      case 'locked':
      default:
        return <Lock className="w-5 h-5" />;
    }
  };

  // Gérer le clic sur un nœud
  const handleNodeClick = (node: SkillNode) => {
    setSelectedNode(node);
    onNodeClick?.(node);
  };

  // Dimensions du layout
  const nodeWidth = 140;
  const nodeHeight = 100;
  const horizontalSpacing = 180;
  const verticalSpacing = 140;

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              Arbre de Compétences
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Débloquez et maîtrisez les techniques de prompt engineering
            </p>
          </div>
        </div>

        {/* Loading Skeleton */}
        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-600">Chargement de l&apos;arbre de compétences...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!nodes || nodes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-600" />
              Arbre de Compétences
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Débloquez et maîtrisez les techniques de prompt engineering
            </p>
          </div>
        </div>

        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Aucune compétence disponible</p>
            <p className="text-sm text-gray-500 mt-1">L&apos;arbre de compétences sera bientôt disponible</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            Arbre de Compétences
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Débloquez et maîtrisez les techniques de prompt engineering
          </p>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Lock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Verrouillé</span>
          </div>
          <div className="flex items-center gap-1">
            <Unlock className="w-4 h-4 text-indigo-500" />
            <span className="text-gray-600">Disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600">En cours</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">Complété</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
            <span className="text-gray-600">Maîtrisé</span>
          </div>
        </div>
      </div>

      {/* SVG Tree Visualization */}
      <div className="relative overflow-x-auto">
        <svg
          className="w-full min-w-max"
          height={nodesByLevel.length * verticalSpacing + 100}
          style={{ minWidth: Math.max(...nodesByLevel.map(level => level.length)) * horizontalSpacing + 100 }}
        >
          <defs>
            {/* Gradient pour les connexions */}
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Dessiner les connexions entre les nœuds */}
          {nodes.map(node => {
            if (!node.prerequisites || node.prerequisites.length === 0) return null;

            return node.prerequisites.map(prereqId => {
              const prereqNode = nodes.find(n => n.id === prereqId);
              if (!prereqNode) return null;

              // Calculer les positions
              const fromLevel = nodesByLevel.findIndex(level => level.some(n => n.id === prereqId));
              const toLevel = node.tree_level;
              const fromIndex = nodesByLevel[fromLevel]?.findIndex(n => n.id === prereqId) ?? 0;
              const toIndex = nodesByLevel[toLevel]?.findIndex(n => n.id === node.id) ?? 0;

              const x1 = fromIndex * horizontalSpacing + horizontalSpacing / 2 + nodeWidth / 2;
              const y1 = fromLevel * verticalSpacing + verticalSpacing / 2 + nodeHeight;
              const x2 = toIndex * horizontalSpacing + horizontalSpacing / 2 + nodeWidth / 2;
              const y2 = toLevel * verticalSpacing + verticalSpacing / 2;

              const prereqStatus = getNodeStatus(prereqId);
              const isPrereqMet = ['completed', 'mastered'].includes(prereqStatus);

              return (
                <line
                  key={`${prereqId}-${node.id}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isPrereqMet ? '#10b981' : '#d1d5db'}
                  strokeWidth={isPrereqMet ? 2 : 1}
                  strokeDasharray={isPrereqMet ? '0' : '4 4'}
                  opacity={hoveredNode === node.id || hoveredNode === prereqId ? 1 : 0.5}
                />
              );
            });
          })}

          {/* Dessiner les nœuds */}
          {nodesByLevel.map((level, levelIndex) =>
            level.map((node, nodeIndex) => {
              const status = getNodeStatus(node.id);
              const prerequisitesMet = arePrerequisitesMet(node);
              const x = nodeIndex * horizontalSpacing + horizontalSpacing / 2;
              const y = levelIndex * verticalSpacing + verticalSpacing / 2;

              return (
                <g
                  key={node.id}
                  transform={`translate(${x}, ${y})`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => handleNodeClick(node)}
                  className="cursor-pointer transition-transform hover:scale-105"
                  style={{ transformOrigin: 'center' }}
                >
                  {/* Node background */}
                  <rect
                    width={nodeWidth}
                    height={nodeHeight}
                    rx={8}
                    className={`transition-all ${getStatusColor(status)}`}
                    stroke="currentColor"
                    strokeWidth={hoveredNode === node.id ? 3 : 2}
                    fill="currentColor"
                  />

                  {/* Node content */}
                  <foreignObject width={nodeWidth} height={nodeHeight}>
                    <div className="h-full flex flex-col items-center justify-center p-2 text-center">
                      {/* Icon */}
                      <div className={`mb-2 ${status === 'locked' ? 'text-gray-400' : 'text-current'}`}>
                        {node.icon_emoji ? (
                          <span className="text-2xl">{node.icon_emoji}</span>
                        ) : (
                          getStatusIcon(status)
                        )}
                      </div>

                      {/* Name */}
                      <div className={`text-xs font-semibold line-clamp-2 ${
                        status === 'locked' ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        {node.name_fr}
                      </div>

                      {/* Progress bar for in_progress nodes */}
                      {status === 'in_progress' && userProgress[node.id] && (
                        <div className="w-full mt-2">
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${userProgress[node.id].progress_percentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Prerequisites indicator */}
                      {!prerequisitesMet && status === 'locked' && (
                        <div className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Prérequis</span>
                        </div>
                      )}
                    </div>
                  </foreignObject>
                </g>
              );
            })
          )}
        </svg>
      </div>

      {/* Node Details Modal */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedNode(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${getStatusColor(getNodeStatus(selectedNode.id))}`}>
                    {selectedNode.icon_emoji ? (
                      <span className="text-3xl">{selectedNode.icon_emoji}</span>
                    ) : (
                      getStatusIcon(getNodeStatus(selectedNode.id))
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{selectedNode.name_fr}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedNode.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {selectedNode.difficulty && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedNode.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                          selectedNode.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          selectedNode.difficulty === 'advanced' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedNode.difficulty === 'beginner' ? 'Débutant' :
                           selectedNode.difficulty === 'intermediate' ? 'Intermédiaire' :
                           selectedNode.difficulty === 'advanced' ? 'Avancé' : 'Expert'}
                        </span>
                      )}
                      {selectedNode.estimated_time && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Clock className="w-3 h-3" />
                          {selectedNode.estimated_time} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedNode.description}</p>
                </div>

                {/* Detailed explanation */}
                {selectedNode.detailed_explanation && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Explication détaillée</h4>
                    <p className="text-sm text-gray-600">{selectedNode.detailed_explanation}</p>
                  </div>
                )}

                {/* Prerequisites */}
                {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Prérequis
                    </h4>
                    <div className="space-y-2">
                      {selectedNode.prerequisites.map(prereqId => {
                        const prereqNode = nodes.find(n => n.id === prereqId);
                        const prereqStatus = getNodeStatus(prereqId);
                        const isCompleted = ['completed', 'mastered'].includes(prereqStatus);

                        return prereqNode ? (
                          <div
                            key={prereqId}
                            className={`flex items-center gap-2 p-2 rounded-lg border ${
                              isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className={isCompleted ? 'text-green-600' : 'text-gray-400'}>
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </div>
                            <span className={`text-sm ${isCompleted ? 'text-green-900' : 'text-gray-600'}`}>
                              {prereqNode.name_fr}
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Examples */}
                {selectedNode.examples && selectedNode.examples.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Exemples
                    </h4>
                    <div className="space-y-3">
                      {selectedNode.examples.map((example, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="font-medium text-sm text-gray-900 mb-1">{example.title}</div>
                          <code className="text-xs text-gray-700 block bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap">
                            {example.prompt}
                          </code>
                          {example.explanation && (
                            <p className="text-xs text-gray-600 mt-2">{example.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress */}
                {userProgress[selectedNode.id] && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Votre progression
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <div className="text-xs text-indigo-600 font-medium mb-1">Progression</div>
                        <div className="text-2xl font-bold text-indigo-900">
                          {userProgress[selectedNode.id].progress_percentage}%
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-xs text-green-600 font-medium mb-1">Pratiques réussies</div>
                        <div className="text-2xl font-bold text-green-900">
                          {userProgress[selectedNode.id].success_count}/{userProgress[selectedNode.id].practice_count}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action button */}
                {onUnlockClick && getNodeStatus(selectedNode.id) === 'available' && (
                  <button
                    onClick={() => {
                      onUnlockClick(selectedNode);
                      setSelectedNode(null);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-5 h-5" />
                    Débloquer cette compétence
                  </button>
                )}

                {getNodeStatus(selectedNode.id) === 'locked' && !arePrerequisitesMet(selectedNode) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Complétez les prérequis pour débloquer cette compétence
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
