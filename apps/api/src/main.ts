import {
  ApiResponse,
  ApiResponseSchema,
  ApplicationCreateRequestSchema,
  ApplicationCreateResponse,
  ChangePasswordRequestSchema,
  ChangePasswordResponse,
  JambVerification,
  JambVerificationRequestSchema,
  LoginRequestSchema,
  LoginResponse,
  ProfileUpdateRequestSchema,
  ProfileUpdateResponse,
  SimpleApplication,
  SimpleProfile,
} from '@fuep/types';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { readFileSync } from 'fs';
import helmet from 'helmet';
import yaml from 'js-yaml';
import { join } from 'path';
import swaggerUi from 'swagger-ui-express';

// Import database connection
import { db } from './db/knex.js';
// Import admin module initializer
import { createAdminModule } from './modules/admin/admin.module.js';
import { createCandidateModule } from './modules/candidates/index.js';
// Import payments module initializer
import { createPaymentsModule } from './payment/index.js';
// Import authentication service
import { AuthService } from './services/auth.service.js';

// Load environment variables (Render auto-injects these in production)
// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  try {
    const envPath = join(process.cwd(), '.env');
    console.log('Development mode: Loading .env from:', envPath);
    require('dotenv').config({ path: envPath });
  } catch (error) {
    console.log('No .env file found, using system environment variables');
  }
}

// Debug: Log environment variables
console.log('Environment variables loaded:');
console.log('REMITA_PUBLIC_KEY:', process.env.REMITA_PUBLIC_KEY ? 'SET' : 'NOT SET');
console.log('REMITA_SECRET_KEY:', process.env.REMITA_SECRET_KEY ? 'SET' : 'NOT SET');
console.log('FLUTTERWAVE_PUBLIC_KEY:', process.env.FLUTTERWAVE_PUBLIC_KEY ? 'SET' : 'NOT SET');
console.log('FLUTTERWAVE_SECRET_KEY:', process.env.FLUTTERWAVE_SECRET_KEY ? 'SET' : 'NOT SET');

// Set sandbox environment variables for testing if not present
if (!process.env.REMITA_PUBLIC_KEY) {
  console.log('Setting sandbox Remita environment variables for testing');
  process.env.REMITA_PUBLIC_KEY = 'test_public_key_123';
  process.env.REMITA_SECRET_KEY = 'test_secret_key_456';
  process.env.REMITA_WEBHOOK_SECRET = 'test_webhook_secret_789';
  process.env.REMITA_MERCHANT_ID = '2547916';
  process.env.REMITA_BASE_URL = 'https://remitademo.net';
}

if (!process.env.FLUTTERWAVE_PUBLIC_KEY) {
  console.log('Setting sandbox Flutterwave environment variables for testing');
  process.env.FLUTTERWAVE_PUBLIC_KEY = 'test_public_key_123';
  process.env.FLUTTERWAVE_SECRET_KEY = 'test_secret_key_456';
  process.env.FLUTTERWAVE_WEBHOOK_SECRET = 'test_webhook_secret_789';
  process.env.FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';
}

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Import security middleware
// Import caching middleware
import {
  cacheInstances,
  createCacheMiddleware,
  generateCacheKey,
  getCacheHealth,
} from './middleware/caching.js';
// Import logging middleware
import { errorLoggingMiddleware, httpLoggingMiddleware, logger } from './middleware/logging.js';
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
  uploadRateLimit,
} from './middleware/rateLimiting.js';

// Apply general rate limiting and speed limiting to all routes
app.use(generalRateLimit);
app.use(speedLimiter);

