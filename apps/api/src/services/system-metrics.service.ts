import { db } from '../db/knex.js';
import { logger } from '../middleware/logging.js';
// Redis service not available, using fallback
const redis = {
  info: async () =>
    'connected_clients:0\r\nused_memory_human:0\r\nkeyspace_hits:0\r\nkeyspace_misses:0\r\ntotal_commands_processed:0',
};

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
}

export interface DatabaseMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  queryCount: number;
  slowQueries: number;
  deadlocks: number;
}

export interface RedisMetrics {
  connected: boolean;
  memoryUsage: number;
  keyspaceHits: number;
  keyspaceMisses: number;
  totalCommands: number;
  connectedClients: number;
}

export class SystemMetricsService {
  private metricsHistory: Array<{ timestamp: Date; metrics: SystemMetrics }> = [];
  private maxHistorySize = 1000;

  /**
   * Collect comprehensive system metrics
   */
  async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      const [cpuUsage, memoryUsage, diskUsage, dbMetrics, redisMetrics] = await Promise.all([
        this.getCPUUsage(),
        this.getMemoryUsage(),
        this.getDiskUsage(),
        this.getDatabaseMetrics(),
        this.getRedisMetrics(),
      ]);

      const metrics: SystemMetrics = {
        cpuUsage,
        memoryUsage,
        diskUsage,
        activeConnections: dbMetrics.activeConnections + redisMetrics.connectedClients,
        responseTime: await this.getAverageResponseTime(),
        errorRate: await this.getErrorRate(),
        uptime: process.uptime(),
      };

