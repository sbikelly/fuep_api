import { Request, Response } from 'express';

import { AdminService } from '../services/admin.service.js';

export class AdminDashboardController {
  constructor(private adminService: AdminService) {}

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await this.adminService.getDashboardSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('[AdminDashboardController] Get dashboard summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard summary',
      });
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { period = '30d' } = req.query;

      const analytics = await this.adminService.getAnalytics(period as '7d' | '30d' | '90d' | '1y');

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error('[AdminDashboardController] Get analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get analytics data',
      });
    }
  }

  /**
   * Get health status
   */
  async getHealthStatus(req: Request, res: Response): Promise<void> {
    try {
      // Simple health check response
      const health = {
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };

      res.json({
        success: true,
        data: health,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('[AdminDashboardController] Get health status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get health status',
      });
    }
  }
}
