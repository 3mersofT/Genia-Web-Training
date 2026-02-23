/**
 * Unit Tests for /api/exercise/generate Authentication
 *
 * Tests verify that the exercise generation API route enforces proper authentication and authorization:
 * 1. Returns 401 when user is not authenticated
 * 2. Returns 403 when userId in request body doesn't match authenticated user
 * 3. Returns 400 when required parameters are missing
 * 4. Returns 200 when userId matches authenticated user
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/exercise/generate/route';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock fetch for Mistral API calls
global.fetch = jest.fn();

describe('/api/exercise/generate - Authentication Tests', () => {
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
            single: jest.fn().mockResolvedValue({
              data: { id: 'exercise-123' },
            }),
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

      const request = new NextRequest('http://localhost:3000/api/exercise/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capsuleTitle: 'Test Capsule',
          concepts: ['concept1', 'concept2'],
          userLevel: 'intermediate',
          userId: 'test-user-123',
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

      const request = new NextRequest('http://localhost:3000/api/exercise/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capsuleTitle: 'Test',
          concepts: ['test'],
          userLevel: 'beginner',
          userId: 'user-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorisé');
    });

    it('should return 400 when required parameters are missing', async () => {
      // Mock: Authenticated user
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/exercise/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capsuleTitle: 'Test',
          // Missing concepts, userLevel, userId
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Paramètres manquants');
    });
  });

  describe('Authorization Verification (userId Mismatch)', () => {
    it('should return 403 when userId does not match authenticated user', async () => {
      const authenticatedUserId = 'user-123';
      const requestedUserId = 'user-456'; // Different user!

      // Mock: Authenticated user
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: authenticatedUserId,
            email: 'user123@example.com',
          },
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/exercise/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capsuleTitle: 'Test Capsule',
          concepts: ['concept1', 'concept2'],
          userLevel: 'intermediate',
          userId: requestedUserId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Accès refusé');
      expect(mockAuth.getUser).toHaveBeenCalled();

      // Verify Mistral API was NOT called (request rejected before generation)
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should prevent IDOR attack - user cannot generate exercises for another user', async () => {
      const attackerUserId = 'attacker-123';
      const victimUserId = 'victim-456';

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

      // Attacker tries to generate exercise for victim
      const request = new NextRequest('http://localhost:3000/api/exercise/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capsuleTitle: 'Malicious Exercise',
          concepts: ['malicious'],
          userLevel: 'advanced',
          userId: victimUserId, // Forged userId
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Accès refusé');

      // Verify exercise was NOT generated or saved
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Successful Authorization', () => {
    it('should return 200 when userId matches authenticated user', async () => {
      const userId = 'test-user-123';

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

      // Mock Mistral API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '**Exercice Test**\n\nVoici un exercice...',
              },
            },
          ],
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/exercise/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capsuleTitle: 'Test Capsule',
          concepts: ['concept1', 'concept2'],
          userLevel: 'intermediate',
          userId: userId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBeDefined();
      expect(data.exerciseId).toBeDefined();
      expect(mockAuth.getUser).toHaveBeenCalled();

      // Verify Mistral API was called
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.mistral.ai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
        })
      );

      // Verify exercise was saved with correct userId
      expect(mockSupabase.from).toHaveBeenCalledWith('generated_exercises');
    });

    it('should only save exercise for the authenticated user', async () => {
      const authenticatedUserId = 'auth-user-789';

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

      // Mock Mistral API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Exercise content',
              },
            },
          ],
        }),
      });

      const mockInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'new-exercise-id', user_id: authenticatedUserId },
          }),
        })),
      }));

      mockSupabase.from = jest.fn(() => ({
        insert: mockInsert,
      }));

      const request = new NextRequest('http://localhost:3000/api/exercise/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capsuleTitle: 'Test',
          concepts: ['test'],
          userLevel: 'beginner',
          userId: authenticatedUserId,
          capsuleId: 'capsule-123',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify exercise was saved with authenticated user's ID
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: authenticatedUserId,
          capsule_id: 'capsule-123',
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle Mistral API error gracefully', async () => {
      const userId = 'test-user-123';

      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock Mistral API error
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'API Error',
      });

      const request = new NextRequest('http://localhost:3000/api/exercise/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capsuleTitle: 'Test',
          concepts: ['test'],
          userLevel: 'beginner',
          userId: userId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erreur lors de la génération');
    });

    it('should handle all user levels correctly', async () => {
      const userId = 'test-user-123';
      const userLevels = ['beginner', 'intermediate', 'advanced'];

      mockAuth.getUser.mockResolvedValue({
        data: {
          user: { id: userId, email: 'test@example.com' },
        },
        error: null,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Exercise' } }],
        }),
      });

      for (const level of userLevels) {
        const request = new NextRequest('http://localhost:3000/api/exercise/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            capsuleTitle: 'Test',
            concepts: ['test'],
            userLevel: level,
            userId: userId,
          }),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });
  });
});
