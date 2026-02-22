'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Star, Lock, Check, TrendingUp,
  Award, Target, Zap, BookOpen, Trophy, Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface SkillNode {
  id: string;
  title: string;
  description: string;
  level: number;
  unlocked: boolean;
  completed: boolean;
  progress: number;
  prerequisites: string[];
  xpReward: number;
  category: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export default function SkillTreePage() {
  const [mounted, setMounted] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock skill tree data
  const skillNodes: SkillNode[] = [
    {
      id: 'prompt-basics',
      title: 'Bases du Prompt',
      description: 'Apprenez les fondamentaux de la création de prompts efficaces',
      level: 1,
      unlocked: true,
      completed: true,
      progress: 100,
      prerequisites: [],
      xpReward: 100,
      category: 'beginner'
    },
    {
      id: 'rctf-method',
      title: 'Méthode RCTF',
      description: 'Maîtrisez la structure Rôle, Contexte, Tâche, Format',
      level: 2,
      unlocked: true,
      completed: false,
      progress: 60,
      prerequisites: ['prompt-basics'],
      xpReward: 150,
      category: 'beginner'
    },
    {
      id: 'context-crafting',
      title: 'Contexte Précis',
      description: 'Créez des contextes riches et pertinents pour vos prompts',
      level: 3,
      unlocked: true,
      completed: false,
      progress: 30,
      prerequisites: ['rctf-method'],
      xpReward: 200,
      category: 'intermediate'
    },
    {
      id: 'advanced-techniques',
      title: 'Techniques Avancées',
      description: 'Chain-of-thought, few-shot learning et autres techniques',
      level: 4,
      unlocked: false,
      completed: false,
      progress: 0,
      prerequisites: ['context-crafting'],
      xpReward: 250,
      category: 'intermediate'
    },
    {
      id: 'role-optimization',
      title: 'Optimisation de Rôle',
      description: 'Définissez des rôles précis et efficaces',
      level: 2,
      unlocked: true,
      completed: false,
      progress: 45,
      prerequisites: ['prompt-basics'],
      xpReward: 150,
      category: 'beginner'
    },
    {
      id: 'format-mastery',
      title: 'Maîtrise des Formats',
      description: 'Spécifiez et utilisez différents formats de sortie',
      level: 3,
      unlocked: false,
      completed: false,
      progress: 0,
      prerequisites: ['role-optimization', 'rctf-method'],
      xpReward: 200,
      category: 'intermediate'
    },
    {
      id: 'prompt-engineering',
      title: 'Ingénierie de Prompt',
      description: 'Devenez un expert en conception de prompts complexes',
      level: 5,
      unlocked: false,
      completed: false,
      progress: 0,
      prerequisites: ['advanced-techniques', 'format-mastery'],
      xpReward: 300,
      category: 'advanced'
    },
    {
      id: 'ai-collaboration',
      title: 'Collaboration IA',
      description: 'Travaillez efficacement avec les modèles d\'IA',
      level: 6,
      unlocked: false,
      completed: false,
      progress: 0,
      prerequisites: ['prompt-engineering'],
      xpReward: 400,
      category: 'expert'
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'beginner': return 'from-green-500 to-emerald-500';
      case 'intermediate': return 'from-blue-500 to-cyan-500';
      case 'advanced': return 'from-purple-500 to-pink-500';
      case 'expert': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getNodeIcon = (node: SkillNode) => {
    if (node.completed) return <Check className="w-5 h-5" />;
    if (!node.unlocked) return <Lock className="w-5 h-5" />;
    return <Star className="w-5 h-5" />;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Arbre de Compétences</h1>
                <p className="text-gray-600">Progressez et débloquez de nouvelles compétences</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-green-500">
                  <Check className="w-5 h-5" />
                  <span className="text-2xl font-bold">1</span>
                </div>
                <p className="text-xs text-gray-500">Complétées</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-blue-500">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-2xl font-bold">3</span>
                </div>
                <p className="text-xs text-gray-500">En cours</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-purple-500">
                  <Zap className="w-5 h-5" />
                  <span className="text-2xl font-bold">850</span>
                </div>
                <p className="text-xs text-gray-500">XP Total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
              <span className="text-gray-600">Débutant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <span className="text-gray-600">Intermédiaire</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <span className="text-gray-600">Avancé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500"></div>
              <span className="text-gray-600">Expert</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Skill Tree Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Votre Parcours</h2>
                <p className="text-gray-600">Cliquez sur une compétence pour voir les détails</p>
              </div>

              {/* Skill Tree Grid */}
              <div className="space-y-8">
                {/* Level 1 */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    {skillNodes.filter(n => n.level === 1).map((node) => (
                      <motion.div
                        key={node.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative"
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        onClick={() => setSelectedNode(node)}
                      >
                        <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getCategoryColor(node.category)} p-0.5 cursor-pointer ${
                          !node.unlocked ? 'opacity-50' : ''
                        }`}>
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                            <div className="text-center">
                              {getNodeIcon(node)}
                              <p className="text-xs font-medium mt-1">{node.level}</p>
                            </div>
                          </div>
                        </div>
                        {node.progress > 0 && node.progress < 100 && (
                          <div className="absolute -bottom-2 left-0 right-0 mx-auto w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                              style={{ width: `${node.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Connection Lines */}
                <div className="flex justify-center">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-purple-300 to-purple-500"></div>
                </div>

                {/* Level 2 */}
                <div className="flex justify-center gap-16">
                  {skillNodes.filter(n => n.level === 2).map((node) => (
                    <motion.div
                      key={node.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative"
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getCategoryColor(node.category)} p-0.5 cursor-pointer ${
                        !node.unlocked ? 'opacity-50' : ''
                      }`}>
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                          <div className="text-center">
                            {getNodeIcon(node)}
                            <p className="text-xs font-medium mt-1">{node.level}</p>
                          </div>
                        </div>
                      </div>
                      {node.progress > 0 && node.progress < 100 && (
                        <div className="absolute -bottom-2 left-0 right-0 mx-auto w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                            style={{ width: `${node.progress}%` }}
                          ></div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Connection Lines */}
                <div className="flex justify-center gap-16">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-purple-300 to-purple-500"></div>
                  <div className="w-0.5 h-8 bg-gradient-to-b from-purple-300 to-purple-500"></div>
                </div>

                {/* Level 3 */}
                <div className="flex justify-center gap-16">
                  {skillNodes.filter(n => n.level === 3).map((node) => (
                    <motion.div
                      key={node.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative"
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getCategoryColor(node.category)} p-0.5 cursor-pointer ${
                        !node.unlocked ? 'opacity-50' : ''
                      }`}>
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                          <div className="text-center">
                            {getNodeIcon(node)}
                            <p className="text-xs font-medium mt-1">{node.level}</p>
                          </div>
                        </div>
                      </div>
                      {node.progress > 0 && node.progress < 100 && (
                        <div className="absolute -bottom-2 left-0 right-0 mx-auto w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                            style={{ width: `${node.progress}%` }}
                          ></div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Remaining levels... */}
                <div className="text-center py-4 text-gray-500 text-sm">
                  <Sparkles className="w-5 h-5 inline mr-2" />
                  Plus de compétences à débloquer...
                </div>
              </div>
            </div>
          </div>

          {/* Skill Details Panel */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key={selectedNode.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-lg p-6 sticky top-4"
                >
                  <div className="mb-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getCategoryColor(selectedNode.category)} p-0.5 mx-auto mb-3`}>
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        {getNodeIcon(selectedNode)}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-1">
                      {selectedNode.title}
                    </h3>
                    <p className="text-sm text-gray-600 text-center capitalize">
                      Niveau {selectedNode.level} • {selectedNode.category}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-700">{selectedNode.description}</p>
                    </div>

                    {selectedNode.unlocked && selectedNode.progress > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progression</span>
                          <span className="font-semibold text-purple-600">{selectedNode.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                            style={{ width: `${selectedNode.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-3 px-4 bg-purple-50 rounded-lg">
                      <span className="text-sm text-gray-700">Récompense XP</span>
                      <div className="flex items-center gap-1 text-purple-600 font-bold">
                        <Zap className="w-4 h-4" />
                        <span>+{selectedNode.xpReward}</span>
                      </div>
                    </div>

                    {selectedNode.prerequisites.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Prérequis:</p>
                        <div className="space-y-1">
                          {selectedNode.prerequisites.map((prereq) => {
                            const prereqNode = skillNodes.find(n => n.id === prereq);
                            return prereqNode ? (
                              <div key={prereq} className="flex items-center gap-2 text-sm">
                                {prereqNode.completed ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Lock className="w-4 h-4 text-gray-400" />
                                )}
                                <span className={prereqNode.completed ? 'text-gray-700' : 'text-gray-500'}>
                                  {prereqNode.title}
                                </span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    <div className="pt-4">
                      {selectedNode.unlocked && !selectedNode.completed && (
                        <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                          <BookOpen className="w-4 h-4 inline mr-2" />
                          Commencer l'entraînement
                        </button>
                      )}
                      {selectedNode.completed && (
                        <div className="text-center py-3 px-4 bg-green-50 rounded-lg">
                          <Check className="w-5 h-5 text-green-500 inline mr-2" />
                          <span className="text-green-700 font-semibold">Compétence maîtrisée !</span>
                        </div>
                      )}
                      {!selectedNode.unlocked && (
                        <div className="text-center py-3 px-4 bg-gray-50 rounded-lg">
                          <Lock className="w-5 h-5 text-gray-400 inline mr-2" />
                          <span className="text-gray-600">Complétez les prérequis pour débloquer</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6 sticky top-4"
                >
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Sélectionnez une compétence
                    </h3>
                    <p className="text-gray-600">
                      Cliquez sur un nœud dans l'arbre pour voir les détails
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
