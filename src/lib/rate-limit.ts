import { type NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the window
   */
  maxRequests: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  /**
   * Custom error message
   */
  message?: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: This resets on server restart. For production with multiple instances,
// consider using Redis (Upstash) or a database-backed solution.
const requestStore = new Map<string, RequestRecord>();

// Cleanup old entries every 10 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of requestStore.entries()) {
      if (now > record.resetTime) {
        requestStore.delete(key);
      }
    }
  },
  10 * 60 * 1000,
);

/**
 * Get client identifier from request
 * Uses IP address or forwarded IP from proxy
 */
function getClientId(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0] || realIp || "unknown";
  return ip;
}

/**
 * Rate limiting middleware
 * Returns a function that checks rate limits and returns appropriate response
 */
export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest, identifier?: string): NextResponse | null => {
    const clientId = identifier || getClientId(request);
    const now = Date.now();
    const key = `${request.nextUrl.pathname}:${clientId}`;

    const record = requestStore.get(key);

    if (!record || now > record.resetTime) {
      // First request or window has expired
      requestStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null; // Allow request
    }

    if (record.count >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return NextResponse.json(
        {
          error: config.message || "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(record.resetTime).toISOString(),
          },
        },
      );
    }

    // Increment count
    record.count += 1;
    requestStore.set(key, record);

    return null; // Allow request
  };
}

/**
 * Common rate limit configurations
 */
export const rateLimitConfigs = {
  // Strict rate limit for signup (5 requests per hour)
  signup: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many signup attempts. Please try again later.",
  },
  // Login rate limit (10 attempts per 15 minutes)
  login: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Too many login attempts. Please try again later.",
  },
  // General API rate limit (100 requests per minute per user)
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: "API rate limit exceeded. Please slow down.",
  },
} as const;
