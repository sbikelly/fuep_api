import {
  ApiResponse,
  ApiResponseSchema,
  Application,
  ApplicationCreateRequestSchema,
  ApplicationCreateResponse,
  Candidate,
  CandidateProfileUpdateRequestSchema,
  CandidateProfileUpdateResponse,
  ChangePasswordRequestSchema,
  ChangePasswordResponse,
  JambVerification,
  JambVerificationRequestSchema,
  LoginRequestSchema,
  LoginResponse,
} from '@fuep/types';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { existsSync, readFileSync } from 'fs';
import _helmet from 'helmet';
import yaml from 'js-yaml';
import { join } from 'path';
import swaggerUi from 'swagger-ui-express';

// Import database connection
import { db, waitForDatabase } from './db/knex.js';
// Import routes module
import { createRoutesModule } from './modules/routes/index.js';

// Load environment variables (Render auto-injects these in production)
// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  try {
    const envPath = join(process.cwd(), '.env');
    console.log('Development mode: Loading .env from:', envPath);
    require('dotenv').config({ path: envPath });
  } catch (_error) {
    console.log('No .env file found, using system environment variables');
  }
}

// Debug: Log environment variables
console.log('Environment variables loaded:');
console.log('REMITA_PUBLIC_KEY:', process.env.REMITA_PUBLIC_KEY ? 'SET' : 'NOT SET');
console.log('REMITA_SECRET_KEY:', process.env.REMITA_SECRET_KEY ? 'SET' : 'NOT SET');

// Set sandbox environment variables for testing if not present
if (!process.env.REMITA_PUBLIC_KEY) {
  console.log('Setting sandbox Remita environment variables for testing');
  process.env.REMITA_PUBLIC_KEY = 'test_public_key_123';
  process.env.REMITA_SECRET_KEY = 'test_secret_key_456';
  process.env.REMITA_WEBHOOK_SECRET = 'test_webhook_secret_789';
  process.env.REMITA_MERCHANT_ID = '2547916';
  process.env.REMITA_BASE_URL = 'https://remitademo.net';
}

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Import security middleware
// Import caching middleware
import {
  cacheInstances,
  createCacheMiddleware,
  generateCacheKey as _generateCacheKey,
  getCacheHealth,
} from './middleware/caching.js';
// Import logging middleware
import {
  errorLoggingMiddleware,
  httpLoggingMiddleware,
  logger as _logger,
} from './middleware/logging.js';
// Import metrics and tracing middleware
import { httpMetricsMiddleware, metricsStore, tracingMiddleware } from './middleware/metrics.js';
import {
  corsConfig,
  customSecurityHeaders,
  helmetConfig,
  securityLogger,
} from './middleware/security.js';

// Apply security middleware
app.use(helmetConfig);
app.use(customSecurityHeaders);
app.use(securityLogger);
app.use(cors(corsConfig));

// Apply logging, metrics, and tracing middleware
app.use(tracingMiddleware);
app.use(httpMetricsMiddleware);
app.use(httpLoggingMiddleware);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Import rate limiting middleware
import {
  authRateLimit,
  generalRateLimit,
  getRateLimitStats,
  healthCheckRateLimit,
  speedLimiter,
} from './middleware/rateLimiting.js';

// Apply general rate limiting and speed limiting to all routes
app.use(generalRateLimit);
app.use(speedLimiter);

