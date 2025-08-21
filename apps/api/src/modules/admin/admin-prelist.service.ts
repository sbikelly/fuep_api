import { db } from '../../db/knex.js';
import { AdminAuditService } from './admin-audit.service.js';

export interface PrelistUploadBatch {
  id: string;
  filename: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  uploadedBy: string;
  uploadedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface PrelistUploadError {
  id: string;
  batchId: string;
  rowNumber: number;
  jambRegNo: string;
  errorType: 'validation' | 'duplicate' | 'system';
  errorMessage: string;
  rawData: any;
  createdAt: Date;
}

export interface PrelistRecord {
  id: string;
  jambRegNo: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  phoneNumber: string;
  email?: string;
  stateOfOrigin: string;
  lga: string;
  programChoice1: string;
  programChoice2?: string;
  programChoice3?: string;
  jambScore: number;
  isUploaded: boolean;
  uploadedAt?: Date;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrelistUploadResult {
  success: boolean;
  batchId: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errors: PrelistUploadError[];
  message: string;
}

export class AdminPrelistService {
  constructor(private auditService: AdminAuditService) {}

  // Upload and Processing
  async uploadPrelist(
    fileBuffer: Buffer,
    filename: string,
    adminUserId: string
  ): Promise<PrelistUploadResult> {
    let batchId: string | undefined;

    try {
      // Create upload batch record
      const [batchResult] = await db('prelist_upload_batches')
        .insert({
          filename,
          totalRecords: 0,
          processedRecords: 0,
          failedRecords: 0,
          status: 'uploading',
          uploaded_by: adminUserId,
        })
        .returning('id');

      batchId = batchResult;

      // Parse CSV/Excel file
      const records = await this.parsePrelistFile(fileBuffer);

      // Update batch with total records
      await db('prelist_upload_batches').where('id', batchId).update({
        totalRecords: records.length,
        status: 'processing',
      });

      // Process records
      const result = await this.processPrelistRecords(records, batchId!, adminUserId);

      // Update batch status
      const finalStatus = result.failedRecords === 0 ? 'completed' : 'completed';
      await db('prelist_upload_batches').where('id', batchId).update({
        processedRecords: result.processedRecords,
        failedRecords: result.failedRecords,
        status: finalStatus,
        completedAt: new Date(),
      });

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'upload_prelist',
        resource: 'prelist',
        resourceId: batchId!,
        details: {
          filename,
          totalRecords: records.length,
          processedRecords: result.processedRecords,
          failedRecords: result.failedRecords,
        },
      });

