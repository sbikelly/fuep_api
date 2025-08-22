import { Request, Response, NextFunction } from 'express';
import { logger } from './logging.js';
import { metricsStore } from './metrics.js';

// Cache interface
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  lastAccessed: number;
  hits: number;
}

// Cache configuration
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  refreshThreshold?: number; // Refresh when TTL is below this threshold (in milliseconds)
}

// In-memory cache implementation (would use Redis in production)
class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTtl: number;
  private maxSize: number;

  constructor(defaultTtl = 60000, maxSize = 1000) { // 1 minute default TTL
    this.defaultTtl = defaultTtl;
    this.maxSize = maxSize;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      key,
      value,
      ttl: ttl || this.defaultTtl,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      hits: 0
    };

    // Remove expired entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictExpired();
    }

    // If still full, use LRU eviction
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    
    // Record cache metrics
    metricsStore.incrementCounter('cache_sets_total', 1, { operation: 'set' });
    metricsStore.setGauge('cache_size', this.cache.size);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      metricsStore.incrementCounter('cache_misses_total', 1, { operation: 'get' });
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      metricsStore.incrementCounter('cache_misses_total', 1, { operation: 'get', reason: 'expired' });
      metricsStore.setGauge('cache_size', this.cache.size);
      return null;
    }

    // Update access info
    entry.lastAccessed = Date.now();
    entry.hits++;

    metricsStore.incrementCounter('cache_hits_total', 1, { operation: 'get' });
    return entry.value;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      metricsStore.incrementCounter('cache_deletes_total', 1, { operation: 'delete' });
      metricsStore.setGauge('cache_size', this.cache.size);
    }
    return deleted;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      metricsStore.setGauge('cache_size', this.cache.size);
      return false;
    }
    
    return true;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    metricsStore.incrementCounter('cache_clears_total', 1, { operation: 'clear' });
    metricsStore.setGauge('cache_size', 0);
    logger.info(`Cache cleared, removed ${size} entries`);
  }

  // Cache invalidation patterns
  invalidatePattern(pattern: string): number {
    let removed = 0;
    const regex = new RegExp(pattern);
    
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      metricsStore.incrementCounter('cache_invalidations_total', removed, { 
        operation: 'invalidate_pattern',
        pattern 
      });
      metricsStore.setGauge('cache_size', this.cache.size);
      logger.info(`Invalidated ${removed} cache entries matching pattern: ${pattern}`);
    }
    
    return removed;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let totalHits = 0;
    const sizes: number[] = [];

    for (const entry of this.cache.values()) {
      if (this.isExpired(entry)) {
        expired++;
      }
      totalHits += entry.hits;
      sizes.push(JSON.stringify(entry.value).length);
    }

    const totalSize = sizes.reduce((a, b) => a + b, 0);
    const avgSize = sizes.length > 0 ? totalSize / sizes.length : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      totalHits,
      averageHits: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      totalSizeBytes: totalSize,
      averageSizeBytes: avgSize,
      hitRate: this.calculateHitRate(),
      oldestEntry: this.getOldestEntry(),
      newestEntry: this.getNewestEntry()
    };
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt > entry.ttl;
  }

  private evictExpired(): void {
    let removed = 0;
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      metricsStore.incrementCounter('cache_evictions_total', removed, { reason: 'expired' });
      logger.debug(`Evicted ${removed} expired cache entries`);
    }
  }

  private evictLRU(): void {
    if (this.cache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      metricsStore.incrementCounter('cache_evictions_total', 1, { reason: 'lru' });
      logger.debug(`Evicted LRU cache entry: ${oldestKey}`);
    }
  }

  private calculateHitRate(): number {
    const hits = metricsStore.getCounterValue('cache_hits_total');
    const misses = metricsStore.getCounterValue('cache_misses_total');
    const total = hits + misses;
    return total > 0 ? hits / total : 0;
  }

  private getOldestEntry(): Date | null {
    let oldest: Date | null = null;
    for (const entry of this.cache.values()) {
      if (!oldest || entry.createdAt < oldest.getTime()) {
        oldest = new Date(entry.createdAt);
      }
    }
    return oldest;
  }

  private getNewestEntry(): Date | null {
    let newest: Date | null = null;
    for (const entry of this.cache.values()) {
      if (!newest || entry.createdAt > newest.getTime()) {
        newest = new Date(entry.createdAt);
      }
    }
    return newest;
  }
}

