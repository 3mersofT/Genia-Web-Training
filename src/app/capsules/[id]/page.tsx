'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ArrowLeft, ArrowRight, Play, CheckCircle, Clock, 
  BookOpen, Target, Lightbulb, Trophy, ChevronLeft, ChevronRight 
} from 'lucide-react';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import FeedbackStats from '@/components/feedback/FeedbackStats';
import { getCapsuleContent, getCapsuleById, getNextCapsule, getPreviousCapsule, getModuleBySlug } from '@/lib/data';

export default function CapsulePage() {
  const params = useParams();
  const router = useRouter();
  const capsuleId = params.id as string;
  const { user } = useAuth();
  const toast = useToast();
  
  const [activeSection, setActiveSection] = useState<'hook' | 'concept' | 'demo' | 'exercise' | 'recap'>('hook');
  const [exerciseAttempted, setExerciseAttempted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  
  const capsuleData = getCapsuleById(capsuleId);
  const capsuleContent = getCapsuleContent(capsuleId);
  const nextCapsule = getNextCapsule(capsuleId);
  const previousCapsule = getPreviousCapsule(capsuleId);
  
  if (!capsuleData || !capsuleContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Capsule non trouvée</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Obtenir le module pour la navigation
  const allModules = ['fondamentaux', 'techniques', 'pratique'];
  let currentModule = null;
  for (const moduleSlug of allModules) {
    const module = getModuleBySlug(moduleSlug);
    if (module?.capsules.find(cap => cap.id === capsuleId)) {
      currentModule = module;
      break;
    }
  }

  const sections = capsuleContent.sections || {};

  const sectionTitles = {
    hook: 'Accroche',
    concept: 'Concept',
    demo: 'Démonstration',
    exercise: 'Exercice',
    recap: 'Récapitulatif'
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'hook': return <Target className="w-4 h-4" />;
      case 'concept': return <BookOpen className="w-4 h-4" />;
      case 'demo': return <Play className="w-4 h-4" />;
      case 'exercise': return <Trophy className="w-4 h-4" />;
      case 'recap': return <CheckCircle className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const renderSectionContent = () => {
    const section = sections[activeSection];
    if (!section) return null;

    switch (activeSection) {
      case 'hook':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">🎯 Pourquoi cette capsule va vous être utile</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">{section.text}</p>
              {section.duration && (
                <div className="flex items-center gap-1 mt-4 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Durée : {section.duration} secondes</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'concept':
        return (
          <div className="space-y-6">
            <div className="prose max-w-none">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">📚 Concept clé</h3>
                </div>
                <div className="text-gray-700 leading-relaxed prose max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Personnaliser le rendu des éléments
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-800 mb-4" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-gray-800 mb-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-medium text-gray-800 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li className="ml-4" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-blue-700" {...props} />,
                      em: ({node, ...props}) => <em className="italic text-gray-600" {...props} />,
                      code: ({node, className, children, ...props}) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !match ? (
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        ) : (
                          <div className="bg-gray-50 rounded-lg overflow-hidden my-4">
                            <div className="overflow-x-auto">
                              <pre className="p-4 text-sm whitespace-pre-wrap break-words">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          </div>
                        );
                      },
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto mb-4">
                          <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                      th: ({node, ...props}) => <th className="px-4 py-2 text-left font-medium text-gray-700 border-b" {...props} />,
                      td: ({node, ...props}) => <td className="px-4 py-2 text-gray-600 border-b" {...props} />,
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
                </div>
                {section.code && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-md">
                    <pre className="text-sm">{section.code}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'demo':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-4">
                <Play className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">🎥 Démonstration pratique</h3>
              </div>
              
              {section.before && (
                <div className="mb-6">
                  <h4 className="font-medium text-red-700 mb-2">❌ Version vague (à éviter)</h4>
                  <div className="bg-red-50 p-4 rounded-md border border-red-200">
                    <pre className="text-sm text-red-800 whitespace-pre-wrap">{section.before}</pre>
                  </div>
                </div>
              )}
              
              {section.after && (
                <div className="mb-6">
                  <h4 className="font-medium text-green-700 mb-2">✅ Version professionnelle (objectif)</h4>
                  <div className="bg-green-50 p-4 rounded-md border border-green-200">
                    <pre className="text-sm text-green-800 whitespace-pre-wrap">{section.after}</pre>
                  </div>
                </div>
              )}
              
              {section.explanation && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">💡 Explication</h4>
                  <p className="text-gray-700">{section.explanation}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'exercise':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg border-l-4 border-amber-500">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900">🏆 À vous de jouer !</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Instructions :</h4>
                  <p className="text-gray-700">{section.instruction}</p>
                </div>
                
                {section.starter && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Prompt de départ :</h4>
                    <div className="bg-gray-100 p-3 rounded-md">
                      <code className="text-sm text-gray-800">{section.starter}</code>
                    </div>
                  </div>
                )}
                
                <div className="bg-white p-4 rounded-md border">
                  <textarea
                    className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tapez votre réponse ici..."
                    onChange={() => setExerciseAttempted(true)}
                  />
                </div>
                
                {!exerciseAttempted ? (
                  <button 
                    onClick={() => setExerciseAttempted(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Valider ma réponse
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-md border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">✅ Solution proposée :</h4>
                      <pre className="text-sm text-green-700 whitespace-pre-wrap">{section.solution}</pre>
                    </div>
                    
                    {section.hints && (
                      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-2">💡 Conseils :</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {section.hints.map((hint: string, index: number) => (
                            <li key={index}>• {hint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'recap':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">🎯 Points clés à retenir</h3>
              </div>
              
        {section.keyPoint && (
          <div className="flex items-start gap-3 text-gray-700">
            <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-lg leading-relaxed">{section.keyPoint}</p>
          </div>
        )}
              
              {section.nextSteps && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-800 mb-2">🚀 Prochaines étapes :</h4>
                  <p className="text-gray-700">{section.nextSteps}</p>
                </div>
              )}

              {/* Bouton marquer comme terminé */}
              {user && (
                <div className="mt-6">
                  <button
                    disabled={isCompleting}
                    onClick={async () => {
                      if (!user?.id) return;
                      try {
                        setIsCompleting(true);
                        const res = await fetch('/api/progress/complete', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: user.id, capsuleId })
                        });
                        if (res.ok) {
                          toast.showSuccess('Leçon marquée comme terminée ✅');
                          // Retour au module si connu, sinon dashboard
                          if (currentModule?.slug) {
                            router.push(`/modules/${currentModule.slug}`);
                          } else {
                            router.push('/dashboard');
                          }
                        } else {
                          toast.showError('Impossible de marquer la leçon comme terminée.');
                        }
                      } catch (_) {
                        toast.showError('Erreur réseau temporaire. Réessayez.');
                      } finally {
                        setIsCompleting(false);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Marquer la leçon comme terminée
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <p className="text-gray-600">Contenu en cours de chargement...</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={currentModule ? `/modules/${currentModule.slug}` : '/dashboard'}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex-1">
                <h1 className="font-bold text-gray-800">{capsuleData.title}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>Leçon {capsuleData.order}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{capsuleData.duration} min</span>
                  </div>
                  <span>•</span>
                  <span className="capitalize">{capsuleData.difficulty}</span>
                </div>
              </div>
              
              {/* Feedback section */}
              <div className="flex items-center gap-4">
                <FeedbackStats 
                  targetType="capsule" 
                  targetId={capsuleId} 
                  showDetails={false}
                />
                <FeedbackButton
                  targetType="capsule"
                  targetId={capsuleId}
                  targetTitle={capsuleData.title}
                  variant="button"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation des sections */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <h3 className="font-semibold text-gray-800 mb-4">Navigation</h3>
              <nav className="space-y-2">
                {Object.entries(sections).map(([key, section]) => (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === key 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {getSectionIcon(key)}
                    <span className="text-sm">{sectionTitles[key as keyof typeof sectionTitles]}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-8">
              {renderSectionContent()}
            </div>

            {/* Navigation entre capsules */}
            <div className="flex justify-between items-center mt-8">
              <div>
                {previousCapsule ? (
                  <Link 
                    href={`/capsules/${previousCapsule.id}`}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <div className="text-left">
                      <div className="text-xs text-gray-500">Précédent</div>
                      <div className="text-sm font-medium">{previousCapsule.title}</div>
                    </div>
                  </Link>
                ) : (
                  <div></div>
                )}
              </div>

              <div>
                {nextCapsule ? (
                  <Link 
                    href={`/capsules/${nextCapsule.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <div className="text-right">
                      <div className="text-xs text-blue-100">Suivant</div>
                      <div className="text-sm font-medium">{nextCapsule.title}</div>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link 
                    href="/dashboard"
                    className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                  >
                    🎉 Formation terminée !
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
