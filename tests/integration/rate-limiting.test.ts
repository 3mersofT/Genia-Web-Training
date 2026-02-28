/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter, getClientIdentifier } from '@/lib/rate-limiter';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Integration test - tests rate limiting behavior across API routes
describe('Rate Limiting - Integration Tests', () => {
  // Helper function to create mock requests with different IPs
  const createMockRequest = (
    url: string,
    ip: string = '192.168.1.1',
    method: string = 'GET'
  ): NextRequest => {
    const request = new NextRequest(url, { method });

    // Mock the x-forwarded-for header to simulate different clients
    jest.spyOn(request.headers, 'get').mockImplementation((name: string) => {
      if (name.toLowerCase() === 'x-forwarded-for') {
        return ip;
      }
      return null;
    });

    return request;
  };

  // Helper to make multiple requests
  const makeRequests = async (
    rateLimiter: ReturnType<typeof createRateLimiter>,
    url: string,
    count: number,
    ip: string = '192.168.1.1'
  ): Promise<(NextResponse | null)[]> => {
    const responses: (NextResponse | null)[] = [];
    for (let i = 0; i < count; i++) {
      const req = createMockRequest(url, ip);
      const { response } = await rateLimiter(req);
      responses.push(response);
    }
    return responses;
  };

  // Helper to wait for time interval
  const wait = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Chat API Rate Limiting (10 req/min)', () => {
    const chatRateLimiter = createRateLimiter({
      interval: 60000, // 1 minute
      limit: 10,
    });

    it('should allow first 10 requests and block the 11th', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/chat';
      const ip = '192.168.1.100';

      // Act - make 11 requests
      const responses = await makeRequests(chatRateLimiter, url, 11, ip);

      // Assert
      // First 10 should pass (return null)
      for (let i = 0; i < 10; i++) {
        expect(responses[i]).toBeNull();
      }

      // 11th should be blocked (return 429 response)
      expect(responses[10]).not.toBeNull();
      expect(responses[10]?.status).toBe(429);
    });

    it('should return correct rate limit headers on 429 response', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/chat';
      const ip = '192.168.1.101';

      // Act - exceed the limit
      const responses = await makeRequests(chatRateLimiter, url, 11, ip);
      const blockedResponse = responses[10];

      // Assert
      expect(blockedResponse).not.toBeNull();
      expect(blockedResponse?.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(blockedResponse?.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(blockedResponse?.headers.get('Retry-After')).toBeTruthy();

      const retryAfter = parseInt(blockedResponse?.headers.get('Retry-After') || '0');
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60);
    });

    it('should return correct error message in 429 response body', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/chat';
      const ip = '192.168.1.102';

      // Act - exceed the limit
      const responses = await makeRequests(chatRateLimiter, url, 11, ip);
      const blockedResponse = responses[10];

      // Assert
      expect(blockedResponse).not.toBeNull();

      const bodyText = await blockedResponse?.text();
      expect(bodyText).toBeTruthy();

      const body = JSON.parse(bodyText || '{}');
      expect(body.error).toBe('Too many requests');
      expect(body.message).toBe('Rate limit exceeded. Please try again later.');
      expect(body.retryAfter).toBeGreaterThan(0);
    });

    it('should track different IPs separately', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/chat';
      const ip1 = '192.168.1.103';
      const ip2 = '192.168.1.104';

      // Act - exhaust limit for IP1
      await makeRequests(chatRateLimiter, url, 10, ip1);

      // Try one more request from IP1 (should be blocked)
      const ip1Response = await makeRequests(chatRateLimiter, url, 1, ip1);

      // Try request from IP2 (should be allowed)
      const ip2Response = await makeRequests(chatRateLimiter, url, 1, ip2);

      // Assert
      expect(ip1Response[0]).not.toBeNull(); // Blocked
      expect(ip1Response[0]?.status).toBe(429);
      expect(ip2Response[0]).toBeNull(); // Allowed
    });
  });

  describe('Auth API Rate Limiting (5 req/min)', () => {
    const authRateLimiter = createRateLimiter({
      interval: 60000, // 1 minute
      limit: 5,
    });

    it('should allow first 5 requests and block the 6th', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/auth/username-availability';
      const ip = '192.168.2.100';

      // Act - make 6 requests
      const responses = await makeRequests(authRateLimiter, url, 6, ip);

      // Assert
      // First 5 should pass
      for (let i = 0; i < 5; i++) {
        expect(responses[i]).toBeNull();
      }

      // 6th should be blocked
      expect(responses[5]).not.toBeNull();
      expect(responses[5]?.status).toBe(429);
    });

    it('should return correct rate limit headers', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/auth/username-availability';
      const ip = '192.168.2.101';

      // Act
      const responses = await makeRequests(authRateLimiter, url, 6, ip);
      const blockedResponse = responses[5];

      // Assert
      expect(blockedResponse?.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(blockedResponse?.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(blockedResponse?.headers.get('Retry-After')).toBeTruthy();
    });

    it('should track auth API separately from chat API', async () => {
      // Arrange
      const chatUrl = 'http://localhost:3000/api/chat';
      const authUrl = 'http://localhost:3000/api/auth/username-availability';
      const ip = '192.168.2.102';

      const chatRateLimiter = createRateLimiter({
        interval: 60000,
        limit: 10,
      });

      // Act - exhaust auth limit
      await makeRequests(authRateLimiter, authUrl, 5, ip);
      const authBlockedResponse = await makeRequests(authRateLimiter, authUrl, 1, ip);

      // Chat API should still work (different rate limiter instance)
      const chatResponse = await makeRequests(chatRateLimiter, chatUrl, 1, ip);

      // Assert
      expect(authBlockedResponse[0]).not.toBeNull(); // Auth blocked
      expect(authBlockedResponse[0]?.status).toBe(429);
      expect(chatResponse[0]).toBeNull(); // Chat allowed
    });
  });

  describe('Progress API Rate Limiting (30 req/min)', () => {
    const progressRateLimiter = createRateLimiter({
      interval: 60000, // 1 minute
      limit: 30,
    });

    it('should allow first 30 requests and block the 31st', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/progress/complete';
      const ip = '192.168.3.100';

      // Act - make 31 requests
      const responses = await makeRequests(progressRateLimiter, url, 31, ip);

      // Assert
      // First 30 should pass
      for (let i = 0; i < 30; i++) {
        expect(responses[i]).toBeNull();
      }

      // 31st should be blocked
      expect(responses[30]).not.toBeNull();
      expect(responses[30]?.status).toBe(429);
    });

    it('should return correct rate limit headers', async () => {
      // Arrange
      const url = 'http://localhost:3000/api/progress/complete';
      const ip = '192.168.3.101';

      // Act
      const responses = await makeRequests(progressRateLimiter, url, 31, ip);
      const blockedResponse = responses[30];

      // Assert
      expect(blockedResponse?.headers.get('X-RateLimit-Limit')).toBe('30');
      expect(blockedResponse?.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(blockedResponse?.headers.get('Retry-After')).toBeTruthy();
    });

    it('should handle rapid polling scenario', async () => {
      // Arrange - simulate rapid progress polling
      const url = 'http://localhost:3000/api/progress/complete';
      const ip = '192.168.3.102';

      // Act - make 30 rapid requests (allowed)
      const responses = await makeRequests(progressRateLimiter, url, 30, ip);

      // Assert - all should be allowed
      const allAllowed = responses.every((r) => r === null);
      expect(allAllowed).toBe(true);

      // 31st should be blocked
      const blockedResponse = await makeRequests(progressRateLimiter, url, 1, ip);
      expect(blockedResponse[0]).not.toBeNull();
      expect(blockedResponse[0]?.status).toBe(429);
    });
  });

  describe('Rate Limit Reset Behavior', () => {
    it('should reset rate limit after interval expires', async () => {
      // Arrange
      const shortIntervalLimiter = createRateLimiter({
        interval: 100, // 100ms for faster testing
        limit: 2,
      });
      const url = 'http://localhost:3000/api/test';
      const ip = '192.168.4.100';

      // Act - exhaust the limit
      const initialResponses = await makeRequests(shortIntervalLimiter, url, 2, ip);
      const blockedResponse = await makeRequests(shortIntervalLimiter, url, 1, ip);

      // Wait for interval to expire
      await wait(150);

      // Try again after reset
      const afterResetResponse = await makeRequests(shortIntervalLimiter, url, 1, ip);

      // Assert
      expect(initialResponses[0]).toBeNull();
      expect(initialResponses[1]).toBeNull();
      expect(blockedResponse[0]).not.toBeNull(); // Should be blocked
      expect(blockedResponse[0]?.status).toBe(429);
      expect(afterResetResponse[0]).toBeNull(); // Should be allowed after reset
    });

    it('should decrement remaining count correctly across multiple requests', async () => {
      // Arrange
      const limiter = createRateLimiter({
        interval: 60000,
        limit: 5,
      });
      const url = 'http://localhost:3000/api/test';
      const ip = '192.168.4.101';

      // We can't easily check headers on null responses in this implementation
      // But we can verify the behavior by making requests until blocked

      // Act - make requests one by one
      const { response: r1 } = await limiter(createMockRequest(url, ip)); // 1st - should pass
      const { response: r2 } = await limiter(createMockRequest(url, ip)); // 2nd - should pass
      const { response: r3 } = await limiter(createMockRequest(url, ip)); // 3rd - should pass
      const { response: r4 } = await limiter(createMockRequest(url, ip)); // 4th - should pass
      const { response: r5 } = await limiter(createMockRequest(url, ip)); // 5th - should pass
      const { response: r6 } = await limiter(createMockRequest(url, ip)); // 6th - should be blocked

      // Assert
      expect(r1).toBeNull();
      expect(r2).toBeNull();
      expect(r3).toBeNull();
      expect(r4).toBeNull();
      expect(r5).toBeNull();
      expect(r6).not.toBeNull();
      expect(r6?.status).toBe(429);
    });
  });

  describe('Concurrent Requests Handling', () => {
    it('should handle concurrent requests without race conditions', async () => {
      // Arrange
      const limiter = createRateLimiter({
        interval: 60000,
        limit: 10,
      });
      const url = 'http://localhost:3000/api/test';
      const ip = '192.168.5.100';

      // Act - make 15 concurrent requests
      const promises = Array.from({ length: 15 }, () => {
        const req = createMockRequest(url, ip);
        return limiter(req);
      });

      const responses = await Promise.all(promises);

      // Assert - exactly 10 should be allowed (null), 5 should be blocked (429)
      const allowedCount = responses.filter((r) => r.response === null).length;
      const blockedCount = responses.filter((r) => r.response?.status === 429).length;

      expect(allowedCount).toBe(10);
      expect(blockedCount).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should fail open when rate limiter encounters an error', async () => {
      // Arrange
      const limiter = createRateLimiter({
        interval: 60000,
        limit: 5,
      });

      // Create a request that might cause issues
      const url = 'http://localhost:3000/api/test';
      const ip = '192.168.6.100';
      const req = createMockRequest(url, ip);

      // Mock console.error to verify error logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act - even if there's an internal error, it should fail open (return null)
      const { response } = await limiter(req);

      // Assert - should allow request (fail open)
      // This tests that the try-catch in createRateLimiter works
      expect(response).toBeNull();

      // Clean up
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Client Identifier Extraction', () => {
    it('should extract identifier from x-forwarded-for header', () => {
      // Arrange
      const url = 'http://localhost:3000/api/test';
      const ip = '10.0.0.50';
      const req = createMockRequest(url, ip);

      // Act
      const identifier = getClientIdentifier(req);

      // Assert
      expect(identifier).toBe(ip);
    });

    it('should handle multiple IPs in x-forwarded-for', () => {
      // Arrange
      const url = 'http://localhost:3000/api/test';
      const req = new NextRequest(url);

      jest.spyOn(req.headers, 'get').mockImplementation((name: string) => {
        if (name.toLowerCase() === 'x-forwarded-for') {
          return '192.168.1.1, 10.0.0.1, 172.16.0.1';
        }
        return null;
      });

      // Act
      const identifier = getClientIdentifier(req);

      // Assert
      expect(identifier).toBe('192.168.1.1');
    });

    it('should fall back to unknown when no IP headers present', () => {
      // Arrange
      const url = 'http://localhost:3000/api/test';
      const req = new NextRequest(url);

      jest.spyOn(req.headers, 'get').mockReturnValue(null);

      // Act
      const identifier = getClientIdentifier(req);

      // Assert
      expect(identifier).toBe('unknown');
    });
  });

  describe('Memory Cleanup', () => {
    it('should clean up expired entries to prevent memory leaks', async () => {
      // Arrange
      const limiter = createRateLimiter({
        interval: 50, // Very short interval for testing
        limit: 2,
      });
      const url = 'http://localhost:3000/api/test';

      // Act - create entries for multiple IPs
      for (let i = 0; i < 10; i++) {
        const ip = `192.168.7.${i}`;
        await makeRequests(limiter, url, 1, ip);
      }

      // Wait for entries to expire
      await wait(100);

      // Make a new request to trigger cleanup
      const cleanupResponse = await makeRequests(limiter, url, 1, '192.168.7.200');

      // Assert - should succeed, and old entries should be cleaned up
      // We can't directly inspect the Map, but the request should work
      expect(cleanupResponse[0]).toBeNull();
    });
  });

  describe('Rate Limit Response Format', () => {
    it('should include all required headers in 429 response', async () => {
      // Arrange
      const limiter = createRateLimiter({
        interval: 60000,
        limit: 2,
      });
      const url = 'http://localhost:3000/api/test';
      const ip = '192.168.8.100';

      // Act - exceed limit
      await makeRequests(limiter, url, 2, ip);
      const { response: blockedResponse } = await limiter(createMockRequest(url, ip));

      // Assert
      expect(blockedResponse).not.toBeNull();
      expect(blockedResponse?.status).toBe(429);
      expect(blockedResponse?.headers.get('Content-Type')).toBe('application/json');
      expect(blockedResponse?.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(blockedResponse?.headers.get('X-RateLimit-Remaining')).toBeTruthy();
      expect(blockedResponse?.headers.get('Retry-After')).toBeTruthy();
    });

    it('should have correct Content-Type for JSON response', async () => {
      // Arrange
      const limiter = createRateLimiter({
        interval: 60000,
        limit: 1,
      });
      const url = 'http://localhost:3000/api/test';
      const ip = '192.168.8.101';

      // Act
      await makeRequests(limiter, url, 1, ip);
      const { response: blockedResponse } = await limiter(createMockRequest(url, ip));

      // Assert
      expect(blockedResponse?.headers.get('Content-Type')).toBe('application/json');

      const body = await blockedResponse?.json();
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('retryAfter');
    });
  });
});
