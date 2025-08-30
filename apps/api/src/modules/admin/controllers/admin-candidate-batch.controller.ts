import { Request, Response } from 'express';

import { AdminCandidateBatchService } from '../services/admin-candidate-batch.service.js';

export class AdminCandidateBatchController {
  private batchService: AdminCandidateBatchService;

  constructor() {
    this.batchService = new AdminCandidateBatchService();
  }

  /**
   * Upload candidate batch from CSV or Excel file
   * Creates candidates directly in the candidates table
   */
  async uploadCandidateBatch(req: Request, res: Response): Promise<void> {
    try {
      const { fileData, fileName } = req.body;

      if (!fileData || !fileName) {
        res.status(400).json({
          success: false,
          error: 'File data and filename are required',
        });
        return;
      }

      // Validate file type
      const validExtensions = ['.csv', '.xls', '.xlsx'];
      const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
      if (!validExtensions.includes(fileExtension)) {
        res.status(400).json({
          success: false,
          error: 'File must be CSV (.csv), Excel (.xls), or Excel (.xlsx) format',
        });
        return;
      }

      // TODO: Get admin user ID from authenticated session when JWT middleware is implemented
      // For now, we'll use a placeholder admin ID
      const adminUserId = 'admin-placeholder-id';

      const result = await this.batchService.processCandidateBatch(fileData, fileName, adminUserId);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
          data: result.data,
        });
      }
    } catch (error) {
      console.error('[AdminCandidateBatchController] Upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process candidate batch upload',
      });
    }
  }

  /**
   * Get batch upload statistics
   */
  async getBatchUploadStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.batchService.getBatchUploadStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('[AdminCandidateBatchController] Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get batch upload statistics',
      });
    }
  }

  /**
   * Download candidate batch upload template
   */
  async downloadTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params; // 'utme' or 'de'

      if (!type || !['utme', 'de'].includes(type)) {
        res.status(400).json({
          success: false,
          error: 'Template type must be either "utme" or "de"',
        });
        return;
      }

      // TODO: Implement template download logic
      // For now, return a message indicating where templates can be found
      res.json({
        success: true,
        message: `Template for ${type.toUpperCase()} candidates can be found in the candidate_batch_upload_templates folder`,
        templatePath: `candidate_batch_upload_templates/${type}_template.csv`,
        supportedFormats: ['CSV (.csv)', 'Excel (.xls)', 'Excel (.xlsx)'],
        note: 'The API accepts all three formats in base64 encoding',
      });
    } catch (error) {
      console.error('[AdminCandidateBatchController] Download template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download template',
      });
    }
  }
}
