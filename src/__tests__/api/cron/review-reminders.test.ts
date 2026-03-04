/**
 * @jest-environment node
 */
import { GET } from '@/app/api/cron/review-reminders/route';
import { NextRequest } from 'next/server';

// Mock email service
jest.mock('@/lib/services/emailService', () => ({
  emailService: {
    sendReviewReminder: jest.fn().mockResolvedValue(true),
  },
}));

// Mock Supabase admin client
const mockFrom = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: jest.fn().mockResolvedValue({
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

const { emailService } = require('@/lib/services/emailService');

function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret) {
    headers['authorization'] = `Bearer ${secret}`;
  }
  return new NextRequest('http://localhost/api/cron/review-reminders', { headers });
}

describe('GET /api/cron/review-reminders', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: 'test-secret', NEXT_PUBLIC_APP_URL: 'https://test.app' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects requests without CRON_SECRET', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('rejects requests with wrong CRON_SECRET', async () => {
    const res = await GET(makeRequest('wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('returns 0 sent when no cards are due', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        lte: () => Promise.resolve({ data: [], error: null }),
      }),
    });

    const res = await GET(makeRequest('test-secret'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(0);
    expect(body.message).toBe('No cards due');
  });

  it('sends reminders for users with due cards', async () => {
    // First call: spaced_repetition_cards
    mockFrom.mockImplementation((table: string) => {
      if (table === 'spaced_repetition_cards') {
        return {
          select: () => ({
            lte: () => Promise.resolve({
              data: [
                { user_id: 'user-1' },
                { user_id: 'user-1' },
                { user_id: 'user-2' },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === 'user_profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [
                { user_id: 'user-1', display_name: 'Alice', email: 'alice@test.com', preferences: {} },
                { user_id: 'user-2', display_name: 'Bob', email: 'bob@test.com', preferences: {} },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === 'notification_preferences') {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [
                { user_id: 'user-1', email_notifications: true },
                { user_id: 'user-2', email_notifications: true },
              ],
              error: null,
            }),
          }),
        };
      }
      return { select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) };
    });

    const res = await GET(makeRequest('test-secret'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sent).toBe(2);
    expect(body.errors).toBe(0);
    expect(emailService.sendReviewReminder).toHaveBeenCalledTimes(2);
    expect(emailService.sendReviewReminder).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'alice@test.com', name: 'Alice', dueCount: 2 })
    );
    expect(emailService.sendReviewReminder).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'bob@test.com', name: 'Bob', dueCount: 1 })
    );
  });

  it('skips users with email notifications disabled', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'spaced_repetition_cards') {
        return {
          select: () => ({
            lte: () => Promise.resolve({
              data: [{ user_id: 'user-1' }],
              error: null,
            }),
          }),
        };
      }
      if (table === 'user_profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{ user_id: 'user-1', display_name: 'Alice', email: 'alice@test.com', preferences: {} }],
              error: null,
            }),
          }),
        };
      }
      if (table === 'notification_preferences') {
        return {
          select: () => ({
            in: () => Promise.resolve({
              data: [{ user_id: 'user-1', email_notifications: false }],
              error: null,
            }),
          }),
        };
      }
      return { select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) };
    });

    const res = await GET(makeRequest('test-secret'));
    const body = await res.json();

    expect(body.sent).toBe(0);
    expect(body.skipped).toBe(1);
    expect(emailService.sendReviewReminder).not.toHaveBeenCalled();
  });
});
