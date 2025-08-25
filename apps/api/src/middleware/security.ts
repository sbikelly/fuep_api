import { NextFunction,Request, Response } from 'express';
import helmet from 'helmet';

// Security configuration for different environments
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Custom security headers middleware
export const customSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Add custom security headers for API
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Rate-Limit-Policy', 'standard');

  // Add cache control headers for sensitive endpoints
  if (req.path.includes('/admin') || req.path.includes('/auth')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  // Add request ID for tracing
  if (!req.headers['x-request-id']) {
    const requestId = generateRequestId();
    res.setHeader('X-Request-ID', requestId);
    (req as any).requestId = requestId;
  }

  next();
};

// Generate a unique request ID
const generateRequestId = (): string => {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Enhanced helmet configuration
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Swagger UI
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com',
      ],
      scriptSrc: [
        "'self'",
        // Only allow specific script sources in production
        ...(isProduction ? [] : ["'unsafe-inline'", "'unsafe-eval'"]), // Dev only
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: [
        "'self'",
        'data:',
        'https:', // Allow HTTPS images
      ],
      connectSrc: [
        "'self'",
        // Add your API domains here
        'https://api.remita.net',
        'https://remitademo.net',
        'https://api.flutterwave.com',
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
    reportOnly: isDevelopment, // Only report violations in development
  },

  // Cross Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disabled for API compatibility

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // Disable X-Powered-By header
  hidePoweredBy: true,

  // IE No Open
  ieNoOpen: true,

  // No Sniff
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-XSS-Protection
  xssFilter: true,
});

// CORS configuration with enhanced security
export const corsConfig = {
  // Allow specific origins only
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:5173', // Vite dev server (alternative)
      'http://localhost:8080', // Docker reverse proxy
      'http://127.0.0.1:8080', // Docker reverse proxy (alternative)
      'http://localhost', // Local development
      'http://127.0.0.1', // Local development (alternative)
      // Production domains
      ...(isProduction
        ? [
            'https://yourdomain.com',
            'https://www.yourdomain.com',
            'https://admin.yourdomain.com',
            // Render.com domains
            /^https:\/\/.*\.onrender\.com$/,
            /^https:\/\/.*\.render\.com$/,
          ]
        : []),
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some((allowed) => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`, {
        origin,
        timestamp: new Date().toISOString(),
        userAgent: 'N/A', // Will be added by middleware if available
      });
      callback(new Error('Not allowed by CORS policy'));
    }
  },

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'X-Request-ID',
    'X-API-Key',
    'Cache-Control',
  ],

  // Exposed headers (what the client can access)
  exposedHeaders: [
    'X-Request-ID',
    'X-API-Version',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
    'X-Rate-Limit-Policy',
  ],

  // Preflight cache duration (24 hours)
  maxAge: 24 * 60 * 60,

  // Handle preflight for all routes
  preflightContinue: false,

  // Success status for preflight
  optionsSuccessStatus: 204,
};

// IP whitelisting middleware for sensitive endpoints
export const createIPWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = getClientIP(req);

    // In development, allow all IPs
    if (isDevelopment) {
      return next();
    }

    if (allowedIPs.includes(clientIP) || allowedIPs.includes('*')) {
      next();
    } else {
      console.warn(`[IP_WHITELIST] Blocked IP: ${clientIP}`, {
        ip: clientIP,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });

      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Your IP address is not authorized to access this resource',
        timestamp: new Date().toISOString(),
      });
    }
  };
};

// Helper function to get client IP
export const getClientIP = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

// Request logging middleware for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const clientIP = getClientIP(req);
  const userAgent = req.get('User-Agent') || 'unknown';
  const requestId = (req as any).requestId || generateRequestId();

  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g, // Directory traversal
    /<script/gi, // XSS attempts
    /union.*select/gi, // SQL injection attempts
    /javascript:/gi, // JavaScript injection
    /vbscript:/gi, // VBScript injection
    /%3cscript/gi, // Encoded XSS
    /eval\(/gi, // Code evaluation attempts
    /expression\(/gi, // CSS expression injection
  ];

  const isSuspicious = suspiciousPatterns.some(
    (pattern) =>
      pattern.test(req.url) ||
      pattern.test(JSON.stringify(req.body || {})) ||
      pattern.test(JSON.stringify(req.query || {}))
  );

  if (isSuspicious) {
    console.warn(`[SECURITY] Suspicious request detected`, {
      requestId,
      ip: clientIP,
      method: req.method,
      path: req.path,
      userAgent,
      query: req.query,
      body: req.body ? '[REDACTED]' : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  // Continue with the request
  next();

  // Log completed request
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    console[logLevel](`[HTTP] ${req.method} ${req.path}`, {
      requestId,
      ip: clientIP,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent,
      suspicious: isSuspicious,
      timestamp: new Date().toISOString(),
    });
  });
};

// API key validation middleware
export const createAPIKeyValidator = (validKeys: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
        message: 'X-API-Key header is required',
        timestamp: new Date().toISOString(),
      });
    }

    if (!validKeys.includes(apiKey)) {
      console.warn(`[API_KEY] Invalid API key attempt`, {
        ip: getClientIP(req),
        path: req.path,
        key: apiKey.substring(0, 8) + '...',
        timestamp: new Date().toISOString(),
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: 'The provided API key is not valid',
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};
