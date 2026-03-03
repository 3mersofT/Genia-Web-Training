/**
 * @jest-environment node
 *
 * Unit Tests for /api/chat/feedback
 *
 * Tests verify:
 * 1. Returns 401 when user is not authenticated
 * 2. Returns 400 when validation fails
 * 3. Returns 200 and upserts feedback correctly
 * 4. Returns 500 on database error
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chat/feedback/route';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('/api/chat/feedback', () => {
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
        upsert: jest.fn().mockResolvedValue({ error: null }),
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

    const request = new NextRequest('http://localhost:3000/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: 'msg-123',
        feedback: 'up',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should return 400 when messageId is missing', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedback: 'up',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 when feedback value is invalid', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: 'msg-123',
        feedback: 'invalid',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should return 200 and upsert feedback for thumbs up', async () => {
    const userId = 'user-123';
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: userId, email: 'test@test.com' } },
      error: null,
    });

    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    mockSupabase.from = jest.fn(() => ({
      upsert: mockUpsert,
    }));

    const request = new NextRequest('http://localhost:3000/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: 'msg-123',
        feedback: 'up',
        conversationId: 'conv-456',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('message_feedback');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        message_id: 'msg-123',
        feedback: 'up',
        conversation_id: 'conv-456',
      }),
      { onConflict: 'user_id,message_id' }
    );
  });

  it('should return 200 for thumbs down feedback', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null,
    });

    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    mockSupabase.from = jest.fn(() => ({
      upsert: mockUpsert,
    }));

    const request = new NextRequest('http://localhost:3000/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: 'msg-789',
        feedback: 'down',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        feedback: 'down',
        conversation_id: null,
      }),
      { onConflict: 'user_id,message_id' }
    );
  });

  it('should return 500 on database error', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null,
    });

    mockSupabase.from = jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({
        error: { message: 'Database error' },
      }),
    }));

    const request = new NextRequest('http://localhost:3000/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: 'msg-123',
        feedback: 'up',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
