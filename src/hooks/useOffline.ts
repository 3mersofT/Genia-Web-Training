import { useState, useEffect, useCallback } from 'react';
import {
  offlineCapsuleService,
  type CachedCapsule,
  type CacheInfo
} from '@/lib/services/offlineService';
import type { Capsule } from '@/lib/data';

interface UseOfflineReturn {
  isOffline: boolean;
  cachedCapsules: CachedCapsule[];
  cacheInfo: CacheInfo;
  isLoading: boolean;
  isCaching: boolean;
  cacheCapsule: (capsule: Capsule, content: Record<string, any>, moduleTitle: string) => Promise<boolean>;
  removeCapsule: (capsuleId: string) => Promise<boolean>;
  isCapsuleCached: (capsuleId: string) => boolean;
  getCachedContent: (capsuleId: string) => Promise<CachedCapsule | null>;
  clearAll: () => Promise<boolean>;
  refreshCache: () => Promise<void>;
  cacheModule: (
    moduleId: string,
    capsules: Array<{ capsule: Capsule; content: Record<string, any> }>,
    moduleTitle: string
  ) => Promise<{ cached: number; failed: number }>;
  formatSize: (bytes: number) => string;
}

export function useOffline(): UseOfflineReturn {
  const [isOffline, setIsOffline] = useState(false);
  const [cachedCapsules, setCachedCapsules] = useState<CachedCapsule[]>([]);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({
    totalCapsules: 0,
    totalSize: 0,
    oldestEntry: null,
    newestEntry: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCaching, setIsCaching] = useState(false);

  // Détection online/offline
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Chargement initial du cache
  const refreshCache = useCallback(async () => {
    setIsLoading(true);
    try {
      // Nettoyer les entrées expirées d'abord
      await offlineCapsuleService.cleanExpiredCache();

      const [capsules, info] = await Promise.all([
        offlineCapsuleService.listCachedCapsules(),
        offlineCapsuleService.getCacheInfo()
      ]);

      setCachedCapsules(capsules);
      setCacheInfo(info);
    } catch (error) {
      console.error('Erreur chargement cache:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCache();
  }, [refreshCache]);

  // Mettre en cache une capsule
  const cacheCapsule = useCallback(async (
    capsule: Capsule,
    content: Record<string, any>,
    moduleTitle: string
  ): Promise<boolean> => {
    setIsCaching(true);
    try {
      const success = await offlineCapsuleService.cacheCapsule(capsule, content, moduleTitle);
      if (success) {
        await refreshCache();
      }
      return success;
    } finally {
      setIsCaching(false);
    }
  }, [refreshCache]);

  // Supprimer une capsule du cache
  const removeCapsule = useCallback(async (capsuleId: string): Promise<boolean> => {
    const success = await offlineCapsuleService.removeCachedCapsule(capsuleId);
    if (success) {
      await refreshCache();
    }
    return success;
  }, [refreshCache]);

  // Vérifier si une capsule est en cache (synchrone via la liste locale)
  const isCapsuleCached = useCallback((capsuleId: string): boolean => {
    return cachedCapsules.some(c => c.capsule.id === capsuleId);
  }, [cachedCapsules]);

  // Récupérer le contenu en cache
  const getCachedContent = useCallback(async (capsuleId: string): Promise<CachedCapsule | null> => {
    return offlineCapsuleService.getCachedCapsule(capsuleId);
  }, []);

  // Vider tout le cache
  const clearAll = useCallback(async (): Promise<boolean> => {
    const success = await offlineCapsuleService.clearAllCache();
    if (success) {
      setCachedCapsules([]);
      setCacheInfo({ totalCapsules: 0, totalSize: 0, oldestEntry: null, newestEntry: null });
    }
    return success;
  }, []);

  // Mettre en cache un module entier
  const cacheModule = useCallback(async (
    moduleId: string,
    capsules: Array<{ capsule: Capsule; content: Record<string, any> }>,
    moduleTitle: string
  ): Promise<{ cached: number; failed: number }> => {
    setIsCaching(true);
    try {
      const result = await offlineCapsuleService.cacheModule(moduleId, capsules, moduleTitle);
      await refreshCache();
      return result;
    } finally {
      setIsCaching(false);
    }
  }, [refreshCache]);

  return {
    isOffline,
    cachedCapsules,
    cacheInfo,
    isLoading,
    isCaching,
    cacheCapsule,
    removeCapsule,
    isCapsuleCached,
    getCachedContent,
    clearAll,
    refreshCache,
    cacheModule,
    formatSize: offlineCapsuleService.formatSize
  };
}
