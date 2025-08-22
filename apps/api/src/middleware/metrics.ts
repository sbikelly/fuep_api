import { Request, Response, NextFunction } from 'express';

// Metrics collection interface
export interface MetricData {
  name: string;
  value: number;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  labels: Record<string, string>;
  timestamp: Date;
}

// Performance metrics interface
export interface PerformanceMetrics {
  requestsTotal: number;
  requestDuration: number[];
  errorRate: number;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  activeConnections: number;
}

// Metrics store (in-memory for demonstration, would be Redis/InfluxDB in production)
class MetricsStore {
  private metrics: Map<string, MetricData[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private startTime: Date = new Date();

  // Counter operations
  incrementCounter(name: string, value = 1, labels: Record<string, string> = {}): void {
    const key = this.createKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
    
    this.recordMetric({
      name,
      value: current + value,
      type: 'counter',
      labels,
      timestamp: new Date()
    });
  }

  // Gauge operations
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.createKey(name, labels);
    this.gauges.set(key, value);
    
    this.recordMetric({
      name,
      value,
      type: 'gauge',
      labels,
      timestamp: new Date()
    });
  }

  // Histogram operations
  recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.createKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
    
    this.recordMetric({
      name,
      value,
      type: 'histogram',
      labels,
      timestamp: new Date()
    });
  }

  // Timer operations
  recordTimer(name: string, duration: number, labels: Record<string, string> = {}): void {
    this.recordHistogram(`${name}_duration_ms`, duration, labels);
    
    this.recordMetric({
      name: `${name}_duration`,
      value: duration,
      type: 'timer',
      labels,
      timestamp: new Date()
    });
  }

  private recordMetric(metric: MetricData): void {
    const key = this.createKey(metric.name, metric.labels);
    const existing = this.metrics.get(key) || [];
    existing.push(metric);
    
    // Keep only last 1000 entries per metric to prevent memory issues
    if (existing.length > 1000) {
      existing.shift();
    }
    
    this.metrics.set(key, existing);
  }

  private createKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  // Get metric statistics
  getCounterValue(name: string, labels: Record<string, string> = {}): number {
    const key = this.createKey(name, labels);
    return this.counters.get(key) || 0;
  }

  getGaugeValue(name: string, labels: Record<string, string> = {}): number {
    const key = this.createKey(name, labels);
    return this.gauges.get(key) || 0;
  }

  getHistogramStats(name: string, labels: Record<string, string> = {}): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const key = this.createKey(name, labels);
    const values = this.histograms.get(key) || [];
    
    if (values.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99)
    };
  }

  private percentile(sorted: number[], p: number): number {
    const index = p * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  // Get all metrics summary
  getAllMetrics(): Record<string, any> {
    const summary: Record<string, any> = {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: {},
      uptime: Date.now() - this.startTime.getTime(),
      timestamp: new Date().toISOString()
    };

    // Add histogram statistics
    for (const [key] of this.histograms) {
      const [name] = key.split('{');
      const labels = this.parseLabels(key);
      summary.histograms[key] = this.getHistogramStats(name, labels);
    }

    return summary;
  }

  private parseLabels(key: string): Record<string, string> {
    const match = key.match(/\{(.+)\}/);
    if (!match) return {};
    
    const labels: Record<string, string> = {};
    const labelStr = match[1];
    const pairs = labelStr.split(',');
    
    for (const pair of pairs) {
      const [k, v] = pair.split('=');
      if (k && v) {
        labels[k] = v.replace(/"/g, '');
      }
    }
    
    return labels;
  }

  // Clear old metrics (for memory management)
  clearOldMetrics(olderThanMs = 24 * 60 * 60 * 1000): void { // 24 hours default
    const cutoff = new Date(Date.now() - olderThanMs);
    
    for (const [key, metrics] of this.metrics) {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      if (filtered.length === 0) {
        this.metrics.delete(key);
      } else {
        this.metrics.set(key, filtered);
      }
    }
  }
}

// Global metrics store
export const metricsStore = new MetricsStore();

// HTTP metrics middleware
export const httpMetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const labels = {
    method: req.method,
    route: getRoutePattern(req.path),
    module: getModuleFromPath(req.path)
  };

  // Increment request counter
  metricsStore.incrementCounter('http_requests_total', 1, labels);

  // Track active requests
  metricsStore.setGauge('http_requests_active', 
    metricsStore.getGaugeValue('http_requests_active') + 1
  );

  // Record response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusClass = `${Math.floor(res.statusCode / 100)}xx`;
    
    const responseLabels = {
      ...labels,
      status_code: res.statusCode.toString(),
      status_class: statusClass
    };

    // Record response time
    metricsStore.recordTimer('http_request_duration', duration, responseLabels);
    
    // Record response count by status
    metricsStore.incrementCounter('http_responses_total', 1, responseLabels);
    
    // Track error rate
    if (res.statusCode >= 400) {
      metricsStore.incrementCounter('http_errors_total', 1, responseLabels);
    }

    // Decrement active requests
    metricsStore.setGauge('http_requests_active', 
      Math.max(0, metricsStore.getGaugeValue('http_requests_active') - 1)
    );
  });

  next();
};

