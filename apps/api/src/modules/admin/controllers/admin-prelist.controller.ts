import { Request, Response } from 'express';
import xlsx from 'xlsx';

import { db } from '../../../db/knex.js';

export class AdminPrelistController {
  /**
   * Upload prelist file and directly create candidates
   * Note: This endpoint expects the file to be sent as base64 in the request body
   */
  async uploadPrelist(req: Request, res: Response): Promise<void> {
    try {
      const { fileData, fileName } = req.body;

      if (!fileData) {
        res.status(400).json({
          success: false,
          error: 'No file data provided. Please send file as base64 in fileData field.',
        });
        return;
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(fileData, 'base64');
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No data found in the uploaded file',
        });
        return;
      }

      // Process the data and create candidates directly
      const results = await this.processPrelistData(data);

      res.json({
        success: true,
        message: `Prelist processed successfully. ${results.created} candidates created, ${results.errors.length} errors.`,
        data: {
          totalRecords: data.length,
          created: results.created,
          errors: results.errors,
        },
      });
    } catch (error) {
      console.error('[AdminPrelistController] Upload prelist error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process prelist file',
      });
    }
  }

  /**
   * Process prelist data and create candidates directly
   */
  private async processPrelistData(data: any[]): Promise<{ created: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        const rowNumber = i + 2; // +2 because Excel is 1-indexed and we have headers

        // Validate required fields
        if (!row.jamb_reg_no || !row.surname || !row.firstname) {
          errors.push(
            `Row ${rowNumber}: Missing required fields (jamb_reg_no, surname, firstname)`
          );
          continue;
        }

        // Check if candidate already exists
        const existingCandidate = await db('candidates')
          .where('jamb_reg_no', row.jamb_reg_no)
          .first();

        if (existingCandidate) {
          errors.push(
            `Row ${rowNumber}: Candidate with JAMB number ${row.jamb_reg_no} already exists`
          );
          continue;
        }

        // Create candidate directly in candidates table
        const candidateData = {
          jamb_reg_no: row.jamb_reg_no,
          surname: row.surname,
          firstname: row.firstname,
          othernames: row.othernames || null,
          gender: row.gender || 'other',
          dob: row.dob ? new Date(row.dob) : null,
          nationality: row.nationality || 'Nigerian',
          state: row.state || null,
          lga: row.lga || null,
          address: row.address || null,
          email: row.email || null,
          phone: row.phone || null,
          department: row.department || null,
          department_id: row.department_id || null,
          mode_of_entry: row.mode_of_entry || 'UTME',
          marital_status: row.marital_status || 'single',
          registration_completed: false,
          biodata_completed: false,
          education_completed: false,
          next_of_kin_completed: false,
          sponsor_completed: false,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        await db('candidates').insert(candidateData);
        created++;
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { created, errors };
  }

  /**
   * Get prelist upload statistics
   */
  async getPrelistStats(req: Request, res: Response): Promise<void> {
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
          db.raw('COUNT(CASE WHEN is_active = true THEN 1 END) as active_candidates')
        )
        .first();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('[AdminPrelistController] Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get prelist statistics',
      });
    }
  }
}
