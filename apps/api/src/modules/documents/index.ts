import { Router } from 'express';

import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';
import { MinioService } from './minio.service.js';
import { createDocumentsRoutes } from './routes/index.js';

export interface DocumentsModuleDependencies {
  logger?: Console;
}

export interface DocumentsModule {
  router: Router;
  service: DocumentsService;
  controller: DocumentsController;
  minioService: MinioService;
}

export function createDocumentsModule(deps: DocumentsModuleDependencies = {}): DocumentsModule {
  const logger = deps.logger || console;

  logger.log('[DocumentsModule] Initializing documents module...');

  try {
    // 1. Create MinIO service
    logger.log('[DocumentsModule] Creating MinioService...');
    const minioService = new MinioService({
      get: (key: string, defaultValue?: any) => process.env[key] || defaultValue,
    });
    logger.log('[DocumentsModule] MinioService created successfully');

    // 2. Create documents service with MinIO service
    logger.log('[DocumentsModule] Creating DocumentsService...');
    const service = new DocumentsService(minioService, {
      get: (key: string, defaultValue?: any) => process.env[key] || defaultValue,
    });
    logger.log('[DocumentsModule] DocumentsService created successfully');

    // 3. Create documents controller with service
    logger.log('[DocumentsModule] Creating DocumentsController...');
    const controller = new DocumentsController(service, minioService);
    logger.log('[DocumentsModule] DocumentsController created successfully');

    // 4. Create router using the new routes structure
    logger.log('[DocumentsModule] Creating router and binding routes...');
    const router = createDocumentsRoutes(controller);
    logger.log('[DocumentsModule] Router created and routes bound successfully');

    return {
      router,
      service,
      controller,
      minioService,
    };
  } catch (error) {
    logger.error('[DocumentsModule] Failed to initialize documents module:', error);
    // Don't throw error, continue without documents module
    logger.log('[DocumentsModule] Continuing without documents module...');

    // Return a minimal module that won't break the system
    const router = Router();
    router.get('/health', (req, res) => {
      res.status(503).json({
        success: false,
        error: 'Documents module not available',
        timestamp: new Date(),
      });
    });

    return {
      router,
      service: null as any,
      controller: null as any,
      minioService: null as any,
    };
  }
}