// Database metrics helpers
export const recordDatabaseQuery = (
  operation: string, 
  table: string, 
  duration: number, 
  success: boolean = true
) => {
  const labels = { operation, table, status: success ? 'success' : 'error' };
  
  metricsStore.incrementCounter('database_queries_total', 1, labels);
  metricsStore.recordTimer('database_query_duration', duration, labels);
  
  if (!success) {
    metricsStore.incrementCounter('database_errors_total', 1, labels);
  }
};

// Payment metrics helpers
export const recordPaymentEvent = (
  event: string,
  provider: string,
  amount: number,
  success: boolean = true
) => {
  const labels = { event, provider, status: success ? 'success' : 'error' };
  
  metricsStore.incrementCounter('payment_events_total', 1, labels);
  metricsStore.recordHistogram('payment_amount', amount, labels);
  
  if (!success) {
    metricsStore.incrementCounter('payment_errors_total', 1, labels);
  }
};

// Admin metrics helpers
export const recordAdminAction = (
  action: string,
  resource: string,
  adminUserId: string,
  success: boolean = true
) => {
  const labels = { action, resource, status: success ? 'success' : 'error' };
  
  metricsStore.incrementCounter('admin_actions_total', 1, labels);
  
  if (!success) {
    metricsStore.incrementCounter('admin_errors_total', 1, labels);
  }
};

// Candidate metrics helpers
export const recordCandidateAction = (
  action: string,
  candidateId: string,
  success: boolean = true
) => {
  const labels = { action, status: success ? 'success' : 'error' };
  
  metricsStore.incrementCounter('candidate_actions_total', 1, labels);
  
  if (!success) {
    metricsStore.incrementCounter('candidate_errors_total', 1, labels);
  }
};

// System metrics collection
export const collectSystemMetrics = () => {
  const memUsage = process.memoryUsage();
  
  // Memory metrics
  metricsStore.setGauge('system_memory_heap_used_bytes', memUsage.heapUsed);
  metricsStore.setGauge('system_memory_heap_total_bytes', memUsage.heapTotal);
  metricsStore.setGauge('system_memory_external_bytes', memUsage.external);
  metricsStore.setGauge('system_memory_rss_bytes', memUsage.rss);
  
  // Process metrics
  metricsStore.setGauge('system_uptime_seconds', process.uptime());
  metricsStore.setGauge('system_cpu_usage_percent', process.cpuUsage().user / 1000);
};

// Performance monitoring decorator
export const withMetrics = <T extends any[], R>(
  metricName: string,
  labels: Record<string, string> = {}
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: T): Promise<R> {
      const startTime = Date.now();
      let success = true;
      
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        success = false;
        throw error;
      } finally {
        const duration = Date.now() - startTime;
        const finalLabels = { ...labels, method: propertyKey, status: success ? 'success' : 'error' };
        
        metricsStore.recordTimer(metricName, duration, finalLabels);
        metricsStore.incrementCounter(`${metricName}_total`, 1, finalLabels);
        
        if (!success) {
          metricsStore.incrementCounter(`${metricName}_errors`, 1, finalLabels);
        }
      }
    };
    
    return descriptor;
  };
};