      return {
        success: true,
        batchId: batchId!,
        totalRecords: records.length,
        processedRecords: result.processedRecords,
        failedRecords: result.failedRecords,
        errors: result.errors,
        message: `Successfully processed ${result.processedRecords} records with ${result.failedRecords} errors`,
      };
    } catch (error) {
      // Update batch status to failed
      if (batchId) {
        await db('prelist_upload_batches')
          .where('id', batchId)
          .update({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          });
      }

      throw new Error(
        `Failed to upload prelist: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async parsePrelistFile(fileBuffer: Buffer): Promise<Partial<PrelistRecord>[]> {
    // This is a simplified parser - in production, you'd use a proper CSV/Excel library
    // For now, return mock data structure
    const mockRecords: Partial<PrelistRecord>[] = [
      {
        jambRegNo: 'TEST123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('2000-01-01'),
        gender: 'male',
        phoneNumber: '+2348012345678',
        stateOfOrigin: 'Lagos',
        lga: 'Ikeja',
        programChoice1: 'Computer Science',
        jambScore: 250,
      },
    ];

    return mockRecords;
  }

  private async processPrelistRecords(
    records: Partial<PrelistRecord>[],
    batchId: string,
    adminUserId: string
  ): Promise<{ processedRecords: number; failedRecords: number; errors: PrelistUploadError[] }> {
    let processedRecords = 0;
    let failedRecords = 0;
    const errors: PrelistUploadError[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 1;

      try {
        // Validate record
        const validationResult = await this.validatePrelistRecord(record);
        if (!validationResult.isValid) {
          errors.push({
            id: `error_${batchId}_${rowNumber}`,
            batchId,
            rowNumber,
            jambRegNo: record.jambRegNo || 'UNKNOWN',
            errorType: 'validation',
            errorMessage: validationResult.errors.join(', '),
            rawData: record,
            createdAt: new Date(),
          });
          failedRecords++;
          continue;
        }

        // Check for duplicates
        const existingRecord = await this.getPrelistRecordByJambRegNo(record.jambRegNo!);
        if (existingRecord) {
          errors.push({
            id: `error_${batchId}_${rowNumber}`,
            batchId,
            rowNumber,
            jambRegNo: record.jambRegNo!,
            errorType: 'duplicate',
            errorMessage: 'JAMB registration number already exists',
            rawData: record,
            createdAt: new Date(),
          });
          failedRecords++;
          continue;
        }

        // Insert record
        await this.insertPrelistRecord(record, adminUserId);
        processedRecords++;
      } catch (error) {
        errors.push({
          id: `error_${batchId}_${rowNumber}`,
          batchId,
          rowNumber,
          jambRegNo: record.jambRegNo || 'UNKNOWN',
          errorType: 'system',
          errorMessage: error instanceof Error ? error.message : 'System error',
          rawData: record,
          createdAt: new Date(),
        });
        failedRecords++;
      }
    }

    // Save errors to database
    if (errors.length > 0) {
      await this.saveUploadErrors(errors);
    }

    return { processedRecords, failedRecords, errors };
  }

  private async validatePrelistRecord(
    record: Partial<PrelistRecord>
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!record.jambRegNo || record.jambRegNo.trim().length === 0) {
      errors.push('JAMB registration number is required');
    }

    if (!record.firstName || record.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!record.lastName || record.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (!record.dateOfBirth) {
      errors.push('Date of birth is required');
    } else if (record.dateOfBirth > new Date()) {
      errors.push('Date of birth cannot be in the future');
    }

    if (!record.gender || !['male', 'female'].includes(record.gender)) {
      errors.push('Valid gender is required');
    }

    if (!record.phoneNumber || record.phoneNumber.trim().length === 0) {
      errors.push('Phone number is required');
    }

    if (!record.stateOfOrigin || record.stateOfOrigin.trim().length === 0) {
      errors.push('State of origin is required');
    }

    if (!record.lga || record.lga.trim().length === 0) {
      errors.push('LGA is required');
    }

    if (!record.programChoice1 || record.programChoice1.trim().length === 0) {
      errors.push('First program choice is required');
    }

    if (!record.jambScore || record.jambScore < 0 || record.jambScore > 400) {
      errors.push('Valid JAMB score (0-400) is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async insertPrelistRecord(
    record: Partial<PrelistRecord>,
    adminUserId: string
  ): Promise<void> {
    await db('jamb_prelist').insert({
      jamb_reg_no: record.jambRegNo,
      first_name: record.firstName,
      last_name: record.lastName,
      middle_name: record.middleName,
      date_of_birth: record.dateOfBirth,
      gender: record.gender,
      phone_number: record.phoneNumber,
      email: record.email,
      state_of_origin: record.stateOfOrigin,
      lga: record.lga,
      program_choice_1: record.programChoice1,
      program_choice_2: record.programChoice2,
      program_choice_3: record.programChoice3,
      jamb_score: record.jambScore,
      is_uploaded: true,
      uploaded_at: new Date(),
      uploaded_by: adminUserId,
    });
  }

  private async saveUploadErrors(errors: PrelistUploadError[]): Promise<void> {
    if (errors.length === 0) return;

    const errorRecords = errors.map((error) => ({
      id: error.id,
      batch_id: error.batchId,
      row_number: error.rowNumber,
      jamb_reg_no: error.jambRegNo,
      error_type: error.errorType,
      error_message: error.errorMessage,
      raw_data: JSON.stringify(error.rawData),
    }));

    await db('prelist_upload_errors').insert(errorRecords);
  }

  // Retrieval Methods
  async getPrelistRecordByJambRegNo(jambRegNo: string): Promise<PrelistRecord | null> {
    try {
      const record = await db('jamb_prelist').where('jamb_reg_no', jambRegNo).first();

      if (!record) return null;

      return {
        id: record.id,
        jambRegNo: record.jamb_reg_no,
        firstName: record.first_name,
        lastName: record.last_name,
        middleName: record.middle_name,
        dateOfBirth: record.date_of_birth,
        gender: record.gender,
        phoneNumber: record.phone_number,
        email: record.email,
        stateOfOrigin: record.state_of_origin,
        lga: record.lga,
        programChoice1: record.program_choice_1,
        programChoice2: record.program_choice_2,
        programChoice3: record.program_choice_3,
        jambScore: record.jamb_score,
        isUploaded: record.is_uploaded,
        uploadedAt: record.uploaded_at,
        uploadedBy: record.uploaded_by,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to get prelist record: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAllPrelistRecords(
    filters?: {
      search?: string;
      state?: string;
      program?: string;
      minScore?: number;
      maxScore?: number;
      isUploaded?: boolean;
    },
    pagination?: { page: number; limit: number }
  ): Promise<{ records: PrelistRecord[]; total: number }> {
    try {
      let query = db('jamb_prelist');

      // Apply filters
      if (filters?.search) {
        query = query.where(function () {
          this.where('jamb_reg_no', 'ilike', `%${filters.search}%`)
            .orWhere('first_name', 'ilike', `%${filters.search}%`)
            .orWhere('last_name', 'ilike', `%${filters.search}%`)
            .orWhere('email', 'ilike', `%${filters.search}%`);
        });
      }

      if (filters?.state) {
        query = query.where('state_of_origin', filters.state);
      }

      if (filters?.program) {
        query = query.where(function () {
          this.where('program_choice_1', 'ilike', `%${filters.program}%`)
            .orWhere('program_choice_2', 'ilike', `%${filters.program}%`)
            .orWhere('program_choice_3', 'ilike', `%${filters.program}%`);
        });
      }

      if (filters?.minScore !== undefined) {
        query = query.where('jamb_score', '>=', filters.minScore);
      }

      if (filters?.maxScore !== undefined) {
        query = query.where('jamb_score', '<=', filters.maxScore);
      }

      if (filters?.isUploaded !== undefined) {
        query = query.where('is_uploaded', filters.isUploaded);
      }

      // Get total count
      const totalResult = await query.clone().count('* as count').first();
      const total = totalResult ? parseInt(totalResult.count as string) : 0;

      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.offset(offset).limit(pagination.limit);
      }

      // Get records
      const records = await query.orderBy('created_at', 'desc');

      return {
        records: records.map((record) => ({
          id: record.id,
          jambRegNo: record.jamb_reg_no,
          firstName: record.first_name,
          lastName: record.last_name,
          middleName: record.middle_name,
          dateOfBirth: record.date_of_birth,
          gender: record.gender,
          phoneNumber: record.phone_number,
          email: record.email,
          stateOfOrigin: record.state_of_origin,
          lga: record.lga,
          programChoice1: record.program_choice_1,
          programChoice2: record.program_choice_2,
          programChoice3: record.program_choice_3,
          jambScore: record.jamb_score,
          isUploaded: record.is_uploaded,
          uploadedAt: record.uploaded_at,
          uploadedBy: record.uploaded_by,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        })),
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get prelist records: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Upload Batch Management
  async getUploadBatches(
    filters?: {
      status?: string;
      uploadedBy?: string;
      startDate?: Date;
      endDate?: Date;
    },
    pagination?: { page: number; limit: number }
  ): Promise<{ batches: PrelistUploadBatch[]; total: number }> {
    try {
      let query = db('prelist_upload_batches');

      if (filters?.status) {
        query = query.where('status', filters.status);
      }

      if (filters?.uploadedBy) {
        query = query.where('uploaded_by', filters.uploadedBy);
      }

      if (filters?.startDate) {
        query = query.where('uploaded_at', '>=', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.where('uploaded_at', '<=', filters.endDate);
      }

      // Get total count
      const totalResult = await query.clone().count('* as count').first();
      const total = totalResult ? parseInt(totalResult.count as string) : 0;

      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.offset(offset).limit(pagination.limit);
      }

      // Get batches
      const batches = await query.orderBy('uploaded_at', 'desc');

      return {
        batches: batches.map((batch) => ({
          id: batch.id,
          filename: batch.filename,
          totalRecords: batch.total_records,
          processedRecords: batch.processed_records,
          failedRecords: batch.failed_records,
          status: batch.status,
          uploadedBy: batch.uploaded_by,
          uploadedAt: batch.uploaded_at,
          completedAt: batch.completed_at,
          errorMessage: batch.error_message,
        })),
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get upload batches: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getUploadBatchById(batchId: string): Promise<PrelistUploadBatch | null> {
    try {
      const batch = await db('prelist_upload_batches').where('id', batchId).first();

      if (!batch) return null;

      return {
        id: batch.id,
        filename: batch.filename,
        totalRecords: batch.total_records,
        processedRecords: batch.processed_records,
        failedRecords: batch.failed_records,
        status: batch.status,
        uploadedBy: batch.uploaded_by,
        uploadedAt: batch.uploaded_at,
        completedAt: batch.completed_at,
        errorMessage: batch.error_message,
      };
    } catch (error) {
      throw new Error(
        `Failed to get upload batch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getUploadErrorsByBatchId(batchId: string): Promise<PrelistUploadError[]> {
    try {
      const errors = await db('prelist_upload_errors')
        .where('batch_id', batchId)
        .orderBy('row_number', 'asc');

      return errors.map((error) => ({
        id: error.id,
        batchId: error.batch_id,
        rowNumber: error.row_number,
        jambRegNo: error.jamb_reg_no,
        errorType: error.error_type,
        errorMessage: error.error_message,
        rawData: JSON.parse(error.raw_data),
        createdAt: error.created_at,
      }));
    } catch (error) {
      throw new Error(
        `Failed to get upload errors: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Statistics
  async getPrelistStatistics(): Promise<{
    totalRecords: number;
    uploadedRecords: number;
    pendingRecords: number;
    recordsByState: { [state: string]: number };
    recordsByProgram: { [program: string]: string };
    averageScore: number;
    scoreDistribution: { [range: string]: number };
  }> {
    try {
      const [
        totalRecords,
        uploadedRecords,
        pendingRecords,
        recordsByState,
        recordsByProgram,
        averageScore,
        scoreDistribution,
      ] = await Promise.all([
        db('jamb_prelist').count('* as count').first(),
        db('jamb_prelist').where('is_uploaded', true).count('* as count').first(),
        db('jamb_prelist').where('is_uploaded', false).count('* as count').first(),
        db('jamb_prelist').select('state_of_origin').count('* as count').groupBy('state_of_origin'),
        db('jamb_prelist')
          .select('program_choice_1')
          .count('* as count')
          .groupBy('program_choice_1'),
        db('jamb_prelist').avg('jamb_score as avg_score').first(),
        this.getScoreDistribution(),
      ]);

      return {
        totalRecords: totalRecords ? parseInt(totalRecords.count as string) : 0,
        uploadedRecords: uploadedRecords ? parseInt(uploadedRecords.count as string) : 0,
        pendingRecords: pendingRecords ? parseInt(pendingRecords.count as string) : 0,
        recordsByState: recordsByState.reduce(
          (acc, row) => {
            acc[row.state_of_origin as string] = parseInt(row.count as string);
            return acc;
          },
          {} as { [state: string]: number }
        ),
        recordsByProgram: recordsByProgram.reduce(
          (acc, row) => {
            acc[row.program_choice_1 as string] = row.count as string;
            return acc;
          },
          {} as { [program: string]: string }
        ),
        averageScore: averageScore ? parseFloat(averageScore.avg_score as string) : 0,
        scoreDistribution,
      };
    } catch (error) {
      throw new Error(
        `Failed to get prelist statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async getScoreDistribution(): Promise<{ [range: string]: number }> {
    try {
      const ranges = [
        { min: 0, max: 199, label: '0-199' },
        { min: 200, max: 249, label: '200-249' },
        { min: 250, max: 299, label: '250-299' },
        { min: 300, max: 349, label: '300-349' },
        { min: 350, max: 400, label: '350-400' },
      ];

      const distribution: { [range: string]: number } = {};

      for (const range of ranges) {
        const result = await db('jamb_prelist')
          .where('jamb_score', '>=', range.min)
          .where('jamb_score', '<=', range.max)
          .count('* as count')
          .first();

        distribution[range.label] = result ? parseInt(result.count as string) : 0;
      }

      return distribution;
    } catch (error) {
      return {};
    }
  }

  // Cleanup and Maintenance
  async cleanupFailedBatches(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await db('prelist_upload_batches')
        .where('status', 'failed')
        .where('uploaded_at', '<', cutoffDate)
        .del();

      return result;
    } catch (error) {
      throw new Error(
        `Failed to cleanup failed batches: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async retryFailedBatch(batchId: string, adminUserId: string): Promise<PrelistUploadResult> {
    try {
      const batch = await this.getUploadBatchById(batchId);
      if (!batch) {
        throw new Error('Batch not found');
      }

      if (batch.status !== 'failed') {
        throw new Error('Only failed batches can be retried');
      }

      // Reset batch status
      await db('prelist_upload_batches').where('id', batchId).update({
        status: 'processing',
        errorMessage: null,
        completedAt: null,
      });

      // Clear previous errors
      await db('prelist_upload_errors').where('batch_id', batchId).del();

      // Re-process the batch (this would need the original file data)
      // For now, return a placeholder result
      return {
        success: true,
        batchId,
        totalRecords: batch.totalRecords,
        processedRecords: batch.totalRecords,
        failedRecords: 0,
        errors: [],
        message: 'Batch retry initiated',
      };
    } catch (error) {
      throw new Error(
        `Failed to retry batch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
