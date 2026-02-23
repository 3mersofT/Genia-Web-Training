import { NextRequest, NextResponse } from 'next/server';

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  interval: number;
  /** Maximum number of requests allowed in the interval */
  limit: number;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Maximum requests allowed */
  limit: number;
  /** Remaining requests in current window */
  remaining: number;
  /** Timestamp when the rate limit resets */
  reset: number;
}

/**
 * Storage entry for tracking requests
 */
interface RateLimitStore {
  /** Number of requests made in current window */
  count: number;
  /** Timestamp when the window started */
  windowStart: number;
}

/**
 * Rate limit headers to include in responses
 */
export interface RateLimitHeaders {
  /** Maximum requests allowed */
  'X-RateLimit-Limit': string;
  /** Remaining requests in current window */
  'X-RateLimit-Remaining': string;
  /** Seconds until rate limit resets */
  'Retry-After': string;
}

/**
 * Error response structure when rate limit is exceeded
 */
export interface RateLimitErrorResponse {
  /** Error type */
  error: string;
  /** Human-readable error message */
  message: string;
  /** Seconds until rate limit resets */
  retryAfter: number;
}

/**
 * API route handler function type
 */
export type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Rate limiter middleware function type
 * Returns null if request is allowed, or NextResponse with 429 status if blocked
 */
export type RateLimiterMiddleware = (
  req: NextRequest
) => Promise<NextResponse | null>;

// Global Map to store rate limit data
// Key: identifier (IP address or user ID)
// Value: RateLimitStore
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Extracts client identifier from request
 * Priority: x-forwarded-for header > x-real-ip header > connection remoteAddress
 */
export function getClientIdentifier(req: NextRequest): string {
  // Try x-forwarded-for first (Vercel and most proxies use this)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP if multiple are present
    return forwardedFor.split(',')[0].trim();
  }

  // Try x-real-ip header
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to generic identifier
  return 'unknown';
}

/**
 * Cleans up expired entries from the rate limit store
 * Removes entries older than their configured interval
 */
function cleanupExpiredEntries(interval: number): void {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());

  for (const [key, value] of entries) {
    // If the window has expired, remove the entry
    if (now - value.windowStart > interval) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Checks rate limit for a given identifier
 */
function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const store = rateLimitStore.get(identifier);

  // If no entry exists or window has expired, create new window
  if (!store || now - store.windowStart > config.interval) {
    rateLimitStore.set(identifier, {
      count: 1,
      windowStart: now,
    });

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: now + config.interval,
    };
  }

  // Window is still active
  const newCount = store.count + 1;

  // Check if limit exceeded
  if (newCount > config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: store.windowStart + config.interval,
    };
  }

  // Update count
  store.count = newCount;
  rateLimitStore.set(identifier, store);

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - newCount,
    reset: store.windowStart + config.interval,
  };
}

/**
 * Creates a rate limiter middleware with the specified configuration
 * Returns an async function that can be used to check rate limits
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiterMiddleware {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      // Clean up old entries periodically (every request for simplicity)
      cleanupExpiredEntries(config.interval);

      // Get client identifier
      const identifier = getClientIdentifier(req);

      // Check rate limit
      const result = checkRateLimit(identifier, config);

      // Prepare rate limit headers
      const headers: RateLimitHeaders = {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
      };

      // If rate limit exceeded, return 429 response
      if (!result.success) {
        const errorResponse: RateLimitErrorResponse = {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        };

        return new NextResponse(
          JSON.stringify(errorResponse),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
          }
        );
      }

      // Rate limit not exceeded, return null to indicate request should proceed
      // The headers will need to be added by the calling code
      return null;
    } catch (error) {
      // Fail open: if rate limiter errors, allow the request
      console.error('Rate limiter error:', error);
      return null;
    }
  };
}

/**
 * Helper function to add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set(
    'Retry-After',
    Math.ceil((reset - Date.now()) / 1000).toString()
  );
  return response;
}

/**
 * Wraps an API route handler with rate limiting
 * Returns a new handler that checks rate limits before calling the original handler
 */
export function withRateLimit(
  handler: RouteHandler,
  config: RateLimitConfig
): RouteHandler {
  const rateLimiter = createRateLimiter(config);

  return async (req: NextRequest): Promise<NextResponse> => {
    // Check rate limit
    const rateLimitResponse = await rateLimiter(req);

    // If rate limit exceeded, return the 429 response
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Otherwise, call the original handler
    return handler(req);
  };
}
