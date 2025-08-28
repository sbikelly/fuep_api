import { Router } from 'express';

import { authRateLimit } from '../../middleware/rateLimiting.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

export interface AuthModuleDependencies {
  logger?: Console;
}

export interface AuthModule {
  router: Router;
  service: AuthService;
  controller: AuthController;
}

export function createAuthModule(deps: AuthModuleDependencies = {}): AuthModule {
  const logger = deps.logger || console;

  logger.log('[AuthModule] Initializing auth module...');

  try {
    // 1. Create auth service
    logger.log('[AuthModule] Creating AuthService...');
    const service = new AuthService();
    logger.log('[AuthModule] AuthService created successfully');

    // 2. Create auth controller with service
    logger.log('[AuthModule] Creating AuthController...');
    const controller = new AuthController(service, logger);
    logger.log('[AuthModule] AuthController created successfully');

    // 3. Create router and bind routes
    logger.log('[AuthModule] Creating router and binding routes...');
    const router = Router();

    // Apply auth-specific rate limiting to all routes
    router.use(authRateLimit);

    // JAMB verification
    router.post('/check-jamb', controller.checkJamb.bind(controller));

    // Authentication
    router.post('/login', controller.login.bind(controller));
    router.post('/change-password', controller.changePassword.bind(controller));

    // Token management
    router.post('/refresh-token', controller.refreshToken.bind(controller));
    router.post('/logout', controller.logout.bind(controller));

    logger.log('[AuthModule] Router created and routes bound successfully');

    return {
      router,
      service,
      controller,
    };
  } catch (error) {
    logger.error('[AuthModule] Failed to initialize auth module:', error);
    throw error;
  }
}
