/**
 * Unit Tests for /api/quotas Route
 *
 * Tests verify that the quotas API route:
 * 1. Enforces authentication (returns 401 when not authenticated)
 * 2. Validates input parameters (userId required)
 * 3. Enforces authorization (users can only access their own quotas)
 * 4. Retrieves quota status from database correctly
 * 5. Fetches additional usage details (tokens, cost)
 * 6. Formats quota response correctly
 * 7. Handles errors gracefully
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/quotas/route';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createAdminClient: jest.fn(),
}));

describe('/api/quotas - Unit Tests', () => {
  let mockSupabase: any;
  let mockAdminSupabase: any;
  let mockAuth: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client for regular user
    mockAuth = {
      getUser: jest.fn(),
    };

    mockSupabase = {
      auth: mockAuth,
    };

    // Setup mock Admin Supabase client
    mockAdminSupabase = {
      rpc: jest.fn(),
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(),
          })),
        })),
      })),
    };

    const { createClient, createAdminClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValue(mockSupabase);
    createAdminClient.mockResolvedValue(mockAdminSupabase);
  });

  describe('Authentication Verification', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock: No authenticated user
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
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

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
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

    it('should return 400 when userId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/quotas', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('userId requis');
    });

    it('should return 400 when userId is empty string', async () => {
      const request = new NextRequest('http://localhost:3000/api/quotas?userId=', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('userId requis');
    });
  });

  describe('Authorization Verification', () => {
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

    it('should return 403 when user tries to access another users quotas', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=another-user-456',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Accès refusé');
    });

    it('should allow user to access their own quotas', async () => {
      // Mock successful quota retrieval
      mockAdminSupabase.rpc.mockResolvedValue({
        data: [
          {
            model: 'mistral-medium-3',
            used: 10,
            daily_limit: 150,
            remaining: 140,
          },
        ],
        error: null,
      });

      mockAdminSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  model: 'mistral-medium-3',
                  total_tokens: 5000,
                  total_cost: 0.05,
                },
              ],
              error: null,
            }),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quotas).toBeDefined();
    });
  });

  describe('Quota Retrieval', () => {
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

    it('should retrieve and format quotas correctly', async () => {
      // Mock RPC call response
      mockAdminSupabase.rpc.mockResolvedValue({
        data: [
          {
            model: 'magistral-medium',
            used: 5,
            daily_limit: 30,
            remaining: 25,
          },
          {
            model: 'mistral-medium-3',
            used: 20,
            daily_limit: 150,
            remaining: 130,
          },
          {
            model: 'mistral-small',
            used: 100,
            daily_limit: 500,
            remaining: 400,
          },
        ],
        error: null,
      });

      // Mock usage details
      mockAdminSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  model: 'magistral-medium',
                  total_tokens: 2000,
                  total_cost: 0.02,
                },
                {
                  model: 'mistral-medium-3',
                  total_tokens: 10000,
                  total_cost: 0.10,
                },
                {
                  model: 'mistral-small',
                  total_tokens: 50000,
                  total_cost: 0.05,
                },
              ],
              error: null,
            }),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quotas).toBeDefined();

      // Check magistral-medium
      expect(data.quotas['magistral-medium']).toEqual({
        used: 5,
        limit: 30,
        remaining: 25,
        tokensUsed: 2000,
        cost: 0.02,
      });

      // Check mistral-medium-3
      expect(data.quotas['mistral-medium-3']).toEqual({
        used: 20,
        limit: 150,
        remaining: 130,
        tokensUsed: 10000,
        cost: 0.10,
      });

      // Check mistral-small
      expect(data.quotas['mistral-small']).toEqual({
        used: 100,
        limit: 500,
        remaining: 400,
        tokensUsed: 50000,
        cost: 0.05,
      });
    });

    it('should call get_user_quota_status RPC with correct parameters', async () => {
      mockAdminSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      mockAdminSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      await GET(request);

      expect(mockAdminSupabase.rpc).toHaveBeenCalledWith(
        'get_user_quota_status',
        { p_user_id: 'test-user-123' }
      );
    });

    it('should handle missing usage data gracefully', async () => {
      // Mock RPC call with quota data
      mockAdminSupabase.rpc.mockResolvedValue({
        data: [
          {
            model: 'mistral-medium-3',
            used: 10,
            daily_limit: 150,
            remaining: 140,
          },
        ],
        error: null,
      });

      // Mock no usage details available
      mockAdminSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: null, // No usage data
              error: null,
            }),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quotas['mistral-medium-3']).toEqual({
        used: 10,
        limit: 150,
        remaining: 140,
        tokensUsed: 0,
        cost: 0,
      });
    });

    it('should handle empty quota data', async () => {
      // Mock RPC call with empty array
      mockAdminSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      mockAdminSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quotas).toEqual({});
    });

    it('should handle partial usage data', async () => {
      // Mock RPC with two models
      mockAdminSupabase.rpc.mockResolvedValue({
        data: [
          {
            model: 'mistral-medium-3',
            used: 10,
            daily_limit: 150,
            remaining: 140,
          },
          {
            model: 'mistral-small',
            used: 50,
            daily_limit: 500,
            remaining: 450,
          },
        ],
        error: null,
      });

      // Mock usage data only for one model
      mockAdminSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  model: 'mistral-medium-3',
                  total_tokens: 5000,
                  total_cost: 0.05,
                },
                // Missing mistral-small usage data
              ],
              error: null,
            }),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quotas['mistral-medium-3']).toEqual({
        used: 10,
        limit: 150,
        remaining: 140,
        tokensUsed: 5000,
        cost: 0.05,
      });
      expect(data.quotas['mistral-small']).toEqual({
        used: 50,
        limit: 500,
        remaining: 450,
        tokensUsed: 0,
        cost: 0,
      });
    });
  });

  describe('Error Handling', () => {
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

    it('should return 500 when RPC call fails', async () => {
      mockAdminSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Function not found' },
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erreur récupération quotas');
    });

    it('should return 500 when database connection fails', async () => {
      mockAdminSupabase.rpc.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erreur serveur');
    });

    it('should return 500 when usage fetch throws error', async () => {
      // Mock successful RPC call
      mockAdminSupabase.rpc.mockResolvedValue({
        data: [
          {
            model: 'mistral-medium-3',
            used: 10,
            daily_limit: 150,
            remaining: 140,
          },
        ],
        error: null,
      });

      // Mock usage fetch throwing error
      mockAdminSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => {
              throw new Error('Network error');
            }),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erreur serveur');
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock auth to throw unexpected error
      mockAuth.getUser.mockRejectedValue(new Error('Unexpected error'));

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erreur serveur');
    });
  });

  describe('Edge Cases', () => {
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

    it('should handle quota data with zero values', async () => {
      mockAdminSupabase.rpc.mockResolvedValue({
        data: [
          {
            model: 'mistral-medium-3',
            used: 0,
            daily_limit: 150,
            remaining: 150,
          },
        ],
        error: null,
      });

      mockAdminSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  model: 'mistral-medium-3',
                  total_tokens: 0,
                  total_cost: 0,
                },
              ],
              error: null,
            }),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quotas['mistral-medium-3']).toEqual({
        used: 0,
        limit: 150,
        remaining: 150,
        tokensUsed: 0,
        cost: 0,
      });
    });

    it('should handle quota exceeded scenario', async () => {
      mockAdminSupabase.rpc.mockResolvedValue({
        data: [
          {
            model: 'mistral-medium-3',
            used: 150,
            daily_limit: 150,
            remaining: 0,
          },
        ],
        error: null,
      });

      mockAdminSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  model: 'mistral-medium-3',
                  total_tokens: 75000,
                  total_cost: 0.75,
                },
              ],
              error: null,
            }),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quotas['mistral-medium-3']).toEqual({
        used: 150,
        limit: 150,
        remaining: 0,
        tokensUsed: 75000,
        cost: 0.75,
      });
    });

    it('should handle special characters in userId', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-with-special-chars-@#$',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      mockAdminSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      mockAdminSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        })),
      });

      const userId = encodeURIComponent('test-user-with-special-chars-@#$');
      const request = new NextRequest(
        `http://localhost:3000/api/quotas?userId=${userId}`,
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quotas).toBeDefined();
    });

    it('should handle very large token and cost values', async () => {
      mockAdminSupabase.rpc.mockResolvedValue({
        data: [
          {
            model: 'mistral-medium-3',
            used: 150,
            daily_limit: 150,
            remaining: 0,
          },
        ],
        error: null,
      });

      mockAdminSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  model: 'mistral-medium-3',
                  total_tokens: 999999999,
                  total_cost: 9999.99,
                },
              ],
              error: null,
            }),
          })),
        })),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/quotas?userId=test-user-123',
        {
          method: 'GET',
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quotas['mistral-medium-3']).toEqual({
        used: 150,
        limit: 150,
        remaining: 0,
        tokensUsed: 999999999,
        cost: 9999.99,
      });
    });
  });
});
