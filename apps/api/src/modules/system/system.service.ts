export class SystemService {
  /**
   * Get system uptime
   */
  getUptime(): number {
    return process.uptime();
  }

  /**
   * Get memory usage
   */
  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Get system information
   */
  getSystemInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: this.getUptime(),
      memoryUsage: this.getMemoryUsage(),
    };
  }
}
