/**
 * @jest-environment node
 *
 * Unit Tests for /api/chat/stream
 *
 * Tests verify:
 * 1. Returns 401 when user is not authenticated
 * 2. Returns 400 when validation fails
 * 3. Returns 429 when quota is exceeded
 * 4. Returns SSE stream on success
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chat/stream/route';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock rate-limiter
jest.mock('@/lib/rate-limiter', () => ({
  createRateLimiter: () => async () => ({
    response: null,
    result: { success: true, limit: 100, remaining: 99, reset: Date.now() + 60000 },
  }),
}));

// Mock ai-provider.service
jest.mock('@/lib/ai-provider.service', () => ({
  streamWithFallback: jest.fn(),
}));

describe('/api/chat/stream', () => {
  let mockSupabase: any;
  let mockAuth: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth = {
      getUser: jest.fn(),
    };

    mockSupabase = {
      auth: mockAuth,
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: null }),
              })),
            })),
          })),
        })),
        insert: jest.fn().mockResolvedValue({ data: null }),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({ data: null }),
            })),
          })),
        })),
      })),
    };

    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValue(mockSupabase);
  });

  it('should return 401 when user is not authenticated', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'mistral-medium-3',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 when messages are empty', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [],
        model: 'mistral-medium-3',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 429 when quota is exceeded', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null,
    });

    // Mock quota check: already at limit
    mockSupabase.from = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { request_count: 300 },
              }),
            })),
          })),
        })),
      })),
    }));

    const request = new NextRequest('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'mistral-medium-3',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
  });

  it('should return SSE stream on success', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null,
    });

    // Quota not reached
    mockSupabase.from = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: null }),
            })),
          })),
        })),
      })),
      insert: jest.fn().mockResolvedValue({ data: null }),
    }));

    // Mock stream
    const { streamWithFallback } = require('@/lib/ai-provider.service');
    const encoder = new TextEncoder();
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: 'Hello' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      },
    });
    streamWithFallback.mockResolvedValue({ stream: mockStream, provider: 'mistral' });

    const request = new NextRequest('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'mistral-medium-3',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
  });
});
