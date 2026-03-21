/**
 * @jest-environment node
 *
 * Unit Tests for /api/quotas Authentication
 *
 * Tests verify that the quotas API route enforces proper authentication and authorization:
 * 1. Returns 401 when user is not authenticated
 * 2. Returns 403 when userId in query params doesn't match authenticated user
 * 3. Returns 400 when userId is missing
 * 4. Returns 200 when userId matches authenticated user
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/quotas/route';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createAdminClient: jest.fn(),
}));

describe('/api/quotas - Authentication Tests', () => {
  let mockSupabase: any;
  let mockAdminSupabase: any;
  let mockAuth: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockAuth = {
      getUser: jest.fn(),
    };

    mockSupabase = {
      auth: mockAuth,
    };

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
        'http://localhost:3000/api/quotas?userId=123e4567-e89b-12d3-a456-426614174000'
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
        'http://localhost:3000/api/quotas?userId=123e4567-e89b-12d3-a456-426614174000'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorisé');
    });

    it('should return 400 when userId is missing', async () => {
      // Mock: Authenticated user
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
      };

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/quotas');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });
  });

  describe('Authorization Verification (userId Mismatch)', () => {
    it('should return 403 when userId does not match authenticated user', async () => {
      // Mock: Authenticated user
      const authenticatedUserId = '11111111-1111-4111-a111-111111111111';
      const requestedUserId = '22222222-2222-4222-a222-222222222222'; // Different user!

      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: authenticatedUserId,
            email: 'user123@example.com',
          },
        },
        error: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/quotas?userId=${requestedUserId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Accès refusé');
      expect(mockAuth.getUser).toHaveBeenCalled();

      // Verify admin client was NOT called (request rejected before data access)
      expect(mockAdminSupabase.rpc).not.toHaveBeenCalled();
    });

    it('should prevent IDOR attack - user cannot access another user quotas', async () => {
      const attackerUserId = '33333333-3333-4333-a333-333333333333';
      const victimUserId = '44444444-4444-4444-a444-444444444444';

      // Mock: Attacker is authenticated
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: attackerUserId,
            email: 'attacker@example.com',
          },
        },
        error: null,
      });

      // Attacker tries to access victim's quotas
      const request = new NextRequest(
        `http://localhost:3000/api/quotas?userId=${victimUserId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Accès refusé');

      // Verify victim's data was NOT accessed
      expect(mockAdminSupabase.rpc).not.toHaveBeenCalledWith(
        'get_user_quota_status',
        expect.objectContaining({
          p_user_id: victimUserId,
        })
      );
    });
  });

  describe('Successful Authorization', () => {
    it('should return 200 when userId matches authenticated user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock: Authenticated user
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock quota response
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
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  model: 'mistral-medium-3',
                  total_tokens: 5000,
                  total_cost: 0.05,
                },
              ],
            }),
          }),
        }),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/quotas?userId=${userId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quotas).toBeDefined();
      expect(mockAuth.getUser).toHaveBeenCalled();

      // Verify the correct user's quotas were fetched
      expect(mockAdminSupabase.rpc).toHaveBeenCalledWith(
        'get_user_quota_status',
        { p_user_id: userId }
      );
    });

    it('should only access data for the authenticated user', async () => {
      const authenticatedUserId = '789e4567-e89b-12d3-a456-426614174000';

      // Mock: Authenticated user
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: authenticatedUserId,
            email: 'auth@example.com',
          },
        },
        error: null,
      });

      // Mock quota response
      mockAdminSupabase.rpc.mockResolvedValue({
        data: [
          {
            model: 'mistral-small',
            used: 5,
            daily_limit: 500,
            remaining: 495,
          },
        ],
        error: null,
      });

      mockAdminSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
            }),
          }),
        }),
      });

      const request = new NextRequest(
        `http://localhost:3000/api/quotas?userId=${authenticatedUserId}`
      );

      const response = await GET(request);

      expect(response.status).toBe(200);

      // Verify ONLY authenticated user's data was accessed
      expect(mockAdminSupabase.rpc).toHaveBeenCalledWith(
        'get_user_quota_status',
        { p_user_id: authenticatedUserId }
      );
      expect(mockAdminSupabase.rpc).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database error gracefully', async () => {
      const userId = '456e4567-e89b-12d3-a456-426614174000';

      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock database error
      mockAdminSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/quotas?userId=${userId}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erreur récupération quotas');
    });

    it('should handle empty userId parameter', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/quotas?userId=');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });
  });
});
