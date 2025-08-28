import { ApiResponse } from '@fuep/types';
import { Request, Response } from 'express';

import { getCacheHealth } from '../../middleware/caching.js';
import { metricsStore } from '../../middleware/metrics.js';
import { getRateLimitStats } from '../../middleware/rateLimiting.js';
import { SystemService } from './system.service.js';

export class SystemController {
  constructor(
    private systemService: SystemService,
    private logger: Console = console
  ) {}

  /**
   * Root health endpoint for Render health checks
   */
  rootHealth(req: Request, res: Response): void {
    res.status(200).json({
      status: 'healthy',
      service: 'FUEP Post-UTME Portal API',
      timestamp: new Date().toISOString(),
      uptime: this.systemService.getUptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  }

  /**
   * Health check endpoint
   */
  healthCheck(req: Request, res: Response): void {
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'healthy',
        uptime: this.systemService.getUptime(),
        timestamp: new Date(),
      },
      timestamp: new Date(),
    };
    res.json(response);
  }

  /**
   * Database connectivity check
   */
  async databaseHealth(req: Request, res: Response): Promise<void> {
    try {
      const { db } = await import('../../db/knex.js');
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
    } catch (_error) {
      const response: ApiResponse = {
        success: false,
        error: 'Database connection failed',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Detailed health endpoint with metrics
   */
  detailedHealth(req: Request, res: Response): void {
    try {
      const memUsage = this.systemService.getMemoryUsage();
      const metrics = metricsStore.getAllMetrics();

      const response: ApiResponse = {
        success: true,
        data: {
          status: 'healthy',
          uptime: this.systemService.getUptime(),
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
    } catch (_error) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get detailed health status',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Rate limit monitoring endpoint
   */
  rateLimitStats(req: Request, res: Response): void {
    try {
      const stats = getRateLimitStats();
      const response: ApiResponse = {
        success: true,
        data: stats,
        timestamp: new Date(),
      };
      res.json(response);
    } catch (_error) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get rate limit statistics',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * System metrics endpoint
   */
  systemMetrics(req: Request, res: Response): void {
    try {
      const metrics = metricsStore.getAllMetrics();
      const response: ApiResponse = {
        success: true,
        data: metrics,
        timestamp: new Date(),
      };
      res.json(response);
    } catch (_error) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get metrics',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Cache health endpoint
   */
  cacheStats(req: Request, res: Response): void {
    try {
      const cacheHealth = getCacheHealth();
      const response: ApiResponse = {
        success: true,
        data: cacheHealth,
        timestamp: new Date(),
      };
      res.json(response);
    } catch (_error) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get cache statistics',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
}
