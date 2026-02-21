'use client';

import React, { useState } from 'react';
import { 
  Eye, EyeOff, Monitor, Tablet, Smartphone, 
  Play, Pause, SkipBack, SkipForward,
  User, BookOpen, Clock, Award
} from 'lucide-react';

interface ContentPreviewProps {
  module: any;
  capsule?: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContentPreview({ module, capsule, isOpen, onClose }: ContentPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [currentSection, setCurrentSection] = useState('hook');

  if (!isOpen) return null;

  const previewContent = capsule || module;

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'desktop': return 'w-full max-w-6xl';
      case 'tablet': return 'w-full max-w-2xl';
      case 'mobile': return 'w-full max-w-sm';
      default: return 'w-full max-w-6xl';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full h-[90vh] flex flex-col">
        
        {/* Header de prévisualisation */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">
              📱 Preview : {previewContent.title}
            </h3>
            
            {/* Contrôles de taille d'écran */}
            <div className="flex gap-2 bg-white rounded-lg p-1 border">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('tablet')}
                className={`p-2 rounded ${previewMode === 'tablet' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <EyeOff className="w-5 h-5" />
          </button>
        </div>

        {/* Zone de prévisualisation */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
          <div className={`${getPreviewWidth()} h-full bg-white rounded-lg shadow-lg flex flex-col transition-all duration-300`}>
            
            {/* Header étudiant simulé */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 bg-white bg-opacity-20 rounded-full p-1.5" />
                  <div>
                    <h2 className="text-lg font-semibold">Marie Dupont</h2>
                    <p className="text-sm opacity-90">Niveau Intermédiaire</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">1,245</div>
                  <div className="text-sm opacity-90">points</div>
                </div>
              </div>
            </div>

            {/* Navigation capsule/module */}
            {capsule ? (
              <div className="bg-blue-50 p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{capsule.title}</h3>
                      <p className="text-sm text-gray-600">Module {module.order_index} • Capsule {capsule.order_index}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {capsule.duration_minutes} min
                  </div>
                </div>
                
                {/* Barre de progression simulée */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progression</span>
                    <span>65%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-2/3"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{module.title}</h3>
                    <p className="text-sm text-gray-600">{module.description}</p>
                  </div>
                  <div className="text-2xl">{module.icon}</div>
                </div>
              </div>
            )}

            {/* Contenu principal */}
            <div className="flex-1 p-6 overflow-y-auto">
              {capsule ? (
                <>
                  {/* Navigation sections capsule */}
                  <div className="flex gap-2 mb-6">
                    {['hook', 'concept', 'demo', 'exercise', 'recap'].map((section) => (
                      <button
                        key={section}
                        onClick={() => setCurrentSection(section)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                          currentSection === section
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {section === 'hook' && '🎯 Hook'}
                        {section === 'concept' && '💡 Concept'}
                        {section === 'demo' && '🎬 Démo'}
                        {section === 'exercise' && '✏️ Exercice'}
                        {section === 'recap' && '📋 Récap'}
                      </button>
                    ))}
                  </div>

                  {/* Contenu de la section */}
                  <div className="prose max-w-none">
                    {currentSection === 'hook' && (
                      <div className="bg-yellow-50 p-6 rounded-lg">
                        <h3 className="text-xl font-semibold mb-3 text-yellow-800">🎯 Accroche</h3>
                        <p className="text-gray-700">
                          Imaginez pouvoir créer des prompts qui génèrent exactement ce que vous voulez, 
                          à chaque fois. Dans cette capsule, vous allez découvrir les secrets des experts...
                        </p>
                      </div>
                    )}
                    
                    {currentSection === 'concept' && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900">💡 Concept Clé</h3>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2">Principe RCTF</h4>
                          <ul className="list-disc list-inside text-gray-700 space-y-1">
                            <li><strong>Rôle</strong> : Définir le persona de l'IA</li>
                            <li><strong>Contexte</strong> : Donner les informations nécessaires</li>
                            <li><strong>Tâche</strong> : Préciser l'action attendue</li>
                            <li><strong>Format</strong> : Spécifier la structure de sortie</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {currentSection === 'demo' && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900">🎬 Démonstration</h3>
                        <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm">
                          <div className="mb-2">
                            <span className="text-blue-400">Prompt :</span>
                          </div>
                          <div className="ml-4 text-white">
                            Rôle : Tu es un expert marketing digital<br/>
                            Contexte : Pour une startup SaaS de gestion de projet<br/>
                            Tâche : Créer 5 titres d'articles de blog<br/>
                            Format : Liste numérotée, max 60 caractères
                          </div>
                        </div>
                      </div>
                    )}

                    {currentSection === 'exercise' && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900">✏️ À Votre Tour !</h3>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-purple-800 mb-3">
                            Créez un prompt RCTF pour générer une description de produit e-commerce
                          </p>
                          <textarea
                            className="w-full h-32 p-3 border rounded-lg resize-none"
                            placeholder="Écrivez votre prompt ici..."
                          />
                          <div className="mt-3 flex gap-2">
                            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                              Tester le prompt
                            </button>
                            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                              Indice
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentSection === 'recap' && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900">📋 Points Clés</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-2">✅ Acquis</h4>
                            <ul className="text-sm text-green-700 space-y-1">
                              <li>• Structure RCTF maîtrisée</li>
                              <li>• Exemples pratiques testés</li>
                              <li>• Exercice complété</li>
                            </ul>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">🎯 Next Steps</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li>• Capsule suivante : Personas</li>
                              <li>• Challenge bonus disponible</li>
                              <li>• Quiz de validation</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Vue module */
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-6xl mb-4">{module.icon}</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{module.title}</h2>
                    <p className="text-gray-600">{module.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {module.capsules?.slice(0, 6).map((cap: any, index: number) => (
                      <div key={cap.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-blue-600 font-semibold">Capsule {index + 1}</span>
                          <Clock className="w-4 h-4 text-gray-400" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{cap.title}</h4>
                        <p className="text-sm text-gray-600">{cap.duration_minutes} min</p>
                        <div className="mt-2 bg-gray-200 rounded-full h-1">
                          <div className={`bg-green-500 h-1 rounded-full w-${Math.random() > 0.5 ? 'full' : '2/3'}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer avec actions */}
            <div className="border-t p-4 bg-gray-50 rounded-b-lg">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <Play className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                    Marquer comme lu
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Terminer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
