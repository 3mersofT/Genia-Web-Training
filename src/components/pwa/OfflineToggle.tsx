'use client';

import { useState } from 'react';
import { Download, Trash2, Loader2, WifiOff, Check, HardDrive } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import type { Capsule } from '@/lib/data';

interface OfflineToggleProps {
  capsule: Capsule;
  content: Record<string, any>;
  moduleTitle: string;
  variant?: 'button' | 'icon' | 'compact';
}

export default function OfflineToggle({
  capsule,
  content,
  moduleTitle,
  variant = 'button'
}: OfflineToggleProps) {
  const { isCapsuleCached, cacheCapsule, removeCapsule, isCaching } = useOffline();
  const [isProcessing, setIsProcessing] = useState(false);
  const cached = isCapsuleCached(capsule.id);

  const handleToggle = async () => {
    setIsProcessing(true);
    try {
      if (cached) {
        await removeCapsule(capsule.id);
      } else {
        await cacheCapsule(capsule, content, moduleTitle);
      }
    } catch (error) {
      console.error('Erreur toggle offline:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const loading = isProcessing || isCaching;

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`p-2 rounded-lg transition-colors ${
          cached
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={cached ? 'Retirer du mode hors ligne' : 'Rendre disponible hors ligne'}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : cached ? (
          <Check className="w-4 h-4" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          cached
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : cached ? (
          <>
            <WifiOff className="w-3 h-3" />
            Hors ligne
          </>
        ) : (
          <>
            <Download className="w-3 h-3" />
            Sauvegarder
          </>
        )}
      </button>
    );
  }

  // variant === 'button' (défaut)
  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        cached
          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
          : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {cached ? 'Suppression...' : 'Téléchargement...'}
        </>
      ) : cached ? (
        <>
          <Trash2 className="w-4 h-4" />
          Retirer du hors ligne
        </>
      ) : (
        <>
          <HardDrive className="w-4 h-4" />
          Disponible hors ligne
        </>
      )}
    </button>
  );
}
