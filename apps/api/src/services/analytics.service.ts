import { db } from '../db/knex.js';
import { logger } from '../middleware/logging.js';

export interface ApplicationTrend {
  date: string;
  applications: number;
  payments: number;
  admissions: number;
}

export interface ProgramPerformance {
  program: string;
  applications: number;
  conversionRate: number;
  revenue: number;
  avgScore: number;
}

export interface FinancialMetrics {
  totalRevenue: number;
  pendingPayments: number;
  failedPayments: number;
  averagePaymentAmount: number;
  paymentSuccessRate: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

export interface CandidateMetrics {
  totalCandidates: number;
  activeCandidates: number;
  completedRegistrations: number;
  pendingRegistrations: number;
  registrationCompletionRate: number;
  candidatesByDepartment: Array<{ department: string; count: number }>;
  candidatesByMode: Array<{ mode: string; count: number }>;
}

export class AnalyticsService {
  /**
   * Get application trends over time
   */
  async getApplicationTrends(
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<ApplicationTrend[]> {
    try {
      const days =
        timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const trends: ApplicationTrend[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const [applications, payments, admissions] = await Promise.all([
          this.getApplicationsCount(dateStr),
          this.getPaymentsCount(dateStr),
          this.getAdmissionsCount(dateStr),
        ]);

        trends.push({
          date: dateStr,
          applications,
          payments,
          admissions,
        });
      }

      logger.info('Application trends retrieved successfully', {
        module: 'analytics',
        operation: 'getApplicationTrends',
        metadata: { timeRange, days, trendsCount: trends.length },
      });

      return trends;
    } catch (error) {
      logger.error('Failed to get application trends', {
        module: 'analytics',
        operation: 'getApplicationTrends',
        metadata: { timeRange },
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get top performing programs
   */
  async getTopPerformingPrograms(
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<ProgramPerformance[]> {
    try {
      const startDate = this.getStartDate(timeRange);

      const result = await db.raw(
        `
        SELECT 
          d.name as program,
          COUNT(DISTINCT c.id) as applications,
          COUNT(DISTINCT CASE WHEN c.registration_completed = true THEN c.id END) as completed,
          COALESCE(SUM(p.amount), 0) as revenue,
          AVG(c.jamb_score) as avg_score
        FROM candidates c
        LEFT JOIN departments d ON c.department_id = d.id
        LEFT JOIN payments p ON c.id = p.candidate_id
        WHERE c.created_at >= ?
        GROUP BY d.id, d.name
        HAVING COUNT(DISTINCT c.id) > 0
        ORDER BY applications DESC, revenue DESC
        LIMIT 10
      `,
        [startDate]
      );

      const programs: ProgramPerformance[] = result.rows.map((row: any) => ({
        program: row.program || 'Unknown',
        applications: parseInt(row.applications) || 0,
        conversionRate: row.completed > 0 ? row.completed / row.applications : 0,
        revenue: parseFloat(row.revenue) || 0,
        avgScore: parseFloat(row.avg_score) || 0,
      }));

      logger.info('Top performing programs retrieved successfully', {
        module: 'analytics',
        operation: 'getTopPerformingPrograms',
        metadata: { timeRange, programsCount: programs.length },
      });

      return programs;
    } catch (error) {
      logger.error('Failed to get top performing programs', {
        module: 'analytics',
        operation: 'getTopPerformingPrograms',
        metadata: { timeRange },
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get financial metrics
   */
  async getFinancialMetrics(
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<FinancialMetrics> {
    try {
      const startDate = this.getStartDate(timeRange);

      const [
        totalRevenue,
        pendingPayments,
        failedPayments,
        totalPayments,
        successfulPayments,
        monthlyRevenue,
      ] = await Promise.all([
        this.getTotalRevenue(startDate),
        this.getPendingPaymentsCount(startDate),
        this.getFailedPaymentsCount(startDate),
        this.getTotalPaymentsCount(startDate),
        this.getSuccessfulPaymentsCount(startDate),
        this.getMonthlyRevenue(startDate),
      ]);

      const averagePaymentAmount = totalPayments > 0 ? totalRevenue / totalPayments : 0;
      const paymentSuccessRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

      const metrics: FinancialMetrics = {
        totalRevenue,
        pendingPayments,
        failedPayments,
        averagePaymentAmount: Math.round(averagePaymentAmount * 100) / 100,
        paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
        revenueByMonth: monthlyRevenue,
      };

      logger.info('Financial metrics retrieved successfully', {
        module: 'analytics',
        operation: 'getFinancialMetrics',
        metadata: { timeRange, metrics },
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to get financial metrics', {
        module: 'analytics',
        operation: 'getFinancialMetrics',
        metadata: { timeRange },
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        totalRevenue: 0,
        pendingPayments: 0,
        failedPayments: 0,
        averagePaymentAmount: 0,
        paymentSuccessRate: 0,
        revenueByMonth: [],
      };
    }
  }

  /**
   * Get candidate metrics
   */
  async getCandidateMetrics(): Promise<CandidateMetrics> {
    try {
      const [
        totalCandidates,
        activeCandidates,
        completedRegistrations,
        pendingRegistrations,
        candidatesByDepartment,
        candidatesByMode,
      ] = await Promise.all([
        this.getTotalCandidatesCount(),
        this.getActiveCandidatesCount(),
        this.getCompletedRegistrationsCount(),
        this.getPendingRegistrationsCount(),
        this.getCandidatesByDepartment(),
        this.getCandidatesByMode(),
      ]);

      const registrationCompletionRate =
        totalCandidates > 0 ? (completedRegistrations / totalCandidates) * 100 : 0;

      const metrics: CandidateMetrics = {
        totalCandidates,
        activeCandidates,
        completedRegistrations,
        pendingRegistrations,
        registrationCompletionRate: Math.round(registrationCompletionRate * 100) / 100,
        candidatesByDepartment,
        candidatesByMode,
      };

      logger.info('Candidate metrics retrieved successfully', {
        module: 'analytics',
        operation: 'getCandidateMetrics',
        metadata: { metrics },
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to get candidate metrics', {
        module: 'analytics',
        operation: 'getCandidateMetrics',
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        totalCandidates: 0,
        activeCandidates: 0,
        completedRegistrations: 0,
        pendingRegistrations: 0,
        registrationCompletionRate: 0,
        candidatesByDepartment: [],
        candidatesByMode: [],
      };
    }
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<{
    expectedApplications: number;
    projectedRevenue: number;
    capacityUtilization: number;
    riskFactors: string[];
  }> {
    try {
      const currentApplications = await this.getTotalCandidatesCount();
      const currentRevenue = await this.getTotalRevenue(this.getStartDate(timeRange));

      // Simple predictive models based on historical trends
      // In production, this would use more sophisticated ML models
      const growthRate = this.getGrowthRate(timeRange);
      const expectedApplications = Math.round(currentApplications * (1 + growthRate));
      const projectedRevenue = Math.round(currentRevenue * (1 + growthRate * 0.8)); // Revenue grows slower than applications

      // Calculate capacity utilization based on system resources
      const capacityUtilization = await this.getCapacityUtilization();

      // Identify risk factors
      const riskFactors = await this.identifyRiskFactors();

      const analytics = {
        expectedApplications,
        projectedRevenue,
        capacityUtilization,
        riskFactors,
      };

      logger.info('Predictive analytics generated successfully', {
        module: 'analytics',
        operation: 'getPredictiveAnalytics',
        metadata: { timeRange, analytics },
      });

      return analytics;
    } catch (error) {
      logger.error('Failed to generate predictive analytics', {
        module: 'analytics',
        operation: 'getPredictiveAnalytics',
        metadata: { timeRange },
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        expectedApplications: 0,
        projectedRevenue: 0,
        capacityUtilization: 0,
        riskFactors: ['Unable to generate predictions'],
      };
    }
  }

  // Helper methods for data collection
  private async getApplicationsCount(date: string): Promise<number> {
    try {
      const result = await db('candidates')
        .whereRaw('DATE(created_at) = ?', [date])
        .count('* as count')
        .first();

      return parseInt(result?.count as string) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getPaymentsCount(date: string): Promise<number> {
    try {
      const result = await db('payments')
        .whereRaw('DATE(created_at) = ?', [date])
        .count('* as count')
        .first();

      return parseInt(result?.count as string) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getAdmissionsCount(date: string): Promise<number> {
    try {
      const result = await db('admissions')
        .whereRaw('DATE(created_at) = ?', [date])
        .count('* as count')
        .first();

      return parseInt(result?.count as string) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getTotalRevenue(startDate: Date): Promise<number> {
    try {
      const result = await db('payments')
        .where('status', 'completed')
        .where('created_at', '>=', startDate)
        .sum('amount as total')
        .first();

      return parseFloat(result?.total as string) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getPendingPaymentsCount(startDate: Date): Promise<number> {
    try {
      const result = await db('payments')
        .where('status', 'pending')
        .where('created_at', '>=', startDate)
        .count('* as count')
        .first();

      return parseInt(result?.count as string) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getFailedPaymentsCount(startDate: Date): Promise<number> {
    try {
      const result = await db('payments')
        .where('status', 'failed')
        .where('created_at', '>=', startDate)
        .count('* as count')
        .first();

      return parseInt(result?.count as string) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getTotalPaymentsCount(startDate: Date): Promise<number> {
    try {
      const result = await db('payments')
        .where('created_at', '>=', startDate)
        .count('* as count')
        .first();

      return parseInt(result?.count as string) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getSuccessfulPaymentsCount(startDate: Date): Promise<number> {
    try {
      const result = await db('payments')
        .where('status', 'completed')
        .where('created_at', '>=', startDate)
        .count('* as count')
        .first();

      return parseInt(result?.count as string) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getMonthlyRevenue(
    startDate: Date
  ): Promise<Array<{ month: string; revenue: number }>> {
    try {
      const result = await db.raw(
        `
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          SUM(amount) as revenue
        FROM payments
        WHERE status = 'completed' AND created_at >= ?
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month
      `,
        [startDate]
      );

      return result.rows.map((row: any) => ({
        month: row.month,
        revenue: parseFloat(row.revenue) || 0,
      }));
    } catch (error) {
      return [];
    }
  }

  private async getTotalCandidatesCount(): Promise<number> {
    try {
      const result = await db('candidates').count('* as count').first();
      return parseInt(result?.count as string) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getActiveCandidatesCount(): Promise<number> {
    try {
      const result = await db('candidates').where('is_active', true).count('* as count').first();

      return parseInt(result?.count as string) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getCompletedRegistrationsCount(): Promise<number> {
    try {
      const result = await db('candidates')
        .where('registration_completed', true)
        .count('* as count')
        .first();

      return parseInt(result?.count as string) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getPendingRegistrationsCount(): Promise<number> {
    try {
      const result = await db('candidates')
        .where('registration_completed', false)
        .count('* as count')
        .first();

      return parseInt(result?.count as string) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getCandidatesByDepartment(): Promise<Array<{ department: string; count: number }>> {
    try {
      const result = await db.raw(`
        SELECT 
          COALESCE(d.name, 'Unknown') as department,
          COUNT(*) as count
        FROM candidates c
        LEFT JOIN departments d ON c.department_id = d.id
        GROUP BY d.id, d.name
        ORDER BY count DESC
        LIMIT 10
      `);

      return result.rows.map((row: any) => ({
        department: row.department,
        count: parseInt(row.count) || 0,
      }));
    } catch (error) {
      return [];
    }
  }

  private async getCandidatesByMode(): Promise<Array<{ mode: string; count: number }>> {
    try {
      const result = await db.raw(`
        SELECT 
          COALESCE(mode_of_entry, 'Unknown') as mode,
          COUNT(*) as count
        FROM candidates
        GROUP BY mode_of_entry
        ORDER BY count DESC
      `);

      return result.rows.map((row: any) => ({
        mode: row.mode,
        count: parseInt(row.count) || 0,
      }));
    } catch (error) {
      return [];
    }
  }

  private getStartDate(timeRange: string): Date {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    now.setDate(now.getDate() - days);
    return now;
  }

  private getGrowthRate(timeRange: string): number {
    // Simple growth rate calculation based on time range
    // In production, this would be calculated from historical data
    switch (timeRange) {
      case '7d':
        return 0.05; // 5% weekly growth
      case '30d':
        return 0.15; // 15% monthly growth
      case '90d':
        return 0.25; // 25% quarterly growth
      case '1y':
        return 0.4; // 40% yearly growth
      default:
        return 0.15;
    }
  }

  private async getCapacityUtilization(): Promise<number> {
    try {
      // Calculate capacity utilization based on system resources
      // This is a simplified calculation
      const totalCandidates = await this.getTotalCandidatesCount();
      const maxCapacity = 10000; // Example capacity limit

      return Math.min(100, Math.round((totalCandidates / maxCapacity) * 100));
    } catch (error) {
      return 0;
    }
  }

  private async identifyRiskFactors(): Promise<string[]> {
    try {
      const riskFactors: string[] = [];

      // Check for various risk indicators
      const failedPayments = await this.getFailedPaymentsCount(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      if (failedPayments > 10) {
        riskFactors.push('High payment failure rate');
      }

      const pendingRegistrations = await this.getPendingRegistrationsCount();
      if (pendingRegistrations > 1000) {
        riskFactors.push('Large number of pending registrations');
      }

      // Add more risk factor checks as needed

      return riskFactors.length > 0 ? riskFactors : ['No significant risks identified'];
    } catch (error) {
      return ['Unable to assess risks'];
    }
  }
}