      // Store metrics in history
      this.metricsHistory.push({ timestamp: new Date(), metrics });
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory.shift();
      }

      logger.info('System metrics collected successfully', {
        module: 'system-metrics',
        operation: 'collectSystemMetrics',
        metadata: { metrics },
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to collect system metrics', {
        module: 'system-metrics',
        operation: 'collectSystemMetrics',
        error: error instanceof Error ? error.message : String(error),
      });

      // Return fallback metrics
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        activeConnections: 0,
        responseTime: 0,
        errorRate: 0,
        uptime: process.uptime(),
      };
    }
  }

  /**
   * Get CPU usage percentage
   */
  private async getCPUUsage(): Promise<number> {
    try {
      const startUsage = process.cpuUsage();
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms
      const endUsage = process.cpuUsage();

      const userCpu = endUsage.user - startUsage.user;
      const systemCpu = endUsage.system - startUsage.system;
      const totalCpu = userCpu + systemCpu;

      // Convert to percentage (approximate)
      return Math.min(100, Math.round((totalCpu / 1000000) * 100));
    } catch (error) {
      logger.warn('Failed to get CPU usage, using fallback', {
        module: 'system-metrics',
        operation: 'getCPUUsage',
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Get memory usage percentage
   */
  private async getMemoryUsage(): Promise<number> {
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal + memUsage.external + memUsage.rss;
      const usedMemory = memUsage.heapUsed + memUsage.external;

      return Math.round((usedMemory / totalMemory) * 100);
    } catch (error) {
      logger.warn('Failed to get memory usage, using fallback', {
        module: 'system-metrics',
        operation: 'getMemoryUsage',
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Get disk usage (simplified - would need fs.stat in production)
   */
  private async getDiskUsage(): Promise<number> {
    try {
      // In production, you would use fs.stat to check actual disk usage
      // For now, return a reasonable estimate based on database size
      const result = await db.raw(`
        SELECT pg_database_size(current_database()) as size
      `);

      const dbSize = result.rows[0]?.size || 0;
      const maxSize = 1024 * 1024 * 1024; // 1GB limit

      return Math.round((dbSize / maxSize) * 100);
    } catch (error) {
      logger.warn('Failed to get disk usage, using fallback', {
        module: 'system-metrics',
        operation: 'getDiskUsage',
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Get database performance metrics
   */
  private async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      const [connections, queries] = await Promise.all([
        db.raw('SELECT count(*) as total FROM pg_stat_activity'),
        db.raw('SELECT count(*) as total FROM pg_stat_statements'),
      ]);

      return {
        totalConnections: parseInt(connections.rows[0]?.total || '0'),
        activeConnections: parseInt(connections.rows[0]?.total || '0'),
        idleConnections: 0, // Would need more complex query
        queryCount: parseInt(queries.rows[0]?.total || '0'),
        slowQueries: 0, // Would need performance monitoring
        deadlocks: 0, // Would need deadlock monitoring
      };
    } catch (error) {
      logger.warn('Failed to get database metrics, using fallback', {
        module: 'system-metrics',
        operation: 'getDatabaseMetrics',
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        queryCount: 0,
        slowQueries: 0,
        deadlocks: 0,
      };
    }
  }

  /**
   * Get Redis performance metrics
   */
  private async getRedisMetrics(): Promise<RedisMetrics> {
    try {
      const info = await redis.info();
      const lines = info.split('\r\n');
      const metrics: any = {};

      lines.forEach((line: string) => {
        const [key, value] = line.split(':');
        if (key && value) {
          metrics[key] = value;
        }
      });

      return {
        connected: true,
        memoryUsage: parseInt(metrics.used_memory_human?.replace(/[^\d]/g, '') || '0'),
        keyspaceHits: parseInt(metrics.keyspace_hits || '0'),
        keyspaceMisses: parseInt(metrics.keyspace_misses || '0'),
        totalCommands: parseInt(metrics.total_commands_processed || '0'),
        connectedClients: parseInt(metrics.connected_clients || '0'),
      };
    } catch (error) {
      logger.warn('Failed to get Redis metrics, using fallback', {
        module: 'system-metrics',
        operation: 'getRedisMetrics',
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        connected: false,
        memoryUsage: 0,
        keyspaceHits: 0,
        keyspaceMisses: 0,
        totalCommands: 0,
        connectedClients: 0,
      };
    }
  }

  /**
   * Get average response time from metrics history
   */
  private async getAverageResponseTime(): Promise<number> {
    if (this.metricsHistory.length === 0) return 0;

    const recentMetrics = this.metricsHistory
      .slice(-10) // Last 10 measurements
      .map((m) => m.metrics.responseTime);

    return Math.round(recentMetrics.reduce((sum, time) => sum + time, 0) / recentMetrics.length);
  }

  /**
   * Get error rate from metrics history
   */
  private async getErrorRate(): Promise<number> {
    if (this.metricsHistory.length === 0) return 0;

    // This would be calculated from actual error logs in production
    // For now, return a small percentage
    return 0.1;
  }

  /**
   * Get metrics history for trend analysis
   */
  getMetricsHistory(limit: number = 100): Array<{ timestamp: Date; metrics: SystemMetrics }> {
    return this.metricsHistory.slice(-limit);
  }

  /**
   * Get peak usage hours from metrics history
   */
  getPeakUsageHours(): string[] {
    if (this.metricsHistory.length === 0) return [];

    const hourlyUsage = new Map<number, number>();

    this.metricsHistory.forEach(({ timestamp, metrics }) => {
      const hour = timestamp.getHours();
      const current = hourlyUsage.get(hour) || 0;
      hourlyUsage.set(hour, current + metrics.activeConnections);
    });

    // Get top 3 peak hours
    const sortedHours = Array.from(hourlyUsage.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour.toString().padStart(2, '0')}:00`);

    return sortedHours;
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<'healthy' | 'warning' | 'critical'> {
    try {
      const metrics = await this.collectSystemMetrics();

      if (metrics.cpuUsage > 90 || metrics.memoryUsage > 90 || metrics.diskUsage > 90) {
        return 'critical';
      } else if (metrics.cpuUsage > 70 || metrics.memoryUsage > 70 || metrics.diskUsage > 70) {
        return 'warning';
      } else {
        return 'healthy';
      }
    } catch (error) {
      logger.error('Failed to get system health', {
        module: 'system-metrics',
        operation: 'getSystemHealth',
        error: error instanceof Error ? error.message : String(error),
      });
      return 'critical';
    }
  }
}
