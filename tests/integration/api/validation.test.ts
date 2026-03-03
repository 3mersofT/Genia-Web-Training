/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST as chatPost } from '@/app/api/chat/route';
import { POST as progressPost } from '@/app/api/progress/complete/route';
import { POST as adminUsersPost, DELETE as adminUsersDelete } from '@/app/api/admin/users/route';
import { POST as feedbackPost } from '@/app/api/feedback/route';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Mock Supabase auth responses
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(() => ({
      data: { user: { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com' } },
      error: null,
    })),
    admin: {
      createUser: jest.fn(() => ({
        data: { user: { id: '123e4567-e89b-12d3-a456-426614174000' } },
        error: null,
      })),
      deleteUser: jest.fn(() => ({ error: null })),
      listUsers: jest.fn(() => ({ data: { users: [] }, error: null })),
    },
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { role: 'admin' },
          error: null,
        })),
        limit: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      limit: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { request_count: 5, total_tokens: 1000, total_cost: 0.5 },
          error: null,
        })),
      })),
      order: jest.fn(() => ({
        data: [],
        error: null,
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { id: 'conv-123', user_id: '123e4567-e89b-12d3-a456-426614174000' },
          error: null,
        })),
      })),
      data: null,
      error: null,
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: null,
        error: null,
      })),
    })),
  })),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
  createAdminClient: jest.fn(() => mockSupabaseClient),
}));

// Mock rate-limiter to avoid 429 in tests
jest.mock('@/lib/rate-limiter', () => ({
  createRateLimiter: () => async () => ({
    response: null,
    result: { success: true, limit: 100, remaining: 99, reset: Date.now() + 60000 },
  }),
}));

// Mock fetch for external API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        choices: [{ message: { content: 'Test response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      }),
  })
) as jest.Mock;

// Helper function to create mock NextRequest
const createMockRequest = (url: string, options: RequestInit = {}) => {
  return new NextRequest(new Request(`http://localhost:3000${url}`, options));
};

