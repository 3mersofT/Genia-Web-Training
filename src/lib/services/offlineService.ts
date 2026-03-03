// Service de gestion du cache offline pour les capsules
// Utilise la Cache API du navigateur pour stocker les capsules localement

import type { Capsule } from '@/lib/data';

const CACHE_NAME = 'genia-capsules-v1';
const CACHE_EXPIRY_KEY = 'genia-cache-expiry';
const DEFAULT_EXPIRY_HOURS = 72; // 3 jours

export interface CachedCapsule {
  capsule: Capsule;
  content: Record<string, any>;
  moduleId: string;
  moduleTitle: string;
  cachedAt: string;
  expiresAt: string;
  size: number;
}

export interface CacheInfo {
  totalCapsules: number;
  totalSize: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

function getCapsuleCacheKey(capsuleId: string): string {
  return `/offline/capsule/${capsuleId}`;
}

function getModuleCacheKey(moduleId: string): string {
  return `/offline/module/${moduleId}`;
}

export class OfflineCapsuleService {
  /**
   * Met en cache une capsule avec son contenu pour consultation offline
   */
  async cacheCapsule(
    capsule: Capsule,
    content: Record<string, any>,
    moduleTitle: string
  ): Promise<boolean> {
    try {
      if (!('caches' in window)) return false;

      const cache = await caches.open(CACHE_NAME);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + DEFAULT_EXPIRY_HOURS);

      const cachedData: CachedCapsule = {
        capsule,
        content,
        moduleId: capsule.moduleId,
        moduleTitle,
        cachedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        size: 0
      };

      const jsonString = JSON.stringify(cachedData);
      cachedData.size = new Blob([jsonString]).size;

      const response = new Response(JSON.stringify(cachedData), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cached-At': cachedData.cachedAt,
          'X-Expires-At': cachedData.expiresAt
        }
      });

      await cache.put(getCapsuleCacheKey(capsule.id), response);
      this.updateExpiryIndex(capsule.id, cachedData.expiresAt);