// Load OpenAPI specification
let openApiSpec: any;
try {
  // Try multiple possible paths for OpenAPI spec
  const possiblePaths = [
    join(process.cwd(), 'docs', 'openapi.yaml'),
    join(process.cwd(), 'apps', 'api', 'docs', 'openapi.yaml'),
    join(process.cwd(), '..', 'docs', 'openapi.yaml'),
    // Use import.meta.url for ES modules instead of __dirname
    join(new URL('.', import.meta.url).pathname, '..', '..', 'docs', 'openapi.yaml'),
  ];

  let specContent = null;
  let specPath = null;

  for (const path of possiblePaths) {
    try {
      specContent = readFileSync(path, 'utf8');
      specPath = path;
      console.log(`OpenAPI specification found at: ${path}`);
      break;
    } catch (err) {
      // Continue to next path
    }
  }

  if (specContent) {
    openApiSpec = yaml.load(specContent);
    
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
    
    console.log('OpenAPI specification loaded successfully');
  } else {
    console.log('OpenAPI specification not found in any of the expected locations');
    openApiSpec = null;
  }
} catch (error) {
  console.error('Error loading OpenAPI specification:', error);
  openApiSpec = null;
}

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

// Root health endpoint for Render health checks
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'FUEP Post-UTME Portal API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint (with fast caching)
app.get(
  '/api/health',
  healthCheckRateLimit,
  createCacheMiddleware(cacheInstances.fast, 10000),
  (req, res) => {
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date(),
      },
      timestamp: new Date(),
    };
    res.json(response);
  }
);

