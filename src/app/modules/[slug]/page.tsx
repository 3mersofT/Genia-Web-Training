'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Play, Lock, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getModuleBySlug, getAllModulesWithProgress, Module, Capsule } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import FeedbackStats from '@/components/feedback/FeedbackStats';
import CertificateButton from '@/components/certificates/CertificateButton';

export default function ModulePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const t = useTranslations('modules');
  const tc = useTranslations('capsule');
  const [moduleData, setModuleData] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModule = async () => {
      if (!user) {
        const module = await getModuleBySlug(slug);
        setModuleData(module);
        setLoading(false);
        return;
      }

      try {
        const modules = await getAllModulesWithProgress(user.id);
        const module = modules.find(m => m.slug === slug);
        setModuleData(module || null);
      } catch (error) {
        console.error('Erreur chargement module:', error);
        const module = await getModuleBySlug(slug);
        setModuleData(module);
      } finally {
        setLoading(false);
      }
    };

    loadModule();
  }, [slug, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{t('notFound')}</h1>
          <Link href="/dashboard" className="text-primary hover:underline">
            ← {t('backToDashboard')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-bold text-foreground">{moduleData.title}</h1>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* En-tête du module */}
        <div className="bg-card rounded-xl shadow-sm p-6 mb-8">
          <div className={`w-full h-32 bg-gradient-to-r ${moduleData.color} rounded-lg mb-6 flex items-center justify-center`}>
            <BookOpen className="w-12 h-12 text-white" />
          </div>
          
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-2">{moduleData.title}</h2>
              <p className="text-muted-foreground">{moduleData.description}</p>
            </div>
            
            {/* Feedback section */}
            <div className="flex items-center gap-4 ml-6">
              <FeedbackStats 
                targetType="module" 
                targetId={moduleData.slug} 
                showDetails={false}
              />
              <FeedbackButton
                targetType="module"
                targetId={moduleData.slug}
                targetTitle={moduleData.title}
                variant="button"
                size="sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${moduleData.color} h-2 rounded-full`}
                style={{ width: `${moduleData.progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {moduleData.progress}% {t('completed')}
            </span>
          </div>

          {/* Certificate section - only shown when module is completed */}
          {moduleData.progress === 100 && user && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t('moduleCompleted')}</h3>
                    <p className="text-sm text-muted-foreground">{t('moduleCompletedDesc')}</p>
                  </div>
                </div>
                <CertificateButton
                  moduleId={moduleData.slug}
                  moduleTitle={moduleData.title}
                  certificateType="module"
                  variant="button"
                  size="md"
                />
              </div>
            </div>
          )}
        </div>

        {/* Liste des leçons */}
        <div className="bg-card rounded-xl shadow-sm">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">{t('modulePlan')}</h3>
          </div>
          
          <div className="divide-y divide-border">
            {moduleData.capsules.map((capsule: Capsule, index: number) => (
              <div key={capsule.id} className="p-6 hover:bg-accent transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {capsule.completed ? (
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center">
                        {capsule.available ? (
                          <Play className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">
                      {t('lesson')} {capsule.order}: {capsule.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{capsule.duration} min</span>
                      </div>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {capsule.difficulty}
                      </span>
                    </div>
                    {capsule.keyTakeaway && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        💡 {capsule.keyTakeaway}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    {capsule.completed ? (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 text-sm rounded-full">
                        {tc('completed')}
                      </span>
                    ) : capsule.available ? (
                      <Link
                        href={`/capsules/${capsule.id}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {tc('start')}
                      </Link>
                    ) : (
                      <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                        {tc('locked')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