// Tracing helpers
export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, any>;
  logs: Array<{ timestamp: number; fields: Record<string, any> }>;
}

class TracingStore {
  private spans: Map<string, TraceSpan> = new Map();
  private activeSpans: Map<string, string> = new Map(); // requestId -> spanId

  createSpan(
    operationName: string,
    traceId: string,
    parentSpanId?: string,
    tags: Record<string, any> = {}
  ): TraceSpan {
    const spanId = `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const span: TraceSpan = {
      traceId,
      spanId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      tags,
      logs: []
    };

    this.spans.set(spanId, span);
    return span;
  }

  finishSpan(spanId: string, tags: Record<string, any> = {}): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.tags = { ...span.tags, ...tags };

    // Record span duration as metric
    metricsStore.recordTimer('trace_span_duration', span.duration, {
      operation: span.operationName,
      trace_id: span.traceId
    });
  }

  addSpanLog(spanId: string, fields: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.logs.push({
      timestamp: Date.now(),
      fields
    });
  }

  getSpan(spanId: string): TraceSpan | undefined {
    return this.spans.get(spanId);
  }

  getTraceSpans(traceId: string): TraceSpan[] {
    return Array.from(this.spans.values())
      .filter(span => span.traceId === traceId)
      .sort((a, b) => a.startTime - b.startTime);
  }

  setActiveSpan(requestId: string, spanId: string): void {
    this.activeSpans.set(requestId, spanId);
  }

  getActiveSpan(requestId: string): TraceSpan | undefined {
    const spanId = this.activeSpans.get(requestId);
    return spanId ? this.spans.get(spanId) : undefined;
  }

  clearOldSpans(olderThanMs = 60 * 60 * 1000): void { // 1 hour default
    const cutoff = Date.now() - olderThanMs;
    
    for (const [spanId, span] of this.spans) {
      if (span.startTime < cutoff) {
        this.spans.delete(spanId);
      }
    }
  }
}

export const tracingStore = new TracingStore();

// Tracing middleware
export const tracingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const traceId = req.headers['x-trace-id'] as string || 
                  (req as any).requestId || 
                  `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const span = tracingStore.createSpan(
    `HTTP ${req.method} ${getRoutePattern(req.path)}`,
    traceId,
    undefined,
    {
      'http.method': req.method,
      'http.url': req.url,
      'http.route': getRoutePattern(req.path),
      'user.ip': getClientIP(req),
      'user.agent': req.get('User-Agent')
    }
  );

  // Set active span for this request
  tracingStore.setActiveSpan((req as any).requestId || traceId, span.spanId);

  // Add trace context to request
  (req as any).traceId = traceId;
  (req as any).spanId = span.spanId;

  // Set response headers
  res.setHeader('X-Trace-ID', traceId);

  res.on('finish', () => {
    tracingStore.finishSpan(span.spanId, {
      'http.status_code': res.statusCode,
      'http.response.size': res.get('Content-Length') || 0
    });
  });

  next();
};

// Helper functions
function getRoutePattern(path: string): string {
  // Convert specific paths to patterns for better grouping
  return path
    .replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[A-Z0-9]{10,}/g, '/:reference');
}

function getModuleFromPath(path: string): string {
  if (path.startsWith('/api/admin')) return 'admin';
  if (path.startsWith('/api/candidates')) return 'candidates';
  if (path.startsWith('/api/payments')) return 'payments';
  if (path.startsWith('/api/documents')) return 'documents';
  if (path.startsWith('/api/auth')) return 'auth';
  return 'api';
}

function getClientIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

// Initialize periodic system metrics collection
setInterval(collectSystemMetrics, 30000); // Every 30 seconds
setInterval(() => metricsStore.clearOldMetrics(), 60 * 60 * 1000); // Every hour
setInterval(() => tracingStore.clearOldSpans(), 60 * 60 * 1000); // Every hour
