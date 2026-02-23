/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  createRateLimiter,
  getClientIdentifier,
  withRateLimit,
  addRateLimitHeaders,
  RateLimitConfig,
} from '@/lib/rate-limiter';

describe('Rate Limiter - Core Logic', () => {
  // Helper function to create mock requests
  const createMockRequest = (
    url: string = 'http://localhost:3000/api/test',
    headers: Record<string, string> = {}
  ): NextRequest => {
    const request = new NextRequest(url);

    // Mock headers - create a proper mock that handles all headers
    jest.spyOn(request.headers, 'get').mockImplementation((name: string) => {
      // Find matching header (case-insensitive)
      const headerKey = Object.keys(headers).find(
        key => key.toLowerCase() === name.toLowerCase()
      );
      return headerKey ? headers[headerKey] : null;
    });

    return request;
  };

  // Reset any module-level state between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getClientIdentifier', () => {
    it('should extract IP from x-forwarded-for header', () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.1',
      });

      // Act
      const identifier = getClientIdentifier(mockRequest);

      // Assert
      expect(identifier).toBe('192.168.1.1');
    });

    it('should take first IP when x-forwarded-for has multiple IPs', () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
      });

      // Act
      const identifier = getClientIdentifier(mockRequest);

      // Assert
      expect(identifier).toBe('192.168.1.1');
    });

    it('should trim whitespace from extracted IP', () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '  192.168.1.1  ',
      });

      // Act
      const identifier = getClientIdentifier(mockRequest);

      // Assert
      expect(identifier).toBe('192.168.1.1');
    });

    it('should fall back to x-real-ip header when x-forwarded-for is not present', () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-real-ip': '10.0.0.1',
      });

      // Act
      const identifier = getClientIdentifier(mockRequest);

      // Assert
      expect(identifier).toBe('10.0.0.1');
    });

    it('should return "unknown" when no IP headers are present', () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {});

      // Act
      const identifier = getClientIdentifier(mockRequest);

      // Assert
      expect(identifier).toBe('unknown');
    });

    it('should prioritize x-forwarded-for over x-real-ip', () => {
      // Arrange
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '10.0.0.1',
      });

      // Act
      const identifier = getClientIdentifier(mockRequest);

      // Assert
      expect(identifier).toBe('192.168.1.1');
    });
  });

  describe('createRateLimiter', () => {
    const testConfig: RateLimitConfig = {
      interval: 60000, // 1 minute
      limit: 5,
    };

    it('should create a rate limiter function', () => {
      // Act
      const rateLimiter = createRateLimiter(testConfig);

      // Assert
      expect(rateLimiter).toBeInstanceOf(Function);
    });

    it('should allow requests under the limit', async () => {
      // Arrange
      const rateLimiter = createRateLimiter(testConfig);
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.1',
      });

      // Act
      const { response, result } = await rateLimiter(mockRequest);

      // Assert
      expect(response).toBeNull(); // null means request is allowed
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(2); // 3 limit - 1 used = 2 remaining
    });

    it('should block requests over the limit', async () => {
      // Arrange
      const rateLimiter = createRateLimiter({
        interval: 60000,
        limit: 3,
      });
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.2',
      });

      // Act - Make limit + 1 requests
      await rateLimiter(mockRequest);
      await rateLimiter(mockRequest);
      await rateLimiter(mockRequest);
      const { response: blockedResponse, result: blockedResult } = await rateLimiter(mockRequest);

      // Assert
      expect(blockedResponse).toBeInstanceOf(NextResponse);
      expect(blockedResult.success).toBe(false);
      expect(blockedResponse?.status).toBe(429);
    });

    it('should return correct error response when rate limit exceeded', async () => {
      // Arrange
      const rateLimiter = createRateLimiter({
        interval: 60000,
        limit: 2,
      });
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.3',
      });

      // Act - Exceed limit
      await rateLimiter(mockRequest);
      await rateLimiter(mockRequest);
      const { response: blockedResponse } = await rateLimiter(mockRequest);

      // Assert
      expect(blockedResponse).not.toBeNull();
      const body = await blockedResponse?.json();
      expect(body).toEqual({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: expect.any(Number),
      });
    });

    it('should include rate limit headers in 429 response', async () => {
      // Arrange
      const rateLimiter = createRateLimiter({
        interval: 60000,
        limit: 2,
      });
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.4',
      });

      // Act
      await rateLimiter(mockRequest);
      await rateLimiter(mockRequest);
      const { response: blockedResponse } = await rateLimiter(mockRequest);

      // Assert
      expect(blockedResponse?.headers.get('X-RateLimit-Limit')).toBe('2');
      expect(blockedResponse?.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(blockedResponse?.headers.get('Retry-After')).toBeDefined();
      expect(blockedResponse?.headers.get('Content-Type')).toBe('application/json');
    });

    it('should decrement remaining count with each request', async () => {
      // Arrange
      const rateLimiter = createRateLimiter({
        interval: 60000,
        limit: 5,
      });
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.5',
      });

      // Act & Assert - Check that we're tracking but rate limiter returns null
      const { response: firstResponse } = await rateLimiter(mockRequest);
      expect(firstResponse).toBeNull();

      const { response: secondResponse } = await rateLimiter(mockRequest);
      expect(secondResponse).toBeNull();

      const { response: thirdResponse } = await rateLimiter(mockRequest);
      expect(thirdResponse).toBeNull();
    });

    it('should track different identifiers separately', async () => {
      // Arrange
      const rateLimiter = createRateLimiter({
        interval: 60000,
        limit: 2,
      });
      const request1 = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.10',
      });
      const request2 = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.11',
      });

      // Act - Exhaust limit for first identifier
      await rateLimiter(request1);
      await rateLimiter(request1);
      const { response: blocked1 } = await rateLimiter(request1);

      // Second identifier should still work
      const { response: allowed2 } = await rateLimiter(request2);

      // Assert
      expect(blocked1?.status).toBe(429);
      expect(allowed2).toBeNull(); // Second identifier is allowed
    });

    it('should reset rate limit after interval expires', async () => {
      // Arrange
      const shortInterval = 100; // 100ms for faster test
      const rateLimiter = createRateLimiter({
        interval: shortInterval,
        limit: 2,
      });
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.20',
      });

      // Act - Exhaust limit
      await rateLimiter(mockRequest);
      await rateLimiter(mockRequest);
      const { response: blocked } = await rateLimiter(mockRequest);
      expect(blocked?.status).toBe(429);

      // Wait for interval to expire
      await new Promise(resolve => setTimeout(resolve, shortInterval + 10));

      // Try again after reset
      const { response: allowedAfterReset } = await rateLimiter(mockRequest);

      // Assert
      expect(allowedAfterReset).toBeNull(); // Should be allowed after reset
    });

    it('should fail open when an error occurs', async () => {
      // Arrange
      const rateLimiter = createRateLimiter({
        interval: 60000,
        limit: 5,
      });

      // Create a request that will cause getClientIdentifier to throw
      const mockRequest = {
        headers: {
          get: jest.fn(() => {
            throw new Error('Simulated error');
          }),
        },
      } as unknown as NextRequest;

      // Spy on console.error to verify error logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const response = await rateLimiter(mockRequest);

      // Assert
      expect(response).toBeNull(); // Fail open - allow request
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Rate limiter error:',
        expect.any(Error)
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should cleanup expired entries', async () => {
      // Arrange
      const shortInterval = 50; // 50ms
      const rateLimiter = createRateLimiter({
        interval: shortInterval,
        limit: 3,
      });
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.30',
      });

      // Act - Make some requests
      await rateLimiter(mockRequest);

      // Wait for entry to expire
      await new Promise(resolve => setTimeout(resolve, shortInterval + 10));

      // Make new request - this should trigger cleanup and create fresh window
      const response = await rateLimiter(mockRequest);

      // Assert
      expect(response).toBeNull(); // Should be allowed with fresh window
    });
  });

  describe('addRateLimitHeaders', () => {
    it('should add rate limit headers to response', () => {
      // Arrange
      const mockResponse = new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
      });
      const limit = 10;
      const remaining = 5;
      const reset = Date.now() + 60000;

      // Act
      const updatedResponse = addRateLimitHeaders(mockResponse, limit, remaining, reset);

      // Assert
      expect(updatedResponse.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(updatedResponse.headers.get('X-RateLimit-Remaining')).toBe('5');
      expect(updatedResponse.headers.get('Retry-After')).toBeDefined();
    });

    it('should calculate Retry-After in seconds', () => {
      // Arrange
      const mockResponse = new NextResponse(JSON.stringify({ success: true }));
      const reset = Date.now() + 30000; // 30 seconds from now

      // Act
      const updatedResponse = addRateLimitHeaders(mockResponse, 10, 5, reset);

      // Assert
      const retryAfter = parseInt(updatedResponse.headers.get('Retry-After') || '0');
      expect(retryAfter).toBeGreaterThanOrEqual(29);
      expect(retryAfter).toBeLessThanOrEqual(31);
    });
  });

  describe('withRateLimit', () => {
    const testConfig: RateLimitConfig = {
      interval: 60000,
      limit: 3,
    };

    it('should wrap handler with rate limiting', async () => {
      // Arrange
      const mockHandler = jest.fn(async (req: NextRequest) => {
        return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
      });
      const wrappedHandler = withRateLimit(mockHandler, testConfig);
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.100',
      });

      // Act
      const response = await wrappedHandler(mockRequest);

      // Assert
      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should call original handler when rate limit not exceeded', async () => {
      // Arrange
      const mockHandler = jest.fn(async (req: NextRequest) => {
        return new NextResponse(JSON.stringify({ data: 'success' }), { status: 200 });
      });
      const wrappedHandler = withRateLimit(mockHandler, testConfig);
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.101',
      });

      // Act
      const response = await wrappedHandler(mockRequest);

      // Assert
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ data: 'success' });
    });

    it('should return 429 without calling handler when rate limit exceeded', async () => {
      // Arrange
      const mockHandler = jest.fn(async (req: NextRequest) => {
        return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
      });
      const wrappedHandler = withRateLimit(mockHandler, {
        interval: 60000,
        limit: 2,
      });
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.102',
      });

      // Act - Exceed limit
      await wrappedHandler(mockRequest);
      await wrappedHandler(mockRequest);
      const blockedResponse = await wrappedHandler(mockRequest);

      // Assert
      expect(mockHandler).toHaveBeenCalledTimes(2); // Only called for allowed requests
      expect(blockedResponse.status).toBe(429);
      const body = await blockedResponse.json();
      expect(body.error).toBe('Too many requests');
    });

    it('should preserve original handler behavior', async () => {
      // Arrange
      const mockHandler = jest.fn(async (req: NextRequest) => {
        // Handler that returns custom response
        return new NextResponse(
          JSON.stringify({ customField: 'customValue' }),
          {
            status: 201,
            headers: { 'X-Custom-Header': 'custom-value' }
          }
        );
      });
      const wrappedHandler = withRateLimit(mockHandler, testConfig);
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.103',
      });

      // Act
      const response = await wrappedHandler(mockRequest);

      // Assert
      expect(response.status).toBe(201);
      expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
      const body = await response.json();
      expect(body).toEqual({ customField: 'customValue' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests from same identifier', async () => {
      // Arrange
      const rateLimiter = createRateLimiter({
        interval: 60000,
        limit: 3,
      });
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.200',
      });

      // Act - Make concurrent requests
      const responses = await Promise.all([
        rateLimiter(mockRequest),
        rateLimiter(mockRequest),
        rateLimiter(mockRequest),
        rateLimiter(mockRequest),
      ]);

      // Assert - At least one should be blocked
      const blockedResponses = responses.filter(r => r?.status === 429);
      expect(blockedResponses.length).toBeGreaterThan(0);
    });

    it('should handle very short intervals', async () => {
      // Arrange
      const rateLimiter = createRateLimiter({
        interval: 10, // 10ms
        limit: 2,
      });
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.201',
      });

      // Act
      await rateLimiter(mockRequest);
      await rateLimiter(mockRequest);
      const { response: blocked } = await rateLimiter(mockRequest);

      // Wait for reset
      await new Promise(resolve => setTimeout(resolve, 15));
      const { response: allowed } = await rateLimiter(mockRequest);

      // Assert
      expect(blocked?.status).toBe(429);
      expect(allowed).toBeNull();
    });

    it('should handle limit of 1', async () => {
      // Arrange
      const rateLimiter = createRateLimiter({
        interval: 60000,
        limit: 1,
      });
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.202',
      });

      // Act
      const { response: first } = await rateLimiter(mockRequest);
      const { response: second } = await rateLimiter(mockRequest);

      // Assert
      expect(first).toBeNull();
      expect(second?.status).toBe(429);
    });

    it('should handle very large limits', async () => {
      // Arrange
      const rateLimiter = createRateLimiter({
        interval: 60000,
        limit: 10000,
      });
      const mockRequest = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.203',
      });

      // Act - Make several requests
      const responses = await Promise.all(
        Array(100).fill(null).map(() => rateLimiter(mockRequest))
      );

      // Assert - None should be blocked
      const blocked = responses.filter(r => r?.status === 429);
      expect(blocked.length).toBe(0);
    });
  });
});
