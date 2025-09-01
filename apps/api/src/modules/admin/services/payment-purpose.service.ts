import { PaymentPurpose, PaymentPurposeCategory,PaymentPurposeName } from '@fuep/types';

import { db } from '../../../db/knex.js';
import { logger } from '../../../middleware/logging.js';

export interface CreatePaymentPurposeRequest {
  name: PaymentPurposeName;
  purpose: PaymentPurposeName;
  description?: string;
  amount: number;
  isActive: boolean;
  session: string;
  level: string;
  category?: PaymentPurposeCategory; // Changed from facultyId to category
  createdBy?: string;
  updated_at?: Date;
  created_at?: Date;
}

export interface UpdatePaymentPurposeRequest {
  name?: PaymentPurposeName;
  purpose?: PaymentPurposeName;
  description?: string;
  amount?: number;
  isActive?: boolean;
  level?: string;
  category?: PaymentPurposeCategory;
  updated_at?: Date;
}

export interface PaymentPurposeFilters {
  session?: string;
  purpose?: PaymentPurposeName;
  level?: string;
  category?: PaymentPurposeCategory;
  isActive?: boolean;
}

export class PaymentPurposeService {
  /**
   * Create a new payment purpose
   */
  async createPaymentPurpose(request: CreatePaymentPurposeRequest): Promise<PaymentPurpose> {
    try {
      logger.info(
        `[PaymentPurposeService] Creating payment purpose: ${request.name} for session ${request.session}`
      );

      // Check if payment purpose already exists for this session, purpose, level and category
      const existing = await db('payment_purposes')
        .where({
          session: request.session,
          purpose: request.purpose,
          level: request.level,
          category: request.category,
        })
        .first();

      if (existing) {
        throw new Error(
          `Payment purpose ${request.purpose} already exists for session ${request.session} level ${request.level} and category ${request.category}`
        );
      }

      const [paymentPurpose] = await db('payment_purposes')
        .insert({
          name: request.name,
          purpose: request.purpose,
          description: request.description,
          amount: request.amount,
          session: request.session,
          level: request.level,
          category: request.category,
          is_active: true,
          created_by: request.createdBy,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');

      logger.info(
        `[PaymentPurposeService] Payment purpose created successfully with ID: ${paymentPurpose.id}`
      );

      return this.mapDatabaseToType(paymentPurpose);
    } catch (error) {
      logger.error(`[PaymentPurposeService] Failed to create payment purpose: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment purposes with optional filtering
   */
  async getPaymentPurposes(filters: PaymentPurposeFilters = {}): Promise<PaymentPurpose[]> {
    try {
      logger.info(
        `[PaymentPurposeService] Getting payment purposes with filters: ${JSON.stringify(filters)}`
      );

      let query = db('payment_purposes').select('*');

      if (filters.session) {
        query = query.where('session', filters.session);
      }

      if (filters.purpose) {
        query = query.where('purpose', filters.purpose);
      }

      if (filters.level) {
        query = query.where('level', filters.level);
      }

      if (filters.category) {
        query = query.where('category', filters.category);
      }

      if (filters.isActive !== undefined) {
        query = query.where('is_active', filters.isActive);
      }

      const paymentPurposes = await query.orderBy(['session', 'level', 'purpose']);

      logger.info(`[PaymentPurposeService] Found ${paymentPurposes.length} payment purposes`);

      return paymentPurposes.map(this.mapDatabaseToType);
    } catch (error) {
      logger.error(`[PaymentPurposeService] Failed to get payment purposes: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment purpose by ID
   */
  async getPaymentPurposeById(id: string): Promise<PaymentPurpose | null> {
    try {
      logger.info(`[PaymentPurposeService] Getting payment purpose by ID: ${id}`);

      const paymentPurpose = await db('payment_purposes').where('id', id).first();

      if (!paymentPurpose) {
        logger.warn(`[PaymentPurposeService] Payment purpose not found with ID: ${id}`);
        return null;
      }

      return this.mapDatabaseToType(paymentPurpose);
    } catch (error) {
      logger.error(`[PaymentPurposeService] Failed to get payment purpose by ID: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment purpose by session, purpose, and level
   */
  async getPaymentPurposeByKey(
    session: string,
    purpose: PaymentPurpose,
    level: string
  ): Promise<PaymentPurpose | null> {
    try {
      logger.info(
        `[PaymentPurposeService] Getting payment purpose by key: ${session}/${purpose}/${level}`
      );

      const paymentPurpose = await db('payment_purposes')
        .where({
          session,
          purpose,
          level,
        })
        .first();

      if (!paymentPurpose) {
        logger.warn(
          `[PaymentPurposeService] Payment purpose not found with key: ${session}/${purpose}/${level}`
        );
        return null;
      }

      return this.mapDatabaseToType(paymentPurpose);
    } catch (error) {
      logger.error(`[PaymentPurposeService] Failed to get payment purpose by key: ${error}`);
      throw error;
    }
  }

  /**
   * Update payment purpose
   */
  async updatePaymentPurpose(
    id: string,
    updates: UpdatePaymentPurposeRequest
  ): Promise<PaymentPurpose> {
    try {
      logger.info(`[PaymentPurposeService] Updating payment purpose with ID: ${id}`);

      const updateData: any = {
        updated_at: new Date(),
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.level !== undefined) updateData.level = updates.level;
      if (updates.category !== undefined) updateData.category = updates.category;

      const [updatedPaymentPurpose] = await db('payment_purposes')
        .where('id', id)
        .update(updateData)
        .returning('*');

      if (!updatedPaymentPurpose) {
        throw new Error(`Payment purpose with ID ${id} not found`);
      }

      logger.info(`[PaymentPurposeService] Payment purpose updated successfully`);

      return this.mapDatabaseToType(updatedPaymentPurpose);
    } catch (error) {
      logger.error(`[PaymentPurposeService] Failed to update payment purpose: ${error}`);
      throw error;
    }
  }

  /**
   * Delete payment purpose
   */
  async deletePaymentPurpose(id: string): Promise<void> {
    try {
      logger.info(`[PaymentPurposeService] Deleting payment purpose with ID: ${id}`);

      const deletedCount = await db('payment_purposes').where('id', id).del();

      if (deletedCount === 0) {
        throw new Error(`Payment purpose with ID ${id} not found`);
      }

      logger.info(`[PaymentPurposeService] Payment purpose deleted successfully`);
    } catch (error) {
      logger.error(`[PaymentPurposeService] Failed to delete payment purpose: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment purposes for a specific session
   */
  async getPaymentPurposesBySession(session: string): Promise<PaymentPurpose[]> {
    try {
      logger.info(`[PaymentPurposeService] Getting payment purposes for session: ${session}`);

      const paymentPurposes = await db('payment_purposes')
        .where('session', session)
        .andWhere('is_active', true)
        .orderBy(['level', 'purpose']);

      logger.info(
        `[PaymentPurposeService] Found ${paymentPurposes.length} active payment purposes for session ${session}`
      );

      return paymentPurposes.map(this.mapDatabaseToType);
    } catch (error) {
      logger.error(`[PaymentPurposeService] Failed to get payment purposes by session: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment purposes by level
   */
  async getPaymentPurposesByLevel(level: string): Promise<PaymentPurpose[]> {
    try {
      logger.info(`[PaymentPurposeService] Getting payment purposes for level: ${level}`);

      const paymentPurposes = await db('payment_purposes')
        .where('level', level)
        .andWhere('is_active', true)
        .orderBy(['session', 'purpose']);

      if (paymentPurposes.length === 0) {
        logger.warn(`[PaymentPurposeService] No payment purposes found for level ${level}`);
        throw new Error(`No payment purposes found for level ${level}`);
      }

      logger.info(
        `[PaymentPurposeService] Found ${paymentPurposes.length} active payment purposes for level ${level}`
      );

      return paymentPurposes.map(this.mapDatabaseToType);
    } catch (error) {
      logger.error(`[PaymentPurposeService] Failed to get payment purposes by level: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment purposes by purpose name or purpose
   */
  async getPaymentPurposesByPurpose(purpose: PaymentPurposeName): Promise<PaymentPurpose[]> {
    try {
      logger.info(`[PaymentPurposeService] Getting payment purposes for purpose: ${purpose}`);

      const paymentPurposes = await db('payment_purposes')
        .where('purpose', purpose)
        .andWhere('is_active', true)
        .orderBy(['session', 'level']);

      if (paymentPurposes.length === 0) {
        logger.warn(`[PaymentPurposeService] No payment purposes found for faculty ${purpose}`);
        throw new Error(`No payment purposes found for faculty ${purpose}`);
      }

      logger.info(
        `[PaymentPurposeService] Found ${paymentPurposes.length} active payment purposes for purpose ${purpose}`
      );

      return paymentPurposes.map(this.mapDatabaseToType);
    } catch (error) {
      logger.error(`[PaymentPurposeService] Failed to get payment purposes by purpose: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment purpose by category
   */
  async getPaymentPurposesByCategory(category: PaymentPurposeCategory): Promise<PaymentPurpose[]> {
    try {
      logger.info(`[PaymentPurposeService] Getting payment purposes for category: ${category}`);

      const paymentPurposes = await db('payment_purposes')
        .where('category', category)
        .andWhere('is_active', true)
        .orderBy(['session', 'level', 'purpose']);

      if (paymentPurposes.length === 0) {
        logger.warn(`[PaymentPurposeService] No payment purposes found for category ${category}`);
        throw new Error(`No payment purposes found for category ${category}`);
      }

      logger.info(
        `[PaymentPurposeService] Found ${paymentPurposes.length} active payment purposes for category ${category}`
      );

      return paymentPurposes.map(this.mapDatabaseToType);
    } catch (error) {
      logger.error(`[PaymentPurposeService] Failed to get payment purposes by category: ${error}`);
      throw error;
    }
  }

  /**
   * Toggle payment purpose active status
   */
  async togglePaymentPurposeStatus(id: string): Promise<PaymentPurpose> {
    try {
      logger.info(`[PaymentPurposeService] Toggling payment purpose status for ID: ${id}`);

      const paymentPurpose = await this.getPaymentPurposeById(id);
      if (!paymentPurpose) {
        throw new Error(`Payment purpose with ID ${id} not found`);
      }

      const newStatus = !paymentPurpose.isActive;
      return await this.updatePaymentPurpose(id, { isActive: newStatus });
    } catch (error) {
      logger.error(`[PaymentPurposeService] Failed to toggle payment purpose status: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment purpose statistics
   */
  async getPaymentPurposeStatistics(): Promise<any> {
    try {
      logger.info(`[PaymentPurposeService] Getting payment purpose statistics`);

      const [totalCount, activeCount, sessionCount, levelCount] = await Promise.all([
        db('payment_purposes').count('* as total').first(),
        db('payment_purposes').where('is_active', true).count('* as active').first(),
        db('payment_purposes').distinct('session').count('* as sessions').first(),
        db('payment_purposes').distinct('level').count('* as levels').first(),
      ]);

      const purposeBreakdown = await db('payment_purposes')
        .select('purpose')
        .count('* as count')
        .groupBy('purpose');

      const purposeMap = purposeBreakdown.reduce((acc: any, item: any) => {
        acc[item.purpose] = parseInt(item.count);
        return acc;
      }, {});

      const stats = {
        total: parseInt((totalCount?.total as string) || '0'),
        active: parseInt((activeCount?.active as string) || '0'),
        sessions: parseInt((sessionCount?.sessions as string) || '0'),
        levels: parseInt((levelCount?.levels as string) || '0'),
        byPurpose: purposeMap,
      };

      logger.info(`[PaymentPurposeService] Statistics retrieved successfully`);

      return stats;
    } catch (error) {
      logger.error(`[PaymentPurposeService] Failed to get payment purpose statistics: ${error}`);
      throw error;
    }
  }

  /**
   * Map database record to type interface
   */
  private mapDatabaseToType(dbRecord: any): PaymentPurpose {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      purpose: dbRecord.purpose as PaymentPurposeName,
      description: dbRecord.description,
      amount: parseFloat(dbRecord.amount),
      isActive: dbRecord.is_active,
      session: dbRecord.session,
      level: dbRecord.level,
      category: dbRecord.category,
      createdBy: dbRecord.created_by,
      createdAt: new Date(dbRecord.created_at),
      updatedAt: new Date(dbRecord.updated_at),
    };
  }
}
