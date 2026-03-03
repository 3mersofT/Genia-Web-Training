'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAppToast as useToast } from '@/hooks/useAppToast';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {
  ArrowLeft, ArrowRight, Play, CheckCircle, Clock,
  BookOpen, Target, Lightbulb, Trophy, ChevronLeft, ChevronRight
} from 'lucide-react';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import FeedbackStats from '@/components/feedback/FeedbackStats';
import RichContentRenderer from '@/components/capsule/RichContentRenderer';
import CodeBlock from '@/components/capsule/CodeBlock';
import OfflineToggle from '@/components/pwa/OfflineToggle';
import { getCapsuleContent, getCapsuleById, getNextCapsule, getPreviousCapsule, getModuleBySlug, type Capsule, type Module } from '@/lib/data';
import { logger } from '@/lib/logger';

export default function CapsulePage() {
  const params = useParams();
  const router = useRouter();
  const capsuleId = params.id as string;
  const { user } = useAuth();
  const toast = useToast();

  const [activeSection, setActiveSection] = useState<'hook' | 'concept' | 'demo' | 'exercise' | 'recap'>('hook');
  const [exerciseAttempted, setExerciseAttempted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [capsuleData, setCapsuleData] = useState<Capsule | null>(null);
  const [capsuleContent, setCapsuleContent] = useState<any | null>(null);
  const [nextCapsule, setNextCapsule] = useState<Capsule | null>(null);
  const [previousCapsule, setPreviousCapsule] = useState<Capsule | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCapsuleData() {
      try {
        const [data, content, next, prev] = await Promise.all([
          getCapsuleById(capsuleId),
          getCapsuleContent(capsuleId),
          getNextCapsule(capsuleId),
          getPreviousCapsule(capsuleId)
        ]);

        setCapsuleData(data);
        setCapsuleContent(content);
        setNextCapsule(next);
        setPreviousCapsule(prev);

        // Find current module
        const allModules = ['fondamentaux', 'techniques', 'pratique'];
        for (const moduleSlug of allModules) {
          const module = await getModuleBySlug(moduleSlug);
          if (module?.capsules.find(cap => cap.id === capsuleId)) {
            setCurrentModule(module);
            break;
          }
        }
      } catch (error) {
        console.error('Error loading capsule data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCapsuleData();
  }, [capsuleId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!capsuleData || !capsuleContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Capsule non trouvée</h1>
          <Link href="/dashboard" className="text-primary hover:underline">
            ← Retour au dashboard
          </Link>
        </div>
      </div>
    );
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
            <div className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] p-6 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-200">🎯 Pourquoi cette capsule va vous être utile</h3>
              </div>
              <p className="text-foreground leading-relaxed">{section.text}</p>
              {section.duration && (
                <div className="flex items-center gap-1 mt-4 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Durée : {section.duration} secondes</span>
                </div>
              )}

              {/* Render multimedia content if present */}
              {section.multimedia && section.multimedia.length > 0 && (
                <div className="mt-6">
                  <RichContentRenderer blocks={section.multimedia} />
                </div>
              )}
            </div>
          </div>
        );

      case 'concept':
        return (
          <div className="space-y-6">
            <div className="prose max-w-none">
              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-200">📚 Concept clé</h3>
                </div>

                {/* Render markdown content if present */}
                {section.content && (
                  <div className="text-foreground leading-relaxed prose max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                      components={{
                        // Personnaliser le rendu des éléments
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-foreground mb-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-foreground mb-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-medium text-foreground mb-2" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                        li: ({node, ...props}) => <li className="ml-4" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-blue-700 dark:text-blue-300" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-muted-foreground" {...props} />,
                        code: ({node, className, children, ...props}) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : undefined;

                          // Inline code (no language specified)
                          if (!match) {
                            return (
                              <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props}>
                                {children}
                              </code>
                            );
                          }

                          // Code block with syntax highlighting
                          const codeString = String(children).replace(/\n$/, '');
                          return (
                            <CodeBlock
                              code={codeString}
                              language={language}
                              showLineNumbers={true}
                              className="my-4"
                            />
                          );
                        },
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto mb-4">
                            <table className="min-w-full divide-y divide-border border border-input rounded-lg" {...props} />
                          </div>
                        ),
                        thead: ({node, ...props}) => <thead className="bg-muted" {...props} />,
                        th: ({node, ...props}) => <th className="px-4 py-2 text-left font-medium text-foreground border-b" {...props} />,
                        td: ({node, ...props}) => <td className="px-4 py-2 text-muted-foreground border-b" {...props} />,
                      }}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </div>
                )}

                {section.code && (
                  <div className="mt-4 bg-muted p-4 rounded-md">
                    <pre className="text-sm">{section.code}</pre>
                  </div>
                )}

                {/* Render multimedia content if present */}
                {section.multimedia && section.multimedia.length > 0 && (
                  <div className="mt-6">
                    <RichContentRenderer blocks={section.multimedia} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'demo':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 dark:from-green-950/30 to-emerald-50 dark:to-emerald-950/30 p-6 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-4">
                <Play className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900 dark:text-green-200">🎥 Démonstration pratique</h3>
              </div>

              {section.before && (
                <div className="mb-6">
                  <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">❌ Version vague (à éviter)</h4>
                  <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-md border border-red-200 dark:border-red-800">
                    <pre className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">{section.before}</pre>
                  </div>
                </div>
              )}

              {section.after && (
                <div className="mb-6">
                  <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">✅ Version professionnelle (objectif)</h4>
                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-md border border-green-200 dark:border-green-800">
                    <pre className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">{section.after}</pre>
                  </div>
                </div>
              )}

              {section.explanation && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">💡 Explication</h4>
                  <p className="text-foreground">{section.explanation}</p>
                </div>
              )}

              {/* Render multimedia content if present */}
              {section.multimedia && section.multimedia.length > 0 && (
                <div className="mt-6">
                  <RichContentRenderer blocks={section.multimedia} />
                </div>
              )}
            </div>
          </div>
        );

      case 'exercise':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 dark:from-amber-950/30 to-orange-50 dark:to-orange-950/30 p-6 rounded-lg border-l-4 border-amber-500">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900 dark:text-amber-200">🏆 À vous de jouer !</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Instructions :</h4>
                  <p className="text-foreground">{section.instruction}</p>
                </div>
                
                {section.starter && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Prompt de départ :</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-sm text-foreground">{section.starter}</code>
                    </div>
                  </div>
                )}
                
                <div className="bg-card p-4 rounded-md border">
                  <textarea
                    className="w-full h-32 p-3 border border-input rounded-md resize-none focus:ring-2 focus-visible:ring-ring focus:border-transparent"
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
                    <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-md border border-green-200 dark:border-green-800">
                      <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">✅ Solution proposée :</h4>
                      <pre className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">{section.solution}</pre>
                    </div>
                    
                    {section.hints && (
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">💡 Conseils :</h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          {section.hints.map((hint: string, index: number) => (
                            <li key={index}>• {hint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Render multimedia content if present */}
              {section.multimedia && section.multimedia.length > 0 && (
                <div className="mt-6">
                  <RichContentRenderer blocks={section.multimedia} />
                </div>
              )}
            </div>
          </div>
        );

      case 'recap':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 dark:from-purple-950/30 to-violet-50 dark:to-violet-950/30 p-6 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-200">🎯 Points clés à retenir</h3>
              </div>
              
        {section.keyPoint && (
          <div className="flex items-start gap-3 text-foreground">
            <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-lg leading-relaxed">{section.keyPoint}</p>
          </div>
        )}
              
              {section.nextSteps && (
                <div className="mt-6">
                  <h4 className="font-medium text-foreground mb-2">🚀 Prochaines étapes :</h4>
                  <p className="text-foreground">{section.nextSteps}</p>
                </div>
              )}

              {/* Render multimedia content if present */}
              {section.multimedia && section.multimedia.length > 0 && (
                <div className="mt-6">
                  <RichContentRenderer blocks={section.multimedia} />
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
                          // Créer une carte de révision espacée
                          fetch('/api/review', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'create', capsuleId })
                          }).catch(() => { /* non bloquant */ });

                          toast.showSuccess('Leçon marquée comme terminée ✅');
                          if (currentModule?.slug) {
                            router.push(`/modules/${currentModule.slug}`);
                          } else {
                            router.push('/dashboard');
                          }
                        } else {
                          toast.showError('Impossible de marquer la leçon comme terminée.');
                        }
                      } catch (error) {
                        logger.error('Failed to complete capsule', {
                          component: 'CapsulePage',
                          action: 'markComplete',
                          userId: user?.id,
                          capsuleId,
                          error: error instanceof Error ? error.message : String(error)
                        });
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
        return <p className="text-muted-foreground">Contenu en cours de chargement...</p>;
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-card shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={currentModule ? `/modules/${currentModule.slug}` : '/dashboard'}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex-1">
                <h1 className="font-bold text-foreground">{capsuleData.title}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
              
              {/* Feedback & Offline section */}
              <div className="flex items-center gap-4">
                <OfflineToggle
                  capsule={capsuleData}
                  content={capsuleContent}
                  moduleTitle={currentModule?.title || ''}
                  variant="icon"
                />
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
            <div className="bg-card rounded-lg shadow-sm p-4 sticky top-24">
              <h3 className="font-semibold text-foreground mb-4">Navigation</h3>
              <nav className="space-y-2">
                {Object.entries(sections).map(([key, section]) => (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === key 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        : 'text-muted-foreground hover:bg-accent'
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
            <div className="bg-card rounded-lg shadow-sm p-8">
              {renderSectionContent()}
            </div>

            {/* Navigation entre capsules */}
            <div className="flex justify-between items-center mt-8">
              <div>
                {previousCapsule ? (
                  <Link 
                    href={`/capsules/${previousCapsule.id}`}
                    className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">Précédent</div>
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
