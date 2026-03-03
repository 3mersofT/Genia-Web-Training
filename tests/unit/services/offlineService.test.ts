/**
 * @jest-environment jsdom
 */
import { OfflineCapsuleService } from '@/lib/services/offlineService';
import type { Capsule } from '@/lib/data';

// --- Polyfill Response and Blob for jsdom if not present ---
if (typeof globalThis.Response === 'undefined') {
  (globalThis as any).Response = class MockResponse {
    private body: string;
    public headers: Map<string, string>;

    constructor(body?: string | null, init?: { headers?: Record<string, string> }) {
      this.body = body ?? '';
      this.headers = new Map(Object.entries(init?.headers ?? {}));
    }

    async json() {
      return JSON.parse(this.body);
    }

    async text() {
      return this.body;
    }
  };
}

if (typeof globalThis.Blob === 'undefined') {
  (globalThis as any).Blob = class MockBlob {
    public size: number;
    constructor(parts: any[]) {
      this.size = parts.reduce((sum: number, p: any) => sum + String(p).length, 0);
    }
  };
}

// --- Mock the Cache API ---
const mockCache = {
  put: jest.fn().mockResolvedValue(undefined),
  match: jest.fn(),
  delete: jest.fn().mockResolvedValue(true),
  keys: jest.fn().mockResolvedValue([]),
};