// Load and merge domain-specific OpenAPI specifications with multiple fallback paths
let openApiSpec: any;
try {
  const domainSpecs = ['auth', 'candidates', 'payments', 'admin', 'academic'];

  // Multiple possible paths for OpenAPI specifications
  const possiblePaths = [
    // Docker paths (when running in container)
    join(process.cwd(), 'docs', 'openapi'),
    join(process.cwd(), 'app', 'docs', 'openapi'),

    // Development paths (relative to project root)
    join(process.cwd(), 'docs', 'openapi'),
    join(process.cwd(), '..', 'docs', 'openapi'),
    join(process.cwd(), '..', '..', 'docs', 'openapi'),

    // Production paths (when deployed)
    join(process.cwd(), 'docs', 'openapi'),
    join(process.cwd(), 'dist', 'docs', 'openapi'),

    // Alternative directory structures
    join(process.cwd(), 'openapi'),
    join(process.cwd(), 'api-docs'),
    join(process.cwd(), 'swagger'),

    // Render.com specific paths
    join(process.cwd(), 'build', 'docs', 'openapi'),
    join(process.cwd(), 'release', 'docs', 'openapi'),
  ];

  console.log('Searching for OpenAPI specifications in multiple paths...');

  let baseSpec: any = null;
  let baseSpecPath: string | null = null;
  let openApiBaseDir: string | null = null;

  // Try to find the base specification
  for (const basePath of possiblePaths) {
    const mainSpecPath = join(basePath, 'main.yaml');
    try {
      if (existsSync(mainSpecPath)) {
        const baseContent = readFileSync(mainSpecPath, 'utf8');
        baseSpec = yaml.load(baseContent);
        baseSpecPath = mainSpecPath;
        openApiBaseDir = basePath;
        console.log(`Base OpenAPI specification found at: ${mainSpecPath}`);
        break;
      }
    } catch (err) {
      // Continue to next path
    }
  }

  // If no base spec found
  if (!baseSpec) {
    // create a minimal one
    console.log('No fallback OpenAPI specification found, creating minimal spec');
    baseSpec = {
      openapi: '3.0.3',
      info: {
        title: 'FUEP Post-UTME Portal API',
        version: '1.0.0',
        description: 'Comprehensive REST API for candidate and admin workflows',
      },
      paths: {},
      components: {
        schemas: {},
      },
    };
  }

  // Merge domain specifications
  const mergedSpec = { ...baseSpec };
  mergedSpec.paths = { ...mergedSpec.paths };
  mergedSpec.components = { ...mergedSpec.components };
  mergedSpec.components.schemas = { ...mergedSpec.components.schemas };

  let loadedDomains = 0;
  let totalDomains = domainSpecs.length;

  // Try to load domain specifications from the found base directory
  if (openApiBaseDir) {
    for (const domain of domainSpecs) {
      try {
        const domainPath = join(openApiBaseDir, `${domain}.yaml`);
        if (existsSync(domainPath)) {
          const domainContent = readFileSync(domainPath, 'utf8');
          const domainSpec = yaml.load(domainContent) as any;

          // Merge paths
          if (domainSpec.paths) {
            Object.assign(mergedSpec.paths, domainSpec.paths);
          }

          // Merge schemas
          if (domainSpec.components?.schemas) {
            Object.assign(mergedSpec.components.schemas, domainSpec.components.schemas);
          }

          loadedDomains++;
          console.log(`Domain specification '${domain}' loaded from: ${domainPath}`);
        } else {
          console.log(`Domain specification '${domain}.yaml' not found at: ${domainPath}`);
        }
      } catch (err) {
        console.log(`Error loading domain specification '${domain}':`, err);
      }
    }
  } else {
    // Fallback: try to find domain specs in any of the possible paths
    console.log('Base directory not found, searching for domain specifications in all paths...');

    for (const domain of domainSpecs) {
      let domainLoaded = false;

      for (const basePath of possiblePaths) {
        const domainPath = join(basePath, `${domain}.yaml`);
        try {
          if (existsSync(domainPath)) {
            const domainContent = readFileSync(domainPath, 'utf8');
            const domainSpec = yaml.load(domainContent) as any;

            // Merge paths
            if (domainSpec.paths) {
              Object.assign(mergedSpec.paths, domainSpec.paths);
            }

            // Merge schemas
            if (domainSpec.components?.schemas) {
              Object.assign(mergedSpec.components.schemas, domainSpec.components.schemas);
            }

            loadedDomains++;
            domainLoaded = true;
            console.log(`Domain specification '${domain}' loaded from: ${domainPath}`);
            break;
          }
        } catch (err) {
          // Continue to next path
        }
      }

      if (!domainLoaded) {
        console.log(`Domain specification '${domain}' not found in any path`);
      }
    }
  }

  openApiSpec = mergedSpec;

  // Dynamically update server URLs based on current environment
  if (openApiSpec.servers && Array.isArray(openApiSpec.servers)) {
    const currentDomain = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    const baseUrl = currentDomain.replace(/\/$/, ''); // Remove trailing slash

    openApiSpec.servers = [
      { url: `${baseUrl}/api` },
      { url: '/api' }, // Relative URL for same-origin requests
    ];

    console.log(`OpenAPI servers configured for: ${baseUrl}/api`);
  }

  console.log(
    `OpenAPI specifications loaded successfully: ${loadedDomains}/${totalDomains} domain specs loaded`
  );
  console.log(`Total paths found: ${Object.keys(mergedSpec.paths).length}`);
  console.log(`Total schemas found: ${Object.keys(mergedSpec.components.schemas).length}`);
} catch (error) {
  console.error('Error loading/merging OpenAPI specifications:', error);
  // Create a minimal fallback specification to prevent complete failure
  console.log('Creating minimal fallback OpenAPI specification...');
  openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'FUEP Post-UTME Portal API (Fallback)',
      version: '1.0.0',
      description: 'Minimal API specification - some features may be limited',
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Health Check',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      timestamp: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {},
    },
  };
  console.log('Fallback OpenAPI specification created successfully');
}

