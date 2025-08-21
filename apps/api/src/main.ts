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
import dotenv from 'dotenv';
import express from 'express';
import { readFileSync } from 'fs';
import helmet from 'helmet';
import yaml from 'js-yaml';
import { join } from 'path';
import swaggerUi from 'swagger-ui-express';

// Load environment variables from apps/api directory
import { db } from './db/knex.js';
// Import admin module initializer (temporarily disabled due to compilation errors)
// import { createAdminModule } from './modules/admin/admin.module.js';
import { createCandidateModule } from './modules/candidates/index.js';
// Import payments module initializer
import { createPaymentsModule } from './payment/index.js';

const envPath = join(process.cwd(), '.env');
console.log('Current working directory:', process.cwd());
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

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
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
// CORS configuration for multiple environments
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://127.0.0.1:5173', // Vite dev server (alternative)
  'http://localhost:8080', // Docker reverse proxy
  'http://127.0.0.1:8080', // Docker reverse proxy (alternative)
  'http://localhost', // Local development
  'http://127.0.0.1', // Local development (alternative)
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Load OpenAPI specification (temporarily disabled)
console.log('OpenAPI documentation temporarily disabled');
/*
let openApiSpec: any;
try {
  const specPath = join(process.cwd(), 'docs', 'openapi.yaml');
  const specContent = readFileSync(specPath, 'utf8');
  openApiSpec = yaml.load(specContent);
  console.log('OpenAPI specification loaded successfully');
} catch (error) {
  console.error('Error loading OpenAPI specification:', error);
  openApiSpec = null;
}

// Serve OpenAPI documentation
if (openApiSpec) {
  // Serve Swagger UI at /docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'FUEP Post-UTME Portal API Documentation'
  }));

  // Serve OpenAPI JSON at /api/openapi.json
  app.get('/api/openapi.json', (req, res) => {
    res.json(openApiSpec);
  });

  console.log('OpenAPI documentation available at /docs and /api/openapi.json');
}
*/

// Health check endpoint
app.get('/api/health', (req, res) => {
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
});

// Database connectivity check
app.get('/api/health/db', async (req, res) => {
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

// POST /auth/check-jamb
app.post('/api/auth/check-jamb', async (req, res) => {
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
app.post('/api/auth/login', async (req, res) => {
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

    // TODO: Implement actual login logic with JWT
    // For now, return mock login response
    const mockLoginResponse: LoginResponse = {
      success: true,
      data: {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
      user: {
        id: 'mock-user-id',
        jambRegNo: loginData.username,
        email: 'candidate@fuep.edu.ng',
        phone: '08000000000',
        isActive: true,
        tempPasswordFlag: false,
      },
      timestamp: new Date(),
    };

    return res.json(mockLoginResponse);
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
app.post('/api/auth/change-password', async (req, res) => {
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

    // TODO: Implement actual password change logic
    // For now, return mock response
    const mockChangePasswordResponse: ChangePasswordResponse = {
      success: true,
      data: null,
      message: 'Password changed successfully',
      timestamp: new Date(),
    };

    return res.json(mockChangePasswordResponse);
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

    // TODO: Implement profile update logic
    // For now, return mock profile data
    const mockProfile: SimpleProfile = {
      id: 'mock-profile-id',
      candidateId: 'mock-candidate-id',
      surname: profileData.surname,
      firstname: profileData.firstname,
      othernames: profileData.othernames,
      gender: profileData.gender,
      dob: profileData.dob ? new Date(profileData.dob) : undefined,
      address: profileData.address,
      state: profileData.state,
      lga: profileData.lga,
      city: profileData.city,
      nationality: profileData.nationality,
      maritalStatus: profileData.maritalStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const response: ProfileUpdateResponse = {
      success: true,
      data: mockProfile,
      message: 'Profile updated successfully',
      timestamp: new Date(),
    };

    return res.json(response);
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

    // TODO: Implement application creation logic
    // For now, return mock application data
    const mockApplication: SimpleApplication = {
      id: 'mock-application-id',
      candidateId: 'mock-candidate-id',
      session: appData.session,
      programmeCode: appData.programmeCode,
      departmentCode: appData.departmentCode,
      status: 'pending',
      submittedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const response: ApplicationCreateResponse = {
      success: true,
      data: mockApplication,
      message: 'Application created successfully',
      timestamp: new Date(),
    };

    return res.json(response);
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

  // Mount document routes
  documentsRouter.post(
    '/upload',
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

// Initialize and mount admin module (temporarily disabled due to compilation errors)
console.log('Admin module temporarily disabled due to compilation errors');
/*
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
*/

// Global error handling middleware (must come after all routes)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);

  const errorResponse = {
    error: {
      code: err.status || 500,
      message: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      traceId: req.headers['x-request-id'] || `req-${Date.now()}`,
    },
    timestamp: new Date(),
  };

  res.status(err.status || 500).json(errorResponse);
});

// Start server
app.listen(PORT, () => {
  console.log(`Express API listening on http://localhost:${PORT}`);
});
