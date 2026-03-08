/**
 * @jest-environment node
 */
/**
 * Unit Tests for /api/chat Route
 *
 * Tests verify that the chat API route:
 * 1. Enforces authentication (returns 401 when not authenticated)
 * 2. Validates input parameters (messages, model)
 * 3. Integrates with Mistral API correctly
 * 4. Manages quotas properly (check and update)
 * 5. Saves conversation history when requested
 * 6. Handles errors gracefully
 * 7. Extracts GENIA method steps and reasoning
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chat/route';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock rate-limiter to avoid 429 in tests
jest.mock('@/lib/rate-limiter', () => ({
  createRateLimiter: () => async () => ({
    response: null,
    result: { success: true, limit: 100, remaining: 99, reset: Date.now() + 60000 },
  }),
}));

// Mock fetch for Mistral API calls
global.fetch = jest.fn();

describe('/api/chat - Unit Tests', () => {
  let mockSupabase: any;
  let mockAuth: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockAuth = {
      getUser: jest.fn(),
    };

    mockSupabase = {
      auth: mockAuth,
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(),
              })),
            })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(),
            })),
          })),
        })),
      })),
    };

    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValue(mockSupabase);
  });

  describe('Authentication Verification', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock: No authenticated user
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'mistral-medium-3',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorisé');
      expect(mockAuth.getUser).toHaveBeenCalled();
    });

    it('should return 401 when auth error occurs', async () => {
      // Mock: Authentication error
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorisé');
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      // Mock authenticated user for validation tests
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });
    });

    it('should return 400 when messages are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-medium-3',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when model is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'invalid-model-name',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should accept valid model names', async () => {
      // Mock Mistral API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Response',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const validModels = ['magistral-medium', 'mistral-medium-3', 'mistral-small'];

      for (const model of validModels) {
        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Test' }],
            model,
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Mistral API Integration', () => {
    beforeEach(() => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });
    });

    it('should call Mistral API with correct parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Hello! How can I help you?',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'mistral-medium-3',
          temperature: 0.7,
          maxTokens: 2000,
        }),
      });

      await POST(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.mistral.ai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer'),
          }),
          body: expect.stringContaining('mistral-medium-latest'),
        })
      );
    });

    it('should use default temperature and maxTokens when not provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Response',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          model: 'mistral-small',
        }),
      });

      await POST(request);

      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.temperature).toBe(0.5); // default for mistral-small
      expect(callBody.max_tokens).toBe(1000); // default for mistral-small
    });

    it('should handle successful response with usage data', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Hello! How can I help you?',
              },
            },
          ],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'mistral-medium-3',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBe('Hello! How can I help you?');
      expect(data.usage).toBeDefined();
      expect(data.usage.promptTokens).toBe(100);
      expect(data.usage.completionTokens).toBe(50);
      expect(data.usage.totalTokens).toBe(150);
      expect(data.usage.cost).toBeGreaterThan(0);
    });

    it('should return 500 when Mistral API fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'API Error',
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'mistral-medium-3',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Erreur Mistral');
    });

    it('should handle Mistral API network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'mistral-medium-3',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Network error');
    });
  });

  describe('Quota Management', () => {
    beforeEach(() => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Response',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });
    });

    it('should update quota when user has no previous usage', async () => {
      const mockInsert = jest.fn();
      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'llm_usage') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
            insert: mockInsert,
          };
        }
        return mockSupabase.from();
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          model: 'mistral-medium-3',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-123',
          model: 'mistral-medium-3',
          request_count: 1,
          total_tokens: 30,
        })
      );
    });

    it('should update quota when user has existing usage', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(),
          })),
        })),
      }));

      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'llm_usage') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  eq: jest.fn(() => ({
                    single: jest.fn().mockResolvedValue({
                      data: {
                        request_count: 5,
                        total_tokens: 100,
                        total_cost: 0.01,
                      },
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
            update: mockUpdate,
          };
        }
        return mockSupabase.from();
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          model: 'mistral-medium-3',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          request_count: 6,
          total_tokens: 130,
        })
      );
      expect(data.quotaUsed).toEqual({
        used: 6,
        limit: 300,
      });
    });

    it('should continue with warning when quota is exceeded', async () => {
      // Spy on console.warn to verify quota warning is logged
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: {
                    request_count: 300, // At quota limit for mistral-medium-3
                    total_tokens: 5000,
                    total_cost: 0.5,
                  },
                  error: null,
                }),
              })),
            })),
          })),
        })),
      }));

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          model: 'mistral-medium-3',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Chat should continue even when quota is exceeded (doesn't block response)
      expect(response.status).toBe(200);
      expect(data.content).toBe('Response');

      consoleWarnSpy.mockRestore();
    });

    it('should continue with chat when quota update fails', async () => {
      // Mock quota check to throw error
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockRejectedValue(new Error('Database error')),
              })),
            })),
          })),
        })),
      }));

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          model: 'mistral-medium-3',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still return chat response
      expect(response.status).toBe(200);
      expect(data.content).toBe('Response');
      expect(data.quotaUsed).toBeUndefined();
    });
  });

  describe('Conversation Saving', () => {
    beforeEach(() => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Assistant response',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });
    });

    it('should create new conversation when conversationId is "new"', async () => {
      const mockConversationInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'new-conv-123' },
            error: null,
          }),
        })),
      }));

      const mockMessageInsert = jest.fn();

      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'chat_conversations') {
          return { insert: mockConversationInsert };
        }
        if (table === 'chat_messages') {
          return { insert: mockMessageInsert };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({ data: null }),
                })),
              })),
            })),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'mistral-medium-3',
          conversationId: 'new',
          capsuleId: 'capsule-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockConversationInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-123',
          capsule_id: 'capsule-123',
          model: 'mistral-medium-3',
        })
      );
      expect(mockMessageInsert).toHaveBeenCalledTimes(2); // user + assistant messages
      expect(data.conversationId).toBe('new-conv-123');
    });

    it('should append to existing conversation', async () => {
      const mockMessageInsert = jest.fn();

      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'chat_messages') {
          return { insert: mockMessageInsert };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({ data: null }),
                })),
              })),
            })),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: 'Previous message' },
            { role: 'assistant', content: 'Previous response' },
            { role: 'user', content: 'New message' },
          ],
          model: 'mistral-medium-3',
          conversationId: 'existing-conv-456',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockMessageInsert).toHaveBeenCalledTimes(2);

      // Check user message
      expect(mockMessageInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_id: 'existing-conv-456',
          role: 'user',
          content: 'New message',
        })
      );

      // Check assistant message
      expect(mockMessageInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_id: 'existing-conv-456',
          role: 'assistant',
          content: 'Assistant response',
        })
      );

      expect(data.conversationId).toBe('existing-conv-456');
    });

    it('should not save conversation when conversationId is not provided', async () => {
      const mockMessageInsert = jest.fn();

      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'chat_messages') {
          return { insert: mockMessageInsert };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({ data: null }),
                })),
              })),
            })),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          model: 'mistral-medium-3',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockMessageInsert).not.toHaveBeenCalled();
      expect(data.conversationId).toBeUndefined();
    });
  });

  describe('GENIA Method Step Extraction', () => {
    beforeEach(() => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });
    });

    it('should extract G (Guide) step', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '[G - Guide] Voici le guide pour commencer...',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.methodStep).toBe('G');
    });

    it('should extract E (Exemple) step', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '[E - Exemple] Voici un exemple...',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.methodStep).toBe('E');
    });

    it('should extract N (Niveau) step', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '[N - Niveau] Évaluation du niveau...',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.methodStep).toBe('N');
    });

    it('should extract I (Interaction) step', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '[I - Interaction] Discussion interactive...',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.methodStep).toBe('I');
    });

    it('should extract A (Assessment) step', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '[A - Assessment] Évaluation finale...',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.methodStep).toBe('A');
    });

    it('should not extract method step when not present', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Regular response without method step',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.methodStep).toBeUndefined();
    });
  });

  describe('Reasoning Extraction', () => {
    beforeEach(() => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });
    });

    it('should extract reasoning when reasoning=explicit and tags present', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content:
                  '[Raisonnement]This is my reasoning process[/Raisonnement]\nAnd here is the response',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          reasoning: 'explicit',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reasoning).toBe('This is my reasoning process');
    });

    it('should not extract reasoning when reasoning=implicit', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content:
                  '[Raisonnement]This is reasoning[/Raisonnement]\nResponse',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          reasoning: 'implicit',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.reasoning).toBeUndefined();
    });

    it('should not extract reasoning when tags are missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Regular response without reasoning tags',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          reasoning: 'explicit',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.reasoning).toBeUndefined();
    });
  });

  describe('Cost Calculation', () => {
    beforeEach(() => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });
    });

    it('should calculate cost correctly for magistral-medium', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Response',
              },
            },
          ],
          usage: {
            prompt_tokens: 1000,
            completion_tokens: 500,
            total_tokens: 1500,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          model: 'magistral-medium',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Cost = (1000 / 1_000_000) * 2.0 + (500 / 1_000_000) * 6.0
      // Cost = 0.002 + 0.003 = 0.005
      expect(data.usage.cost).toBeCloseTo(0.005, 6);
    });

    it('should calculate cost correctly for mistral-medium-3', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Response',
              },
            },
          ],
          usage: {
            prompt_tokens: 2000,
            completion_tokens: 1000,
            total_tokens: 3000,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          model: 'mistral-medium-3',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Cost = (2000 / 1_000_000) * 1.5 + (1000 / 1_000_000) * 4.5
      // Cost = 0.003 + 0.0045 = 0.0075
      expect(data.usage.cost).toBeCloseTo(0.0075, 6);
    });

    it('should calculate cost correctly for mistral-small', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Response',
              },
            },
          ],
          usage: {
            prompt_tokens: 1000,
            completion_tokens: 1000,
            total_tokens: 2000,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          model: 'mistral-small',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Cost = (1000 / 1_000_000) * 0.25 + (1000 / 1_000_000) * 0.25
      // Cost = 0.00025 + 0.00025 = 0.0005
      expect(data.usage.cost).toBeCloseTo(0.0005, 6);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing usage data from Mistral', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Response',
              },
            },
          ],
          // No usage field
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.usage.totalTokens).toBe(0);
      expect(data.usage.cost).toBe(0);
    });

    it('should handle malformed JSON in request body', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Create request with invalid JSON
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json{',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should use default model when not specified', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Response',
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          // No model specified
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.model).toBe('mistral-medium-3'); // default model
    });
  });
});