// Integration test - validates API routes use Zod schemas correctly
describe('API Validation Integration Tests', () => {
  describe('Chat API (/api/chat)', () => {
    it('should accept valid chat request', async () => {
      const validPayload = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
        model: 'mistral-medium-3',
        temperature: 0.5,
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(validPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await chatPost(request);
      const data = await response.json();

      // Should not return validation error
      expect(response.status).not.toBe(400);
      expect(data.error).not.toBe('Validation failed');
    });

    it('should reject request with missing messages', async () => {
      const invalidPayload = {
        model: 'mistral-medium-3',
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await chatPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
      expect(data.details.messages).toBeDefined();
    });

    it('should reject request with empty messages array', async () => {
      const invalidPayload = {
        messages: [],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await chatPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should reject request with invalid model', async () => {
      const invalidPayload = {
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'invalid-model',
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await chatPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.model).toBeDefined();
    });

    it('should reject request with invalid message role', async () => {
      const invalidPayload = {
        messages: [{ role: 'invalid', content: 'Hello' }],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await chatPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should reject request with temperature out of range', async () => {
      const invalidPayload = {
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 3.5,
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await chatPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.temperature).toBeDefined();
    });
  });

  describe('Progress API (/api/progress/complete)', () => {
    it('should accept valid progress request', async () => {
      const validPayload = {
        capsuleId: 'capsule-123',
        score: 85,
      };

      const request = createMockRequest('/api/progress/complete', {
        method: 'POST',
        body: JSON.stringify(validPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await progressPost(request);
      const data = await response.json();

      // Should not return validation error
      expect(response.status).not.toBe(400);
      expect(data.error).not.toBe('Invalid request data');
    });

    it('should reject request with missing capsuleId', async () => {
      const invalidPayload = {
        score: 85,
      };

      const request = createMockRequest('/api/progress/complete', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await progressPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
      expect(Array.isArray(data.details)).toBe(true);
    });

    it('should reject request with empty capsuleId', async () => {
      const invalidPayload = {
        capsuleId: '',
        score: 85,
      };

      const request = createMockRequest('/api/progress/complete', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await progressPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('should reject request with score below 0', async () => {
      const invalidPayload = {
        capsuleId: 'capsule-123',
        score: -10,
      };

      const request = createMockRequest('/api/progress/complete', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await progressPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('should reject request with score above 100', async () => {
      const invalidPayload = {
        capsuleId: 'capsule-123',
        score: 150,
      };

      const request = createMockRequest('/api/progress/complete', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await progressPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });
  });

  describe('Admin Users API (/api/admin/users)', () => {
    describe('POST - Create User', () => {
      it('should accept valid user creation request', async () => {
        const validPayload = {
          email: 'newuser@example.com',
          password: 'securepassword123',
          display_name: 'Test User',
          role: 'student',
          username: 'testuser123',
        };

        const request = createMockRequest('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(validPayload),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await adminUsersPost(request);
        const data = await response.json();

        // Should not return validation error (may fail on other checks like auth)
        if (response.status === 400) {
          expect(data.error).not.toBe('Validation failed');
        }
      });

      it('should reject request with missing email', async () => {
        const invalidPayload = {
          password: 'securepassword123',
          display_name: 'Test User',
        };

        const request = createMockRequest('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(invalidPayload),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await adminUsersPost(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(typeof data.error).toBe('string');
        expect(data.error).toContain('email');
      });

      it('should reject request with invalid email format', async () => {
        const invalidPayload = {
          email: 'invalid-email',
          password: 'securepassword123',
          display_name: 'Test User',
        };

        const request = createMockRequest('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(invalidPayload),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await adminUsersPost(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(typeof data.error).toBe('string');
        expect(data.error).toContain('email');
      });

      it('should reject request with short password', async () => {
        const invalidPayload = {
          email: 'newuser@example.com',
          password: '123',
          display_name: 'Test User',
        };

        const request = createMockRequest('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(invalidPayload),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await adminUsersPost(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(typeof data.error).toBe('string');
        expect(data.error).toContain('password');
      });

      it('should reject request with missing display_name', async () => {
        const invalidPayload = {
          email: 'newuser@example.com',
          password: 'securepassword123',
        };

        const request = createMockRequest('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(invalidPayload),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await adminUsersPost(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(typeof data.error).toBe('string');
        expect(data.error).toContain('display_name');
      });

      it('should reject request with invalid role', async () => {
        const invalidPayload = {
          email: 'newuser@example.com',
          password: 'securepassword123',
          display_name: 'Test User',
          role: 'superadmin',
        };

        const request = createMockRequest('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(invalidPayload),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await adminUsersPost(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(typeof data.error).toBe('string');
        expect(data.error).toContain('role');
      });

      it('should reject request with invalid username format', async () => {
        const invalidPayload = {
          email: 'newuser@example.com',
          password: 'securepassword123',
          display_name: 'Test User',
          username: 'user@invalid!',
        };

        const request = createMockRequest('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(invalidPayload),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await adminUsersPost(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(typeof data.error).toBe('string');
        expect(data.error).toContain('username');
      });
    });

    describe('DELETE - Delete User', () => {
      it('should reject request with missing userId', async () => {
        const request = createMockRequest('/api/admin/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await adminUsersDelete(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(typeof data.error).toBe('string');
        expect(data.error).toContain('userId');
      });

      it('should reject request with invalid UUID format', async () => {
        const request = createMockRequest('/api/admin/users?userId=invalid-uuid', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await adminUsersDelete(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(typeof data.error).toBe('string');
        expect(data.error).toContain('userId');
      });

      it('should accept valid UUID', async () => {
        const validUUID = '123e4567-e89b-12d3-a456-426614174000';
        const request = createMockRequest(`/api/admin/users?userId=${validUUID}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await adminUsersDelete(request);
        const data = await response.json();

        // Should not return validation error (may fail on other checks like auth)
        if (response.status === 400) {
          expect(data.error).not.toBe('Validation failed');
        }
      });
    });
  });

  describe('Feedback API (/api/feedback)', () => {
    it('should accept valid feedback request', async () => {
      const validPayload = {
        feedbackType: 'module',
        targetId: 'module-123',
        rating: 4,
        comment: 'Great module!',
        categories: ['content', 'difficulty'],
        isAnonymous: false,
      };

      const request = createMockRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(validPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await feedbackPost(request);
      const data = await response.json();

      // Should not return validation error
      if (response.status === 400) {
        expect(data.error).not.toBe('Invalid request data');
      }
    });

    it('should reject request with invalid feedbackType', async () => {
      const invalidPayload = {
        feedbackType: 'invalid',
        targetId: 'module-123',
        rating: 4,
        categories: ['content'],
      };

      const request = createMockRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await feedbackPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details.feedbackType).toBeDefined();
    });

    it('should reject request with missing targetId', async () => {
      const invalidPayload = {
        feedbackType: 'module',
        rating: 4,
        categories: ['content'],
      };

      const request = createMockRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await feedbackPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details.targetId).toBeDefined();
    });

    it('should reject request with rating below 1', async () => {
      const invalidPayload = {
        feedbackType: 'module',
        targetId: 'module-123',
        rating: 0,
        categories: ['content'],
      };

      const request = createMockRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await feedbackPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details.rating).toBeDefined();
    });

    it('should reject request with rating above 5', async () => {
      const invalidPayload = {
        feedbackType: 'module',
        targetId: 'module-123',
        rating: 10,
        categories: ['content'],
      };

      const request = createMockRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await feedbackPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details.rating).toBeDefined();
    });

    it('should reject request with empty categories array', async () => {
      const invalidPayload = {
        feedbackType: 'module',
        targetId: 'module-123',
        rating: 4,
        categories: [],
      };

      const request = createMockRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await feedbackPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details.categories).toBeDefined();
    });

    it('should reject request with missing categories', async () => {
      const invalidPayload = {
        feedbackType: 'module',
        targetId: 'module-123',
        rating: 4,
      };

      const request = createMockRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await feedbackPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details.categories).toBeDefined();
    });

    it('should reject request with invalid email format', async () => {
      const invalidPayload = {
        feedbackType: 'module',
        targetId: 'module-123',
        rating: 4,
        categories: ['content'],
        userEmail: 'invalid-email',
      };

      const request = createMockRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await feedbackPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details.userEmail).toBeDefined();
    });
  });

  describe('Error Response Format Consistency', () => {
    it('all validation errors should have consistent format with error and details', async () => {
      const testCases = [
        {
          name: 'Chat API',
          request: createMockRequest('/api/chat', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' },
          }),
          handler: chatPost,
          expectedError: 'Validation failed',
        },
        {
          name: 'Progress API',
          request: createMockRequest('/api/progress/complete', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' },
          }),
          handler: progressPost,
          expectedError: 'Invalid request data',
        },
        {
          name: 'Admin Users API',
          request: createMockRequest('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' },
          }),
          handler: adminUsersPost,
          expectedError: null, // Admin routes return custom error strings, not standard format
        },
        {
          name: 'Feedback API',
          request: createMockRequest('/api/feedback', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' },
          }),
          handler: feedbackPost,
          expectedError: 'Invalid request data',
        },
      ];

      for (const testCase of testCases) {
        const response = await testCase.handler(testCase.request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toHaveProperty('error');

        if (testCase.expectedError !== null) {
          expect(data.error).toBe(testCase.expectedError);
          expect(data).toHaveProperty('details');
          expect(data.details).toBeDefined();
        } else {
          // Admin routes return custom error strings
          expect(typeof data.error).toBe('string');
        }
      }
    });
  });

  describe('Schema Validation Behavior', () => {
    it('should validate all required fields are present', async () => {
      const invalidPayload = {};

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await chatPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
      expect(data.details.messages).toBeDefined();
    });

    it('should validate data types are correct', async () => {
      const invalidPayload = {
        messages: 'not-an-array',
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await chatPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.messages).toBeDefined();
    });

    it('should validate enum values are within allowed set', async () => {
      const invalidPayload = {
        feedbackType: 'invalid-type',
        targetId: 'test-123',
        rating: 4,
        categories: ['content'],
      };

      const request = createMockRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await feedbackPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details.feedbackType).toBeDefined();
    });

    it('should validate numeric ranges are enforced', async () => {
      const invalidPayload = {
        capsuleId: 'capsule-123',
        score: 200,
      };

      const request = createMockRequest('/api/progress/complete', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await progressPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('should validate string formats (email, UUID)', async () => {
      const invalidPayload = {
        email: 'not-an-email',
        password: 'password123',
        display_name: 'Test User',
      };

      const request = createMockRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await adminUsersPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(typeof data.error).toBe('string');
      expect(data.error).toContain('email');
    });

    it('should validate array constraints (min length)', async () => {
      const invalidPayload = {
        messages: [],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await chatPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.messages).toBeDefined();
    });
  });
});
