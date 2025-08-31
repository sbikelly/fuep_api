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

      // Get admin user ID from authenticated session
      // In production, this would come from JWT middleware
      const adminUserId =
        (req.headers['x-admin-user-id'] as string) || req.body.adminUserId || 'system-admin';

      if (!adminUserId || adminUserId === 'system-admin') {
        console.warn(
          '[AdminCandidateBatchController] No admin user ID provided, using system admin'
        );
      }

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

      // Generate template content based on type - matching the exact templates
      let templateContent: string;
      let filename: string;

      if (type === 'utme') {
        filename = 'utme_candidate_template.csv';
        templateContent = `JAMB NO,SURNAME,FIRST NAME,OTHER NAME,STATE,LGA,GENDER,DEPARTMENT,MODE OF ENTRY,JAMB SCORE,SUBJECT 1,SCORE 1,SUBJECT 2,SCORE 2,SUBJECT 3,SCORE 3,SUBJECT 4,SCORE 4
95033457IJ,Eric,Providence,Ifeanyi,IMO,IDEATO-NORTH,Male,EDUCATION and MATHEMATICS,UTME,213,Chemistry,45,Mathematics,68,Physics,45,English Language,55
95295604CH,Saul,Shalkur,Isaac,PLATEAU,LANGTAN-NORTH,Male,EDUCATION and PHYSICS,UTME,254,Biology,63,Chemistry,63,Physics,62,English Language,66`;
      } else {
        filename = 'de_candidate_template.csv';
        templateContent = `JAMB NO,SURNAME,FIRST NAME,OTHER NAME,STATE,LGA,GENDER,DEPARTMENT,MODE OF ENTRY,JAMB SCORE,SUBJECT 1,SCORE 1,SUBJECT 2,SCORE 2,SUBJECT 3,SCORE 3,SUBJECT 4,SCORE 4
99203065JE,David,Luritmwa,Kenji,PLATEAU,PANKSHIN,Female,GUIDANCE and COUNSELLING,Direct Entry,,,,,,,,,
99203087CI,Nwokpo,Esther,Nwabueze,PLATEAU,KANKE,Female,EDUCATIONAL ADMINISTRATION and PLANNING,Direct Entry,,,,,,,,,
99203152CH,Danjuma,Nanchang,,PLATEAU,LANGTAN-NORTH,Male,EDUCATIONAL ADMINISTRATION and PLANNING,Direct Entry,,,,,,,,,`;
      }

      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Send the template content
      res.send(templateContent);
    } catch (error) {
      console.error('[AdminCandidateBatchController] Download template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download template',
        timestamp: new Date(),
      });
    }
  }
}