      return true;
    } catch (error) {
      console.error('Erreur mise en cache capsule:', error);
      return false;
    }
  }

  /**
   * Récupère une capsule depuis le cache
   */
  async getCachedCapsule(capsuleId: string): Promise<CachedCapsule | null> {
    try {
      if (!('caches' in window)) return null;

      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(getCapsuleCacheKey(capsuleId));

      if (!response) return null;

      const data: CachedCapsule = await response.json();

      // Vérifier expiration
      if (new Date(data.expiresAt) < new Date()) {
        await this.removeCachedCapsule(capsuleId);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lecture cache capsule:', error);
      return null;
    }
  }

  /**
   * Liste toutes les capsules en cache
   */
  async listCachedCapsules(): Promise<CachedCapsule[]> {
    try {
      if (!('caches' in window)) return [];

      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const capsules: CachedCapsule[] = [];

      for (const request of keys) {
        if (request.url.includes('/offline/capsule/')) {
          const response = await cache.match(request);
          if (response) {
            try {
              const data: CachedCapsule = await response.json();
              // Exclure les entrées expirées
              if (new Date(data.expiresAt) >= new Date()) {
                capsules.push(data);
              }
            } catch {
              // Ignorer les entrées corrompues
            }
          }
        }
      }

      return capsules.sort((a, b) =>
        new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime()
      );
    } catch (error) {
      console.error('Erreur listage cache:', error);
      return [];
    }
  }

  /**
   * Supprime une capsule du cache
   */
  async removeCachedCapsule(capsuleId: string): Promise<boolean> {
    try {
      if (!('caches' in window)) return false;

      const cache = await caches.open(CACHE_NAME);
      const deleted = await cache.delete(getCapsuleCacheKey(capsuleId));
      this.removeFromExpiryIndex(capsuleId);
      return deleted;
    } catch (error) {
      console.error('Erreur suppression cache:', error);
      return false;
    }
  }

  /**
   * Nettoie les entrées expirées du cache
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      if (!('caches' in window)) return 0;

      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      let cleaned = 0;

      for (const request of keys) {
        if (request.url.includes('/offline/capsule/')) {
          const response = await cache.match(request);
          if (response) {
            try {
              const data: CachedCapsule = await response.json();
              if (new Date(data.expiresAt) < new Date()) {
                await cache.delete(request);
                cleaned++;
              }
            } catch {
              await cache.delete(request);
              cleaned++;
            }
          }
        }
      }

      return cleaned;
    } catch (error) {
      console.error('Erreur nettoyage cache:', error);
      return 0;
    }
  }

  /**
   * Obtient la taille totale du cache et les informations
   */
  async getCacheInfo(): Promise<CacheInfo> {
    try {
      const capsules = await this.listCachedCapsules();

      return {
        totalCapsules: capsules.length,
        totalSize: capsules.reduce((sum, c) => sum + c.size, 0),
        oldestEntry: capsules.length > 0
          ? capsules[capsules.length - 1].cachedAt
          : null,
        newestEntry: capsules.length > 0
          ? capsules[0].cachedAt
          : null
      };
    } catch (error) {
      console.error('Erreur info cache:', error);
      return { totalCapsules: 0, totalSize: 0, oldestEntry: null, newestEntry: null };
    }
  }

  /**
   * Met en cache toutes les capsules d'un module
   */
  async cacheModule(
    moduleId: string,
    capsules: Array<{ capsule: Capsule; content: Record<string, any> }>,
    moduleTitle: string
  ): Promise<{ cached: number; failed: number }> {
    let cached = 0;
    let failed = 0;

    for (const { capsule, content } of capsules) {
      const success = await this.cacheCapsule(capsule, content, moduleTitle);
      if (success) {
        cached++;
      } else {
        failed++;
      }
    }

    // Stocker les métadonnées du module
    try {
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        const moduleData = {
          moduleId,
          moduleTitle,
          capsuleIds: capsules.map(c => c.capsule.id),
          cachedAt: new Date().toISOString()
        };
        const response = new Response(JSON.stringify(moduleData), {
          headers: { 'Content-Type': 'application/json' }
        });
        await cache.put(getModuleCacheKey(moduleId), response);
      }
    } catch {
      // Non bloquant
    }

    return { cached, failed };
  }

  /**
   * Vérifie si une capsule est disponible offline
   */
  async isCapsuleAvailable(capsuleId: string): Promise<boolean> {
    const cached = await this.getCachedCapsule(capsuleId);
    return cached !== null;
  }

  /**
   * Vide entièrement le cache des capsules
   */
  async clearAllCache(): Promise<boolean> {
    try {
      if (!('caches' in window)) return false;
      await caches.delete(CACHE_NAME);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
      return true;
    } catch (error) {
      console.error('Erreur vidage cache:', error);
      return false;
    }
  }

  /**
   * Formate la taille en texte lisible
   */
  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // --- Index d'expiration en localStorage ---

  private updateExpiryIndex(capsuleId: string, expiresAt: string): void {
    try {
      const index = this.getExpiryIndex();
      index[capsuleId] = expiresAt;
      localStorage.setItem(CACHE_EXPIRY_KEY, JSON.stringify(index));
    } catch {
      // Non bloquant
    }
  }

  private removeFromExpiryIndex(capsuleId: string): void {
    try {
      const index = this.getExpiryIndex();
      delete index[capsuleId];
      localStorage.setItem(CACHE_EXPIRY_KEY, JSON.stringify(index));
    } catch {
      // Non bloquant
    }
  }

  private getExpiryIndex(): Record<string, string> {
    try {
      const stored = localStorage.getItem(CACHE_EXPIRY_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
}

// Instance singleton
export const offlineCapsuleService = new OfflineCapsuleService();
