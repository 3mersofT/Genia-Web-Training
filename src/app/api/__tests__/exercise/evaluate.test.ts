/**
 * @jest-environment node
 *
 * Unit Tests for /api/exercise/evaluate Authentication
 *
 * Tests verify that the exercise evaluation API route enforces proper authentication and authorization:
 * 1. Returns 401 when user is not authenticated
 * 2. Returns 403 when userId in request body doesn't match authenticated user
 * 3. Returns 400 when required parameters are missing
 * 4. Returns 200 when userId matches authenticated user
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/exercise/evaluate/route';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock fetch for Mistral API calls
global.fetch = jest.fn();

describe('/api/exercise/evaluate - Authentication Tests', () => {
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
        update: jest.fn(() => ({
          eq: jest.fn(),
        })),
        upsert: jest.fn(),
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

      const request = new NextRequest('http://localhost:3000/api/exercise/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: 'exercise-123',
          userResponse: 'My answer',
          expectedCriteria: ['criterion1', 'criterion2'],
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

      const request = new NextRequest('http://localhost:3000/api/exercise/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userResponse: 'Answer',
          expectedCriteria: ['test'],
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

      const request = new NextRequest('http://localhost:3000/api/exercise/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userResponse: 'My answer',
          // Missing expectedCriteria and userId
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

      const request = new NextRequest('http://localhost:3000/api/exercise/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: 'exercise-123',
          userResponse: 'My answer',
          expectedCriteria: ['criterion1'],
          userId: requestedUserId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Accès refusé');
      expect(mockAuth.getUser).toHaveBeenCalled();

      // Verify Mistral API was NOT called (request rejected before evaluation)
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should prevent IDOR attack - user cannot submit evaluation for another user', async () => {
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

      // Attacker tries to submit evaluation for victim
      const request = new NextRequest('http://localhost:3000/api/exercise/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: 'victim-exercise-123',
          userResponse: 'Fake answer',
          expectedCriteria: ['test'],
          userId: victimUserId, // Forged userId
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Accès refusé');

      // Verify evaluation was NOT performed or saved
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should prevent progress manipulation - attacker cannot mark victim capsule as complete', async () => {
      const attackerUserId = 'attacker-789';
      const victimUserId = 'victim-012';
      const victimCapsuleId = 'victim-capsule-456';

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

      // Attacker tries to complete victim's capsule
      const request = new NextRequest('http://localhost:3000/api/exercise/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userResponse: 'Perfect answer',
          expectedCriteria: ['all'],
          userId: victimUserId, // Forged userId
          capsuleId: victimCapsuleId,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);

      // Verify victim's progress was NOT updated
      expect(mockSupabase.from).not.toHaveBeenCalledWith('user_progress');
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
                content: '**Score : 85/100** 🎯\n\nExcellent travail!',
              },
            },
          ],
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/exercise/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: 'exercise-123',
          userResponse: 'My detailed answer',
          expectedCriteria: ['criterion1', 'criterion2'],
          userId: userId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.score).toBeDefined();
      expect(data.feedback).toBeDefined();
      expect(mockAuth.getUser).toHaveBeenCalled();

      // Verify Mistral API was called
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.mistral.ai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should update progress only for authenticated user when score >= 70', async () => {
      const authenticatedUserId = 'auth-user-789';
      const capsuleId = 'capsule-123';

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

      // Mock Mistral API response with high score
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '**Score : 90/100** 🎯\nParfait!',
              },
            },
          ],
        }),
      });

      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(),
      }));

      const mockUpsert = jest.fn();

      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'generated_exercises') {
          return { update: mockUpdate };
        }
        if (table === 'user_progress') {
          return { upsert: mockUpsert };
        }
        return {};
      });

      const request = new NextRequest('http://localhost:3000/api/exercise/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: 'exercise-456',
          userResponse: 'Excellent answer',
          expectedCriteria: ['test'],
          userId: authenticatedUserId,
          capsuleId: capsuleId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.score).toBe(90);

      // Verify progress was updated with authenticated user's ID
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: authenticatedUserId,
          capsule_id: capsuleId,
          status: 'completed',
        }),
        { onConflict: 'user_id,capsule_id' }
      );
    });

    it('should NOT update progress when score < 70', async () => {
      const userId = 'test-user-123';

      mockAuth.getUser.mockResolvedValue({
        data: {
          user: { id: userId, email: 'test@example.com' },
        },
        error: null,
      });

      // Mock Mistral API response with low score
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '**Score : 55/100** 🎯\nContinue tes efforts!',
              },
            },
          ],
        }),
      });

      const mockUpsert = jest.fn();

      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'generated_exercises') {
          return {
            update: jest.fn(() => ({
              eq: jest.fn(),
            })),
          };
        }
        if (table === 'user_progress') {
          return { upsert: mockUpsert };
        }
        return {};
      });

      const request = new NextRequest('http://localhost:3000/api/exercise/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: 'exercise-789',
          userResponse: 'Incomplete answer',
          expectedCriteria: ['test'],
          userId: userId,
          capsuleId: 'capsule-456',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.score).toBe(55);

      // Verify progress was NOT updated (score < 70)
      expect(mockUpsert).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle Mistral API error gracefully', async () => {
      const userId = 'test-user-123';

      mockAuth.getUser.mockResolvedValue({
        data: {
          user: { id: userId, email: 'test@example.com' },
        },
        error: null,
      });

      // Mock Mistral API error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      const request = new NextRequest('http://localhost:3000/api/exercise/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userResponse: 'Answer',
          expectedCriteria: ['test'],
          userId: userId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Erreur lors de l'évaluation");
    });

    it('should handle missing score in feedback gracefully', async () => {
      const userId = 'test-user-123';

      mockAuth.getUser.mockResolvedValue({
        data: {
          user: { id: userId, email: 'test@example.com' },
        },
        error: null,
      });

      // Mock Mistral response without score
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Feedback without score format',
              },
            },
          ],
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/exercise/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userResponse: 'Answer',
          expectedCriteria: ['test'],
          userId: userId,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should default to 70 when score can't be extracted
      expect(data.score).toBe(70);
    });
  });
});