// Database connectivity check
app.get('/api/health/db', healthCheckRateLimit, async (req, res) => {
  try {
    await db.raw('SELECT 1');
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'connected',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Database connection failed',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
});

// Rate limit monitoring endpoint (admin only)
app.get('/api/admin/rate-limit-stats', (req, res) => {
  try {
    const stats = getRateLimitStats();
    const response: ApiResponse = {
      success: true,
      data: stats,
      timestamp: new Date(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get rate limit statistics',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
});

// Metrics endpoint (admin only)
app.get('/api/admin/metrics', (req, res) => {
  try {
    const metrics = metricsStore.getAllMetrics();
    const response: ApiResponse = {
      success: true,
      data: metrics,
      timestamp: new Date(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get metrics',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
});

// Cache health endpoint
app.get('/api/admin/cache-stats', (req, res) => {
  try {
    const cacheHealth = getCacheHealth();
    const response: ApiResponse = {
      success: true,
      data: cacheHealth,
      timestamp: new Date(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get cache statistics',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
});

// Health endpoint with metrics
app.get('/api/health/detailed', createCacheMiddleware(cacheInstances.fast, 30000), (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const metrics = metricsStore.getAllMetrics();

    const response: ApiResponse = {
      success: true,
      data: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: {
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)} MB`,
          rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        },
        requests: {
          total: metrics.counters['http_requests_total'] || 0,
          active: metrics.gauges['http_requests_active'] || 0,
          errors: metrics.counters['http_errors_total'] || 0,
        },
        database: {
          queries: metrics.counters['database_queries_total'] || 0,
          errors: metrics.counters['database_errors_total'] || 0,
        },
        payments: {
          events: metrics.counters['payment_events_total'] || 0,
          errors: metrics.counters['payment_errors_total'] || 0,
        },
        timestamp: new Date(),
      },
      timestamp: new Date(),
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get detailed health status',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
});

// POST /auth/check-jamb
app.post('/api/auth/check-jamb', authRateLimit, async (req, res) => {
  try {
    // Validate request body
    const validationResult = JambVerificationRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid request data',
        timestamp: new Date(),
      };
      return res.status(400).json(response);
    }

    const { jambRegNo } = validationResult.data;
    const normalizedJambRegNo = jambRegNo.trim().toUpperCase();

    const row = await db('jamb_prelist').where({ jamb_reg_no: normalizedJambRegNo }).first();
    if (!row) {
      const response: ApiResponse = {
        success: true,
        data: {
          exists: false,
          message: 'JAMB registration number not found in prelist',
        },
        timestamp: new Date(),
      };
      return res.json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        exists: true,
        message: 'JAMB registration number found in prelist',
        biodata: {
          jambRegNo: row.jamb_reg_no,
          surname: row.surname,
          firstname: row.firstname,
          othernames: row.othernames,
          gender: row.gender,
          programmeCode: row.programme_code,
          departmentCode: row.department_code,
          faculty: row.faculty,
          stateOfOrigin: row.state_of_origin,
          lgaOfOrigin: row.lga_of_origin,
          email: row.email,
          phone: row.phone,
          utmeScore: row.utme_score,
          session: row.session,
        },
      },
      timestamp: new Date(),
    };

    return res.json(response);
  } catch (err: any) {
    console.error('[jamb-check] error:', err?.message || err);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date(),
    };
    return res.status(500).json(response);
  }
});

// POST /auth/login
app.post('/api/auth/login', authRateLimit, async (req, res) => {
  try {
    // Validate request body
    const validationResult = LoginRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid request data',
        timestamp: new Date(),
      };
      return res.status(400).json(response);
    }

    const loginData = validationResult.data;

    // Implement actual login logic with JWT using AuthService
    try {
      const loginResponse = await AuthService.authenticateCandidate(
        loginData.username,
        loginData.password
      );

      if (!loginResponse) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid JAMB registration number or password',
          timestamp: new Date(),
        };
        return res.status(401).json(response);
      }

      return res.json(loginResponse);
    } catch (dbError: any) {
      console.error('[auth-login] database error:', dbError?.message || dbError);
      const response: ApiResponse = {
        success: false,
        error: 'Database error during login',
        timestamp: new Date(),
      };
      return res.status(500).json(response);
    }
  } catch (err: any) {
    console.error('[auth-login] error:', err?.message || err);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date(),
    };
    return res.status(500).json(response);
  }
});

// POST /auth/change-password
app.post('/api/auth/change-password', authRateLimit, async (req, res) => {
  try {
    // Validate request body
    const validationResult = ChangePasswordRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid request data',
        timestamp: new Date(),
      };
      return res.status(400).json(response);
    }

    const passwordData = validationResult.data;

    // Implement actual password change logic using AuthService
    try {
      // For now, we'll use a real candidate ID - in production this would come from JWT token
      // TODO: Extract candidate ID from JWT token when authentication middleware is implemented
      const candidateId = '0009c312-3e0d-415b-8d7d-65f4d9124518';

      // Verify current password and change to new password
      const passwordChanged = await AuthService.changePassword(
        candidateId,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (!passwordChanged) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid current password or candidate not found',
          timestamp: new Date(),
        };
        return res.status(400).json(response);
      }

      const changePasswordResponse: ChangePasswordResponse = {
        success: true,
        data: null,
        message: 'Password changed successfully',
        timestamp: new Date(),
      };

      return res.json(changePasswordResponse);
    } catch (dbError: any) {
      console.error('[auth-change-password] database error:', dbError?.message || dbError);
      const response: ApiResponse = {
        success: false,
        error: 'Database error during password change',
        timestamp: new Date(),
      };
      return res.status(500).json(response);
    }
  } catch (err: any) {
    console.error('[auth-change-password] error:', err?.message || err);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date(),
    };
    return res.status(500).json(response);
  }
});

// PUT /profile
app.put('/api/profile', async (req, res) => {
  try {
    // Validate request body
    const validationResult = ProfileUpdateRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid request data',
        timestamp: new Date(),
      };
      return res.status(400).json(response);
    }

    const profileData = validationResult.data;

    // Implement profile update logic using existing candidate module
    try {
      // TODO: Get candidate ID from authenticated user session when JWT middleware is implemented
      // For now, we'll use a real candidate ID
      const candidateId = '0009c312-3e0d-415b-8d7d-65f4d9124518';

      // Update candidate profile in database using the profiles table
      const updateData = {
        surname: profileData.surname,
        firstname: profileData.firstname,
        othernames: profileData.othernames,
        gender: profileData.gender,
        dob: profileData.dob ? new Date(profileData.dob) : null,
        address: profileData.address,
        state: profileData.state,
        lga: profileData.lga,
        city: profileData.city,
        nationality: profileData.nationality,
        marital_status: profileData.maritalStatus,
        updated_at: new Date(),
      };

      // Check if profile exists, if not create it
      const existingProfile = await db('profiles').where({ candidate_id: candidateId }).first();

      if (existingProfile) {
        // Update existing profile
        await db('profiles').where({ candidate_id: candidateId }).update(updateData);
      } else {
        // Create new profile
        await db('profiles').insert({
          candidate_id: candidateId,
          ...updateData,
          created_at: new Date(),
        });
      }

      // Get updated profile
      const updatedProfile = await db('profiles').where({ candidate_id: candidateId }).first();

      if (!updatedProfile) {
        const response: ApiResponse = {
          success: false,
          error: 'Profile not found after update',
          timestamp: new Date(),
        };
        return res.status(404).json(response);
      }

      // Return updated profile
      const profile: SimpleProfile = {
        id: updatedProfile.candidate_id,
        candidateId: updatedProfile.candidate_id,
        surname: updatedProfile.surname,
        firstname: updatedProfile.firstname,
        othernames: updatedProfile.othernames,
        gender: updatedProfile.gender,
        dob: updatedProfile.dob ? new Date(updatedProfile.dob) : undefined,
        address: updatedProfile.address,
        state: updatedProfile.state,
        lga: updatedProfile.lga,
        city: updatedProfile.city,
        nationality: updatedProfile.nationality,
        maritalStatus: updatedProfile.marital_status,
        createdAt: updatedProfile.created_at,
        updatedAt: updatedProfile.updated_at,
      };

      const response: ProfileUpdateResponse = {
        success: true,
        data: profile,
        message: 'Profile updated successfully',
        timestamp: new Date(),
      };

      return res.json(response);
    } catch (dbError: any) {
      console.error('[profile-update] database error:', dbError?.message || dbError);
      const response: ApiResponse = {
        success: false,
        error: 'Database error during profile update',
        timestamp: new Date(),
      };
      return res.status(500).json(response);
    }
  } catch (err: any) {
    console.error('[profile-update] error:', err?.message || err);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date(),
    };
    return res.status(500).json(response);
  }
});

// POST /applications
app.post('/api/applications', async (req, res) => {
  try {
    // Validate request body
    const validationResult = ApplicationCreateRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid request data',
        timestamp: new Date(),
      };
      return res.status(400).json(response);
    }

    const appData = validationResult.data;

    // Implement application creation logic using direct database operations
    try {
      // TODO: Get candidate ID from authenticated user session when JWT middleware is implemented
      // For now, we'll use a real candidate ID
      const candidateId = '0009c312-3e0d-415b-8d7d-65f4d9124518';

      // Check if candidate already has an application for this session
      const existingApplication = await db('applications')
        .where({
          candidate_id: candidateId,
          session: appData.session,
        })
        .first();

      if (existingApplication) {
        const response: ApiResponse = {
          success: false,
          error: 'Candidate already has an application for this session',
          timestamp: new Date(),
        };
        return res.status(400).json(response);
      }

      // TODO: Add programme and department validation when those tables are created
      // For now, we'll accept any programme and department codes

      // Create application in database
      const [applicationId] = await db('applications')
        .insert({
          candidate_id: candidateId,
          session: appData.session,
          programme_code: appData.programmeCode,
          department_code: appData.departmentCode,
          status: 'pending',
          submitted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('id');

      // Get created application
      const createdApplication = await db('applications').where({ id: applicationId }).first();

      if (!createdApplication) {
        const response: ApiResponse = {
          success: false,
          error: 'Failed to create application',
          timestamp: new Date(),
        };
        return res.status(500).json(response);
      }

      // Return created application
      const application: SimpleApplication = {
        id: createdApplication.id,
        candidateId: createdApplication.candidate_id,
        session: createdApplication.session,
        programmeCode: createdApplication.programme_code,
        departmentCode: createdApplication.department_code,
        status: createdApplication.status,
        submittedAt: createdApplication.submitted_at
          ? new Date(createdApplication.submitted_at)
          : undefined,
        createdAt: createdApplication.created_at,
        updatedAt: createdApplication.updated_at,
      };

      const response: ApplicationCreateResponse = {
        success: true,
        data: application,
        message: 'Application created successfully',
        timestamp: new Date(),
      };

      return res.json(response);
    } catch (dbError: any) {
      console.error('[application-create] database error:', dbError?.message || dbError);
      const response: ApiResponse = {
        success: false,
        error: 'Database error during application creation',
        timestamp: new Date(),
      };
      return res.status(500).json(response);
    }
  } catch (err: any) {
    console.error('[application-create] error:', err?.message || err);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date(),
    };
    return res.status(500).json(response);
  }
});

// Initialize and mount payments module
let paymentsModule;
try {
  console.log('Initializing payments module...');
  paymentsModule = createPaymentsModule();
  console.log('Payments module initialized successfully');

  console.log('Mounting payment routes...');
  app.use('/api/payments', paymentsModule.router);
  console.log('Payment routes mounted successfully');
} catch (error) {
  console.error('Error initializing payments module:', error);
  throw error;
}

// Initialize and mount candidate module
let candidateModule;
try {
  console.log('Initializing candidate module...');
  candidateModule = createCandidateModule();
  console.log('Candidate module initialized successfully');

  console.log('Mounting candidate routes...');
  app.use('/api/candidates', candidateModule.router);
  console.log('Candidate routes mounted successfully');
} catch (error) {
  console.error('Error initializing candidate module:', error);
  throw error;
}

// Initialize and mount documents module
let documentsModule;
try {
  console.log('Initializing documents module...');
  const { DocumentsController } = await import('./modules/documents/documents.controller.js');
  const { DocumentsService } = await import('./modules/documents/documents.service.js');
  const { MinioService } = await import('./modules/documents/minio.service.js');
  const multer = await import('multer');

  // Create instances manually since we're not using NestJS DI container
  const minioService = new MinioService({
    get: (key: string, defaultValue?: any) => process.env[key] || defaultValue,
  });
  const documentsService = new DocumentsService(minioService, {
    get: (key: string, defaultValue?: any) => process.env[key] || defaultValue,
  });
  const documentsController = new DocumentsController(documentsService, minioService);

  console.log('Documents module initialized successfully');

  console.log('Mounting document routes...');

  // Create documents router
  const documentsRouter = express.Router();

  // Configure multer for file uploads
  const upload = multer.default({
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, callback) => {
      // Additional file type validation
      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(new Error(`File type ${file.mimetype} is not allowed`));
      }

      callback(null, true);
    },
  });

  // Mount document routes (with upload rate limiting)
  documentsRouter.post(
    '/upload',
    uploadRateLimit,
    upload.single('file'),
    documentsController.uploadDocument.bind(documentsController)
  );
  documentsRouter.get('/:documentId', documentsController.getDocument.bind(documentsController));
  documentsRouter.get(
    '/candidate/:candidateId',
    documentsController.getDocumentsByCandidate.bind(documentsController)
  );
  documentsRouter.get(
    '/:documentId/download',
    documentsController.downloadDocument.bind(documentsController)
  );
  documentsRouter.get(
    '/:documentId/secure-url',
    documentsController.getSecureDownloadUrl.bind(documentsController)
  );
  documentsRouter.delete(
    '/:documentId',
    documentsController.deleteDocument.bind(documentsController)
  );
  documentsRouter.get(
    '/health/status',
    documentsController.getHealthStatus.bind(documentsController)
  );
  documentsRouter.post(
    '/:documentId/scan-status',
    documentsController.updateScanStatus.bind(documentsController)
  );

  // Mount the router
  app.use('/api/documents', documentsRouter);

  console.log('Document routes mounted successfully');
} catch (error) {
  console.error('Error initializing documents module:', error);
  // Don't throw error, continue without documents module
  console.log('Continuing without documents module...');
}

// Initialize and mount admin module
let adminModule;
try {
  console.log('Initializing admin module...');
  adminModule = createAdminModule();
  app.use('/api/admin', adminModule.router);
  console.log('Admin module initialized and mounted successfully');
} catch (error) {
  console.error('Error initializing admin module:', error);
  console.log('Continuing without admin module...');
}

// Global error handling middleware (must come after all routes)
app.use(errorLoggingMiddleware);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express API listening on http://0.0.0.0:${PORT}`);
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Port:', PORT);
});

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
