'use client';

import { WifiOff, RefreshCw, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Recharger après 1 seconde si en ligne
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    };

    const handleOffline = () => setIsOnline(false);

    // Vérifier le statut initial
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
      // Forcer une vérification
      window.location.reload();
    }
  };

  if (isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Connexion rétablie, redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icône principale */}
        <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-gray-400" />
        </div>

        {/* Titre et description */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Vous êtes hors ligne
        </h1>
        <p className="text-gray-600 mb-8">
          GENIA Training nécessite une connexion Internet pour fonctionner. 
          Vérifiez votre connexion et réessayez.
        </p>

        {/* Bouton de retry */}
        <button
          onClick={handleRetry}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 mb-6"
        >
          <RefreshCw className="w-5 h-5" />
          Réessayer
        </button>

        {/* Contenu disponible hors ligne */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Contenu disponible hors ligne
          </h2>
          
          <div className="space-y-3 text-left">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-1">
                💡 Astuce du jour
              </h3>
              <p className="text-sm text-blue-700">
                Un bon prompt contient toujours : Rôle, Contexte, Tâche et Format (RCTF)
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-1">
                📚 Rappel GENIA
              </h3>
              <p className="text-sm text-purple-700">
                G - Guide progressif<br />
                E - Exemples concrets<br />
                N - Niveau adaptatif<br />
                I - Interaction pratique<br />
                A - Assessment continu
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-1">
                🎯 Exercice mental
              </h3>
              <p className="text-sm text-green-700">
                Réfléchissez à 3 façons d'améliorer ce prompt : 
                "Écris-moi un article"
              </p>
            </div>
          </div>
        </div>

        {/* Message d'encouragement */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-500">
            💪 Profitez de ce moment pour réfléchir à vos prochains prompts !
          </p>
        </div>

        {/* Indicateur de statut */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">Hors ligne</span>
        </div>
      </div>
    </div>
  );
}
