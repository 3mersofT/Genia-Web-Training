/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from '@/hooks/useChat';
import type { User } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: mockUser }
      }),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn()
          }
        }
      }))
    }
  }))
}));

// Mock user
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {}
} as User;

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useChat', () => {
  const originalError = console.error;

  beforeAll(() => {
    // Suppress act() warnings in tests - they're expected for async state updates
    console.error = (...args: any[]) => {
      const firstArg = String(args[0] || '');
      if (
        firstArg.includes('not wrapped in act') ||
        firstArg.includes('Warning: An update to TestComponent')
      ) {
        return;
      }
      originalError.call(console, ...args);
    };
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('system');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.conversationId).toBeNull();
      expect(result.current.currentModel).toBe('mistral-medium-3');
    });

    it('should initialize with custom context', () => {
      const customContext = {
        currentCapsule: {
          id: 'custom-capsule',
          title: 'Test Capsule',
          concepts: ['Test Concept'],
          difficulty: 'advanced' as const
        },
        userLevel: 'advanced' as const
      };

      const { result } = renderHook(() => useChat({ initialContext: customContext }));

      expect(result.current.context.currentCapsule.id).toBe('custom-capsule');
      expect(result.current.context.currentCapsule.title).toBe('Test Capsule');
      expect(result.current.context.userLevel).toBe('advanced');
    });

    it('should initialize with conversation ID', () => {
      const conversationId = 'test-conversation-123';
      const { result } = renderHook(() => useChat({ conversationId }));

      expect(result.current.conversationId).toBe(conversationId);
    });

    it('should set initial system message', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.messages[0]).toMatchObject({
        id: '1',
        role: 'system',
        methodStep: 'G'
      });
      expect(result.current.messages[0].content).toContain('GENIA');
    });
  });

  describe('Quota Loading', () => {
    it('should load quotas on mount when autoLoadQuotas is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          quotas: {
            'magistral-medium': { used: 5, limit: 30 },
            'mistral-medium-3': { used: 20, limit: 150 }
          }
        })
      });

      const { result } = renderHook(() => useChat({ autoLoadQuotas: true }));

      await waitFor(() => {
        expect(result.current.quota.magistralMedium.used).toBe(5);
        expect(result.current.quota.magistralMedium.daily).toBe(30);
        expect(result.current.quota.mistralMedium3.used).toBe(20);
        expect(result.current.quota.mistralMedium3.daily).toBe(150);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/quotas?userId=test-user-id')
      );
    });

    it('should not load quotas when autoLoadQuotas is false', async () => {
      const { result } = renderHook(() => useChat({ autoLoadQuotas: false }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.quota.magistralMedium.used).toBe(0);
      expect(result.current.quota.mistralMedium3.used).toBe(0);
    });

    it('should handle quota loading errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useChat({ autoLoadQuotas: true }));

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not throw and should maintain default quota values
      expect(result.current.quota.magistralMedium.used).toBe(0);
      expect(result.current.quota.mistralMedium3.used).toBe(0);
    });

    it('should have loadQuotas function available', () => {
      const { result } = renderHook(() => useChat({ autoLoadQuotas: false }));

      expect(typeof result.current.loadQuotas).toBe('function');
    });
  });

  describe('Send Message', () => {
    it('should have sendMessage function available', () => {
      const { result } = renderHook(() => useChat({ autoLoadQuotas: false }));

      expect(typeof result.current.sendMessage).toBe('function');
    });

    it('should not send empty messages', async () => {
      const { result } = renderHook(() => useChat({ autoLoadQuotas: false }));

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      // Should only have the initial system message
      expect(result.current.messages).toHaveLength(1);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should initially not be loading', () => {
      const { result } = renderHook(() => useChat({ autoLoadQuotas: false }));
      expect(result.current.isLoading).toBe(false);
    });

    it('should have clearError function', () => {
      const { result } = renderHook(() => useChat({ autoLoadQuotas: false }));

      expect(typeof result.current.clearError).toBe('function');
    });

    it('should have initial quota state', () => {
      const { result } = renderHook(() => useChat({ autoLoadQuotas: false }));

      expect(result.current.quota.magistralMedium).toEqual({ used: 0, daily: 0 });
      expect(result.current.quota.mistralMedium3).toEqual({ used: 0, daily: 0 });
    });

    it('should have user from auth', () => {
      const { result } = renderHook(() => useChat({ autoLoadQuotas: false }));

      // User should be loaded from mock
      expect(result.current.user).toBeDefined();
    });
  });

  describe('Model Selection', () => {
    it('should allow manual model change', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.currentModel).toBe('mistral-medium-3');

      act(() => {
        result.current.setCurrentModel('magistral-medium');
      });

      expect(result.current.currentModel).toBe('magistral-medium');
    });
  });

  describe('Utility Functions', () => {
    it('should clear error when clearError is called', () => {
      const { result } = renderHook(() => useChat());

      // Set an error first
      act(() => {
        // Trigger error by sending without user
        result.current.sendMessage('Test');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should reset conversation when resetConversation is called', () => {
      const { result } = renderHook(() => useChat());

      // Add some messages first
      act(() => {
        // Manually add messages for test
        result.current.sendMessage('Test').catch(() => {});
      });

      act(() => {
        result.current.resetConversation();
      });

      expect(result.current.messages).toHaveLength(1); // Only system message
      expect(result.current.conversationId).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Context Management', () => {
    it('should initialize with provided context', () => {
      const customContext = {
        currentCapsule: {
          id: 'capsule-123',
          title: 'Advanced Prompting',
          concepts: ['Context', 'Reasoning'],
          difficulty: 'advanced' as const
        },
        userLevel: 'advanced' as const
      };

      const { result } = renderHook(() =>
        useChat({ initialContext: customContext, autoLoadQuotas: false })
      );

      expect(result.current.context.currentCapsule.id).toBe('capsule-123');
      expect(result.current.context.userLevel).toBe('advanced');
    });
  });
});