// Cache instances for different types of data
export const cacheInstances = {
  // Fast cache for frequently accessed data (30 seconds)
  fast: new MemoryCache(30 * 1000, 500),
  
  // Standard cache for normal data (5 minutes)
  standard: new MemoryCache(5 * 60 * 1000, 1000),
  
  // Slow cache for expensive operations (30 minutes)
  slow: new MemoryCache(30 * 60 * 1000, 200),
  
  // Static cache for configuration data (1 hour)
  static: new MemoryCache(60 * 60 * 1000, 100)
};

// Cache key generators
export const generateCacheKey = (prefix: string, ...parts: (string | number)[]): string => {
  return `${prefix}:${parts.join(':')}`;
};

export const generateUserCacheKey = (userId: string, operation: string, ...params: (string | number)[]): string => {
  return generateCacheKey('user', userId, operation, ...params);
};

export const generateAdminCacheKey = (operation: string, ...params: (string | number)[]): string => {
  return generateCacheKey('admin', operation, ...params);
};

// HTTP response caching middleware
export const createCacheMiddleware = (
  cacheInstance: MemoryCache = cacheInstances.standard,
  ttl?: number,
  keyGenerator?: (req: Request) => string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator ? keyGenerator(req) : `${req.path}:${JSON.stringify(req.query)}`;
    
    // Try to get from cache
    const cachedResponse = cacheInstance.get(cacheKey);
    
    if (cachedResponse) {
              logger.debug('Serving from cache', {
          module: 'cache',
          operation: 'hit',
          metadata: { cacheKey, path: req.path }
        });
      
      // Set cache headers
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);
      
      return res.json(cachedResponse);
    }

    // Cache miss - intercept response
    const originalSend = res.json.bind(res);
    
    res.json = function(body: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheInstance.set(cacheKey, body, ttl);
        
        logger.debug('Cached response', {
          module: 'cache',
          operation: 'set',
          metadata: { cacheKey, path: req.path, statusCode: res.statusCode }
        });
      }
      
      // Set cache headers
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);
      
      return originalSend(body);
    };

    next();
  };
};

// Cache warming functions
export const warmCache = async () => {
  logger.info('Starting cache warming...');
  
  try {
    // Warm frequently accessed endpoints
    await warmAdminCache();
    await warmCandidateCache();
    await warmStaticDataCache();
    
    logger.info('Cache warming completed successfully');
  } catch (error) {
    logger.error('Cache warming failed', { 
      error: error instanceof Error ? error : String(error) 
    });
  }
};

const warmAdminCache = async () => {
  // Pre-populate admin dashboard data
  const adminDashboardKey = generateAdminCacheKey('dashboard');
  
  // This would normally fetch from database
  const mockDashboardData = {
    totalCandidates: 1500,
    totalPayments: 750,
    totalApplications: 1200,
    recentActivity: []
  };
  
  cacheInstances.fast.set(adminDashboardKey, mockDashboardData);
  logger.debug('Warmed admin dashboard cache');
};

const warmCandidateCache = async () => {
  // Pre-populate candidate static data
  const candidateStatsKey = generateCacheKey('candidates', 'stats');
  
  const mockStats = {
    totalRegistered: 1500,
    applicationsPending: 200,
    paymentsCompleted: 750
  };
  
  cacheInstances.standard.set(candidateStatsKey, mockStats);
  logger.debug('Warmed candidate stats cache');
};

const warmStaticDataCache = async () => {
  // Pre-populate payment types, programs, etc.
  const paymentTypesKey = generateCacheKey('static', 'payment-types');
  const programsKey = generateCacheKey('static', 'programs');
  
  const mockPaymentTypes = [
    { id: 1, name: 'Post-UTME', amount: 2000 },
    { id: 2, name: 'Acceptance', amount: 5000 },
    { id: 3, name: 'School Fee', amount: 50000 }
  ];
  
  const mockPrograms = [
    { code: 'COSC', name: 'Computer Science' },
    { code: 'MATH', name: 'Mathematics' },
    { code: 'PHYS', name: 'Physics' }
  ];
  
  cacheInstances.static.set(paymentTypesKey, mockPaymentTypes);
  cacheInstances.static.set(programsKey, mockPrograms);
  
  logger.debug('Warmed static data cache');
};

