'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Play, Lock, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { getModuleBySlug, getAllModulesWithProgress, Module, Capsule } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import FeedbackButton from '@/components/feedback/FeedbackButton';
import FeedbackStats from '@/components/feedback/FeedbackStats';
import CertificateButton from '@/components/certificates/CertificateButton';

export default function ModulePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const [moduleData, setModuleData] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModule = async () => {
      if (!user) {
        setModuleData(getModuleBySlug(slug));
        setLoading(false);
        return;
      }

      try {
        const modules = await getAllModulesWithProgress(user.id);
        const module = modules.find(m => m.slug === slug);
        setModuleData(module || null);
      } catch (error) {
        console.error('Erreur chargement module:', error);
        setModuleData(getModuleBySlug(slug));
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
          <p className="text-gray-600">Chargement du module...</p>
        </div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Module non trouvé</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-bold text-gray-800">{moduleData.title}</h1>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* En-tête du module */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className={`w-full h-32 bg-gradient-to-r ${moduleData.color} rounded-lg mb-6 flex items-center justify-center`}>
            <BookOpen className="w-12 h-12 text-white" />
          </div>
          
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{moduleData.title}</h2>
              <p className="text-gray-600">{moduleData.description}</p>
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
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${moduleData.color} h-2 rounded-full`}
                style={{ width: `${moduleData.progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">
              {moduleData.progress}% complété
            </span>
          </div>

          {/* Certificate section - only shown when module is completed */}
          {moduleData.progress === 100 && user && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Module terminé !</h3>
                    <p className="text-sm text-gray-600">Félicitations, vous pouvez maintenant obtenir votre certificat.</p>
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
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Plan du module</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {moduleData.capsules.map((capsule: Capsule, index: number) => (
              <div key={capsule.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {capsule.completed ? (
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
                        {capsule.available ? (
                          <Play className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 mb-1">
                      Leçon {capsule.order}: {capsule.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{capsule.duration} min</span>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {capsule.difficulty}
                      </span>
                    </div>
                    {capsule.keyTakeaway && (
                      <p className="text-sm text-gray-600 mt-1 italic">
                        💡 {capsule.keyTakeaway}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    {capsule.completed ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        Terminé
                      </span>
                    ) : capsule.available ? (
                      <Link 
                        href={`/capsules/${capsule.id}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Commencer
                      </Link>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm rounded-full">
                        Verrouillé
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