// Root endpoint placeholder for Render health checks
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'FUEP Post-UTME Portal API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root health endpoint for Render health checks
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'FUEP Post-UTME Portal API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Serve OpenAPI documentation
if (openApiSpec) {
  // Serve Swagger UI at /docs
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'FUEP Post-UTME Portal API Documentation',
      swaggerOptions: {
        url: '/api/openapi.json',
        defaultModelsExpandDepth: -1,
        tryItOutEnabled: true,
        requestInterceptor: (req: any) => {
          // Ensure requests use the current domain
          if (req.url && req.url.startsWith('/api/')) {
            req.url = req.url;
          }
          return req;
        },
      },
    })
  );

  // Serve OpenAPI JSON at /api/openapi.json
  app.get('/api/openapi.json', (req, res) => {
    res.json(openApiSpec);
  });

  console.log('OpenAPI documentation available at /docs and /api/openapi.json');
}

// Initialize and mount routes module
let routesModule;
try {
  console.log('Initializing routes module...');
  routesModule = createRoutesModule();
  console.log('Routes module initialized successfully');

  console.log('Mounting all module routes...');
  app.use('/api', routesModule);
  console.log('All module routes mounted successfully');
} catch (_error) {
  console.error('Error initializing routes module:', _error);
  throw _error;
}

// Global error handling middleware (must come after all routes)
app.use(errorLoggingMiddleware);
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const errorResponse = {
    success: false,
    error: {
      code: err.status || 500,
      message: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      traceId: req.headers['x-request-id'] || (req as any).requestId || `req-${Date.now()}`,
    },
    timestamp: new Date(),
  };

  res.status(err.status || 500).json(errorResponse);
});

// Start server with database connection waiting
const startServer = async () => {
  try {
    // Wait for database connection before starting server
    console.log('Waiting for database connection...');
    const dbReady = await waitForDatabase(30); // Wait up to 60 seconds

    if (!dbReady) {
      console.error('Failed to connect to database after 60 seconds. Exiting...');
      process.exit(1);
    }

    console.log('Database connection established successfully');

    // Start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Express API listening on http://0.0.0.0:${PORT}`);
      console.log(`Server running on port ${PORT}`);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Port:', PORT);
      console.log('Database:', 'Connected');
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const server = await startServer();

// Handle server errors
server.on('error', (error: any) => {
  console.error('Server startup error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Unknown server error:', error);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
