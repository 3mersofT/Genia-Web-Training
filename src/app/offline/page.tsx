'use client';

import { WifiOff, RefreshCw, BookOpen, Clock, Trash2, HardDrive } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOffline } from '@/hooks/useOffline';
import type { CachedCapsule } from '@/lib/services/offlineService';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const { cachedCapsules, cacheInfo, removeCapsule, clearAll, formatSize, isLoading } = useOffline();
  const [selectedCapsule, setSelectedCapsule] = useState<CachedCapsule | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    };

    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.href = '/dashboard';
    } else {
      window.location.reload();
    }
  };

  if (isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] flex items-center justify-center p-4">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Connexion rétablie, redirection...</p>
        </div>
      </div>
    );
  }

  // Vue détaillée d'une capsule en cache
  if (selectedCapsule) {
    const sections = selectedCapsule.content?.sections || {};
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card shadow-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedCapsule(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <WifiOff className="w-4 h-4" />
                Retour (hors ligne)
              </button>
              <div className="flex items-center gap-2 text-xs text-orange-600">
                <HardDrive className="w-3 h-3" />
                Mode hors ligne
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {selectedCapsule.capsule.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
            <span>{selectedCapsule.moduleTitle}</span>
            <span>-</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{selectedCapsule.capsule.duration} min</span>
            </div>
          </div>

          <div className="space-y-6">
            {sections.hook && (
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-blue-900 mb-3">Accroche</h3>
                <p className="text-foreground">{sections.hook.text}</p>
              </div>
            )}
            {sections.concept?.content && (
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-purple-900 mb-3">Concept</h3>
                <div className="text-foreground whitespace-pre-wrap">{sections.concept.content}</div>
              </div>
            )}
            {sections.demo && (
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-green-900 mb-3">Démonstration</h3>
                {sections.demo.before && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Version vague</h4>
                    <pre className="bg-red-50 dark:bg-red-950/30 p-3 rounded text-sm whitespace-pre-wrap">{sections.demo.before}</pre>
                  </div>
                )}
                {sections.demo.after && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Version optimisée</h4>
                    <pre className="bg-green-50 dark:bg-green-950/30 p-3 rounded text-sm whitespace-pre-wrap">{sections.demo.after}</pre>
                  </div>
                )}
                {sections.demo.explanation && (
                  <p className="text-foreground">{sections.demo.explanation}</p>
                )}
              </div>
            )}
            {sections.exercise && (
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-amber-900 mb-3">Exercice</h3>
                <p className="text-foreground">{sections.exercise.instruction}</p>
              </div>
            )}
            {sections.recap && (
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-purple-900 mb-3">Récapitulatif</h3>
                {sections.recap.keyPoint && (
                  <p className="text-foreground">{sections.recap.keyPoint}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-card rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-6 flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Vous êtes hors ligne
          </h1>
          <p className="text-muted-foreground mb-6">
            Vérifiez votre connexion. En attendant, consultez vos capsules sauvegardées.
          </p>
          <button
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 mb-6"
          >
            <RefreshCw className="w-5 h-5" />
            Réessayer
          </button>
        </div>

        {/* Capsules en cache */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Capsules disponibles hors ligne
            </h2>
            {cacheInfo.totalCapsules > 0 && (
              <span className="text-xs text-muted-foreground">
                {cacheInfo.totalCapsules} capsule{cacheInfo.totalCapsules > 1 ? 's' : ''} - {formatSize(cacheInfo.totalSize)}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Chargement du cache...</p>
            </div>
          ) : cachedCapsules.length > 0 ? (
            <div className="space-y-2">
              {cachedCapsules.map((cached) => (
                <div
                  key={cached.capsule.id}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <button
                    onClick={() => setSelectedCapsule(cached)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {cached.capsule.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cached.moduleTitle} - {cached.capsule.duration} min
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => removeCapsule(cached.capsule.id)}
                    className="p-1.5 text-muted-foreground hover:text-red-500 dark:text-red-400 transition-colors flex-shrink-0"
                    title="Retirer du cache"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {cachedCapsules.length > 1 && (
                <button
                  onClick={clearAll}
                  className="w-full mt-3 text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:text-red-300 py-2"
                >
                  Vider tout le cache
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <HardDrive className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Aucune capsule sauvegardée.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sauvegardez des capsules depuis leur page pour y accéder hors ligne.
              </p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="border-t pt-6 mt-6 space-y-3 text-left">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-1">
              Astuce du jour
            </h3>
            <p className="text-sm text-blue-700">
              Un bon prompt contient toujours : Rôle, Contexte, Tâche et Format (RCTF)
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
            <h3 className="font-medium text-green-900 mb-1">
              Exercice mental
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Réfléchissez à 3 façons d'améliorer ce prompt :
              "Écris-moi un article"
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-muted-foreground">Hors ligne</span>
        </div>
      </div>
    </div>
  );
}
