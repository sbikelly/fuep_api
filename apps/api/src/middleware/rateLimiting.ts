import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Store for tracking rate limit violations for monitoring
export const rateLimitViolations = new Map<string, number>();

// Helper function to get client IP for rate limiting
const getClientIP = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

// Custom handler for rate limit exceeded
const rateLimitHandler = (req: Request, res: Response) => {
  const clientIP = getClientIP(req);
  const current = rateLimitViolations.get(clientIP) || 0;
  rateLimitViolations.set(clientIP, current + 1);

  console.warn(`[RATE_LIMIT] IP ${clientIP} exceeded rate limit on ${req.path}`, {
    ip: clientIP,
    path: req.path,
    method: req.method,
    violations: current + 1,
    timestamp: new Date().toISOString(),
  });

  res.status(429).json({
    success: false,
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil((req as any).rateLimit?.resetTime || 60),
    timestamp: new Date().toISOString(),
  });
};

// General rate limiting - 100 requests per 15 minutes
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: rateLimitHandler,
  keyGenerator: getClientIP,
});

// Authentication endpoints - stricter limits
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login attempts per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Please wait before attempting to login again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getClientIP,
});

// Admin endpoints - moderate limits
export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // higher limit for admin operations
  message: {
    success: false,
    error: 'Too many admin requests',
    message: 'Admin rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getClientIP,
});

// Candidate endpoints - standard limits
export const candidateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // moderate limit for candidate operations
  message: {
    success: false,
    error: 'Too many candidate requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getClientIP,
});

// Payment endpoints - very strict limits
export const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // very strict limit for payment operations
  message: {
    success: false,
    error: 'Too many payment requests',
    message: 'Payment rate limit exceeded. Please wait before making another payment request.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getClientIP,
});

// Upload endpoints - moderate limits due to file processing
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit file uploads
  message: {
    success: false,
    error: 'Too many upload requests',
    message: 'Upload rate limit exceeded. Please wait before uploading more files.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getClientIP,
});

// Progressive delay for repeated requests (speed limiting)
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per windowMs without delay
  delayMs: (hits) => hits * 100, // add 100ms delay per request after delayAfter
  maxDelayMs: 5000, // max delay of 5 seconds
  keyGenerator: getClientIP,
});

// Rate limit for health checks and monitoring
export const healthCheckRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 health checks per minute
  message: {
    success: false,
    error: 'Too many health check requests',
  },
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: getClientIP,
});

// Function to get rate limit statistics
export const getRateLimitStats = () => {
  const stats = {
    totalViolations: Array.from(rateLimitViolations.values()).reduce(
      (sum, count) => sum + count,
      0
    ),
    violationsByIP: Object.fromEntries(rateLimitViolations),
    timestamp: new Date().toISOString(),
  };

  return stats;
};

// Function to clear old violation records (for cleanup)
export const clearOldViolations = () => {
  rateLimitViolations.clear();
  console.log('[RATE_LIMIT] Cleared violation records');
};
