import { Request } from 'express';
import * as XLSX from 'xlsx';

import { db } from '../../../db/knex.js';
import { logger } from '../../../middleware/logging.js';

export class AdminCandidateBatchService {
  /**
   * Process candidate batch upload from CSV or Excel file
   * Creates candidates directly in the candidates table
   */
  async processCandidateBatch(
    fileData: string, // Base64 encoded CSV or Excel file
    fileName: string,
    adminUserId: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      total: number;
      created: number;
      updated: number;
      errors: string[];
    };
  }> {
    try {
      logger.info('Processing candidate batch upload', {
        module: 'admin-candidate-batch',
        operation: 'processCandidateBatch',
        metadata: { fileName, adminUserId },
      });

      // Decode base64 file data
      const buffer = Buffer.from(fileData, 'base64');

      // Handle both CSV and Excel files
      let data: any[][];
      if (fileName.toLowerCase().endsWith('.csv')) {
        // Parse CSV
        const csvContent = buffer.toString('utf-8');
        const lines = csvContent.split('\n').filter((line) => line.trim());
        data = lines.map((line) => line.split(',').map((cell) => cell.trim().replace(/"/g, '')));
      } else {
        // Parse Excel
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      }

      if (data.length < 2) {
        return {
          success: false,
          message: 'File must contain at least a header row and one data row',
          data: { total: 0, created: 0, updated: 0, errors: [] },
        };
      }

      const headers = data[0] as string[];
      const rows = data.slice(1);
      const errors: string[] = [];
      let created = 0;
      let updated = 0;

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as any[];
        const rowNumber = i + 2; // +2 because files are 1-indexed and we have headers

        try {
          const result = await this.processCandidateRow(headers, row, rowNumber);
          if (result.created) created++;
          if (result.updated) updated++;
          if (result.error) errors.push(result.error);
        } catch (error) {
          errors.push(
            `Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Log batch processing results
      logger.info('Candidate batch upload completed', {
        module: 'admin-candidate-batch',
        operation: 'processCandidateBatch',
        metadata: {
          fileName,
          adminUserId,
          total: rows.length,
          created,
          updated,
          errors: errors.length,
        },
      });

      return {
        success: true,
        message: `Batch upload completed. ${created} candidates created, ${updated} updated, ${errors.length} errors.`,
        data: {
          total: rows.length,
          created,
          updated,
          errors,
        },
      };
    } catch (error) {
      logger.error('Failed to process candidate batch upload', {
        module: 'admin-candidate-batch',
        operation: 'processCandidateBatch',
        metadata: { fileName, adminUserId },
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        message: 'Failed to process batch upload',
        data: {
          total: 0,
          created: 0,
          updated: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      };
    }
  }

  /**
   * Process individual candidate row from Excel
   */
  private async processCandidateRow(
    headers: string[],
    row: any[],
    rowNumber: number
  ): Promise<{ created: boolean; updated: boolean; error?: string }> {
    // Map headers to row data
    const rowData: any = {};
    headers.forEach((header, index) => {
      if (row[index] !== undefined) {
        rowData[header.toLowerCase().replace(/\s+/g, '_')] = row[index];
      }
    });

    // Validate required fields (using transformed field names)
    const requiredFields = ['jamb_no', 'surname', 'first_name'];
    for (const field of requiredFields) {
      if (!rowData[field]) {
        return {
          created: false,
          updated: false,
          error: `Row ${rowNumber}: Missing required field '${field}'`,
        };
      }
    }

    const jambRegNo = rowData['jamb_no'];
    const existingCandidate = await db('candidates').where('jamb_reg_no', jambRegNo).first();

    if (existingCandidate) {
      // Update existing candidate
      await this.updateExistingCandidate(existingCandidate.id, rowData);
      return { created: false, updated: true };
    } else {
      // Create new candidate
      await this.createNewCandidate(rowData);
      return { created: true, updated: false };
    }
  }

  /**
   * Create new candidate from batch data
   */
  private async createNewCandidate(rowData: any): Promise<void> {
    // Prepare candidate data
    const candidateData = {
      jamb_reg_no: rowData['jamb_no'],
      firstname: rowData['first_name'],
      surname: rowData['surname'],
      othernames: rowData['other_name'] || null,
      gender: rowData['gender'] || 'other',
      state: rowData['state'] || null,
      lga: rowData['lga'] || null,
      department: rowData['department'] || null,
      mode_of_entry: rowData['mode_of_entry'] || 'UTME',
      password_hash: null, // this should be null because we will need it to be triggered by the candidate during registration initiation
      is_first_login: true, // Set first login flag
      registration_completed: false,
      biodata_completed: false,
      education_completed: false,
      next_of_kin_completed: false,
      sponsor_completed: false,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Insert candidate
    const [candidate] = await db('candidates').insert(candidateData).returning('*');

    // Create education record with JAMB scores for UTME candidates
    if (candidateData.mode_of_entry === 'UTME' && rowData['jamb_score']) {
      try {
        const jambScore = parseInt(rowData['jamb_score']);
        if (!isNaN(jambScore)) {
          const subjects = [];
          for (let i = 1; i <= 4; i++) {
            const subject = rowData[`subject_${i}`];
            const score = rowData[`score_${i}`];
            if (subject && score) {
              subjects.push({
                subject: subject.trim(),
                score: parseInt(score) || 0,
              });
            }
          }

          await db('education_records').insert({
            candidate_id: candidate.id,
            jamb_score: jambScore,
            jamb_subjects: JSON.stringify(subjects),
            exam_type: 'JAMB',
            exam_year: new Date().getFullYear(),
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      } catch (error) {
        logger.warn('Failed to create education record with JAMB scores', {
          module: 'admin-candidate-batch',
          operation: 'createNewCandidate',
          metadata: { candidateId: candidate.id, jambScore: rowData['jamb_score'] },
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Update existing candidate from batch data
   */
  private async updateExistingCandidate(candidateId: string, rowData: any): Promise<void> {
    const updateData: any = {
      firstname: rowData['first_name'],
      surname: rowData['surname'],
      othernames: rowData['other_name'] || null,
      gender: rowData['gender'] || 'other',
      state: rowData['state'] || null,
      lga: rowData['lga'] || null,
      department: rowData['department'] || null,
      mode_of_entry: rowData['mode_of_entry'] || 'UTME',
      updated_at: new Date(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await db('candidates').where('id', candidateId).update(updateData);
  }

  /**
   * Get batch upload statistics
   */
  async getBatchUploadStats(): Promise<{
    total_candidates: string;
    pending_registration: string;
    completed_registration: string;
    active_candidates: string;
    first_time_logins: string;
  }> {
    try {
      const stats = await db('candidates')
        .select(
          db.raw('COUNT(*) as total_candidates'),
          db.raw(
            'COUNT(CASE WHEN registration_completed = false THEN 1 END) as pending_registration'
          ),
          db.raw(
            'COUNT(CASE WHEN registration_completed = true THEN 1 END) as completed_registration'
          ),
          db.raw('COUNT(CASE WHEN is_active = true THEN 1 END) as active_candidates'),
          db.raw('COUNT(CASE WHEN is_first_login = true THEN 1 END) as first_time_logins')
        )
        .first();

      return stats;
    } catch (error) {
      logger.error('Failed to get batch upload statistics', {
        module: 'admin-candidate-batch',
        operation: 'getBatchUploadStats',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