// Define caches on window (jsdom) since the source checks 'caches' in window
Object.defineProperty(window, 'caches', {
  value: {
    open: jest.fn().mockResolvedValue(mockCache),
    delete: jest.fn().mockResolvedValue(true),
  },
  writable: true,
  configurable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Helper: create a minimal Capsule stub
function makeCapsule(id: string): Capsule {
  return {
    id,
    moduleId: 'module-1',
    order: 1,
    title: `Capsule ${id}`,
    duration: 10,
    difficulty: 'easy',
  } as Capsule;
}

// Helper: create a mock response object that behaves like fetch Response
function jsonResponse(body: any): { json: () => Promise<any> } {
  return {
    json: () => Promise.resolve(JSON.parse(JSON.stringify(body))),
  };
}

describe('OfflineCapsuleService', () => {
  let service: OfflineCapsuleService;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    service = new OfflineCapsuleService();
  });

  describe('cacheCapsule', () => {
    it('should store capsule data in the cache', async () => {
      const capsule = makeCapsule('cap-1');
      const content = { lesson: 'Hello world' };

      const result = await service.cacheCapsule(capsule, content, 'Module A');

      expect(result).toBe(true);
      expect(window.caches.open).toHaveBeenCalledWith('genia-capsules-v1');
      expect(mockCache.put).toHaveBeenCalledTimes(1);

      // The first argument of put should be the cache key
      const putCallKey = mockCache.put.mock.calls[0][0];
      expect(putCallKey).toBe('/offline/capsule/cap-1');

      // The second argument should be a Response
      const putCallResponse = mockCache.put.mock.calls[0][1];
      expect(putCallResponse).toBeDefined();
    });
  });

  describe('getCachedCapsule', () => {
    it('should return null when no cached entry exists', async () => {
      mockCache.match.mockResolvedValueOnce(undefined);

      const result = await service.getCachedCapsule('nonexistent');

      expect(result).toBeNull();
    });

    it('should return cached data when entry exists and is not expired', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 24);

      const cachedData = {
        capsule: makeCapsule('cap-2'),
        content: { lesson: 'test' },
        moduleId: 'module-1',
        moduleTitle: 'Module B',
        cachedAt: new Date().toISOString(),
        expiresAt: futureDate.toISOString(),
        size: 100,
      };

      mockCache.match.mockResolvedValueOnce(jsonResponse(cachedData));

      const result = await service.getCachedCapsule('cap-2');

      expect(result).not.toBeNull();
      expect(result!.capsule.id).toBe('cap-2');
      expect(result!.moduleTitle).toBe('Module B');
    });

    it('should return null and delete entry when it is expired', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 24);

      const expiredData = {
        capsule: makeCapsule('cap-3'),
        content: {},
        moduleId: 'module-1',
        moduleTitle: 'Module C',
        cachedAt: new Date().toISOString(),
        expiresAt: pastDate.toISOString(),
        size: 50,
      };

      mockCache.match.mockResolvedValueOnce(jsonResponse(expiredData));

      const result = await service.getCachedCapsule('cap-3');

      expect(result).toBeNull();
      // removeCachedCapsule should have been called, which calls cache.delete
      expect(mockCache.delete).toHaveBeenCalled();
    });
  });

  describe('listCachedCapsules', () => {
    it('should filter out expired entries', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 24);
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 24);

      const validEntry = {
        capsule: makeCapsule('cap-valid'),
        content: {},
        moduleId: 'module-1',
        moduleTitle: 'Module A',
        cachedAt: new Date().toISOString(),
        expiresAt: futureDate.toISOString(),
        size: 100,
      };
      const expiredEntry = {
        capsule: makeCapsule('cap-expired'),
        content: {},
        moduleId: 'module-1',
        moduleTitle: 'Module A',
        cachedAt: new Date().toISOString(),
        expiresAt: pastDate.toISOString(),
        size: 50,
      };

      // keys() returns Request-like objects with url property
      mockCache.keys.mockResolvedValueOnce([
        { url: 'http://localhost/offline/capsule/cap-valid' },
        { url: 'http://localhost/offline/capsule/cap-expired' },
      ]);

      // match() is called once per key
      mockCache.match
        .mockResolvedValueOnce(jsonResponse(validEntry))
        .mockResolvedValueOnce(jsonResponse(expiredEntry));

      const results = await service.listCachedCapsules();

      expect(results).toHaveLength(1);
      expect(results[0].capsule.id).toBe('cap-valid');
    });
  });

  describe('removeCachedCapsule', () => {
    it('should delete the entry from the cache', async () => {
      mockCache.delete.mockResolvedValueOnce(true);

      const result = await service.removeCachedCapsule('cap-to-remove');

      expect(result).toBe(true);
      expect(mockCache.delete).toHaveBeenCalledWith('/offline/capsule/cap-to-remove');
    });
  });

  describe('isCapsuleAvailable', () => {
    it('should return true when capsule is cached and not expired', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 24);

      const cachedData = {
        capsule: makeCapsule('cap-avail'),
        content: {},
        moduleId: 'module-1',
        moduleTitle: 'Module X',
        cachedAt: new Date().toISOString(),
        expiresAt: futureDate.toISOString(),
        size: 100,
      };

      mockCache.match.mockResolvedValueOnce(jsonResponse(cachedData));

      const result = await service.isCapsuleAvailable('cap-avail');

      expect(result).toBe(true);
    });

    it('should return false when capsule is not cached', async () => {
      mockCache.match.mockResolvedValueOnce(undefined);

      const result = await service.isCapsuleAvailable('cap-nope');

      expect(result).toBe(false);
    });
  });

  describe('clearAllCache', () => {
    it('should delete the entire cache store', async () => {
      const result = await service.clearAllCache();

      expect(result).toBe(true);
      expect(window.caches.delete).toHaveBeenCalledWith('genia-capsules-v1');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('genia-cache-expiry');
    });
  });

  describe('formatSize', () => {
    it('should return "0 B" for 0 bytes', () => {
      expect(service.formatSize(0)).toBe('0 B');
    });

    it('should format bytes correctly', () => {
      expect(service.formatSize(500)).toBe('500 B');
    });

    it('should format kilobytes correctly', () => {
      expect(service.formatSize(1024)).toBe('1 KB');
      expect(service.formatSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes correctly', () => {
      expect(service.formatSize(1048576)).toBe('1 MB');
    });
  });
});