// Cache invalidation helpers
export const invalidateUserCache = (userId: string): void => {
  const pattern = `user:${userId}:.*`;
  let totalInvalidated = 0;
  
  for (const cache of Object.values(cacheInstances)) {
    totalInvalidated += cache.invalidatePattern(pattern);
  }
  
  logger.info(`Invalidated ${totalInvalidated} cache entries for user ${userId}`);
};

export const invalidateAdminCache = (operation?: string): void => {
  const pattern = operation ? `admin:${operation}:.*` : 'admin:.*';
  let totalInvalidated = 0;
  
  for (const cache of Object.values(cacheInstances)) {
    totalInvalidated += cache.invalidatePattern(pattern);
  }
  
  logger.info(`Invalidated ${totalInvalidated} admin cache entries`);
};

export const invalidateCandidateCache = (candidateId?: string): void => {
  const pattern = candidateId ? `candidates:${candidateId}:.*` : 'candidates:.*';
  let totalInvalidated = 0;
  
  for (const cache of Object.values(cacheInstances)) {
    totalInvalidated += cache.invalidatePattern(pattern);
  }
  
  logger.info(`Invalidated ${totalInvalidated} candidate cache entries`);
};

// Cache decorator for methods
export const cacheable = (
  cacheInstance: MemoryCache = cacheInstances.standard,
  ttl?: number,
  keyGenerator?: (...args: any[]) => string
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator 
        ? keyGenerator(...args)
        : `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      
      // Try cache first
      const cached = cacheInstance.get(cacheKey);
      if (cached !== null) {
        logger.debug(`Cache hit for ${propertyKey}`, { 
          metadata: { cacheKey, method: propertyKey }
        });
        return cached;
      }
      
      // Execute original method
      try {
        const result = await originalMethod.apply(this, args);
        
        // Cache the result
        cacheInstance.set(cacheKey, result, ttl);
        
        logger.debug(`Cache miss for ${propertyKey}, result cached`, { 
          metadata: { cacheKey, method: propertyKey }
        });
        
        return result;
      } catch (error) {
        // Don't cache errors
        logger.debug(`Cache miss for ${propertyKey}, error not cached`, { 
          metadata: { 
            cacheKey, 
            method: propertyKey,
            error: error instanceof Error ? error.message : String(error)
          }
        });
        throw error;
      }
    };
    
    return descriptor;
  };
};

// Cache health check endpoint data
export const getCacheHealth = () => {
  const health: Record<string, any> = {};
  
  for (const [name, cache] of Object.entries(cacheInstances)) {
    health[name] = cache.getStats();
  }
  
  return {
    caches: health,
    globalStats: {
      totalHits: metricsStore.getCounterValue('cache_hits_total'),
      totalMisses: metricsStore.getCounterValue('cache_misses_total'),
      totalSets: metricsStore.getCounterValue('cache_sets_total'),
      totalEvictions: metricsStore.getCounterValue('cache_evictions_total'),
      hitRate: calculateGlobalHitRate()
    }
  };
};

const calculateGlobalHitRate = (): number => {
  const hits = metricsStore.getCounterValue('cache_hits_total');
  const misses = metricsStore.getCounterValue('cache_misses_total');
  const total = hits + misses;
  return total > 0 ? (hits / total) * 100 : 0;
};

// Periodic cache maintenance
const performCacheMaintenance = () => {
  logger.debug('Performing cache maintenance...');
  
  for (const [name, cache] of Object.entries(cacheInstances)) {
    const stats = cache.getStats();
    logger.debug(`Cache ${name} stats:`, { 
      metadata: stats 
    });
    
    // Log cache performance metrics
    metricsStore.setGauge(`cache_${name}_size`, stats.size);
    metricsStore.setGauge(`cache_${name}_hit_rate`, stats.hitRate);
  }
};

// Initialize cache maintenance
setInterval(performCacheMaintenance, 60000); // Every minute

// Warm cache on startup (with delay to allow services to initialize)
setTimeout(warmCache, 5000);
