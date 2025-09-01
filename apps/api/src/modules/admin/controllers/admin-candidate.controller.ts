import { Request, Response } from 'express';

import { AdminService } from '../services/admin.service.js';

export class AdminCandidateController {
  constructor(private adminService: AdminService) {}

  /**
   * Create a new candidate
   */
  async createCandidate(req: Request, res: Response): Promise<void> {
    try {
      const candidateData = req.body;

      // Get admin user ID from authentication middleware or request body
      let adminUserId = (req as any).adminUser?.id || (req as any).user?.sub;

      // For testing purposes, allow admin user ID from request body if not in auth
      if (!adminUserId && req.body.adminUserId) {
        adminUserId = req.body.adminUserId;
      }

      // Fallback to temp admin ID for testing
      if (!adminUserId) {
        adminUserId = 'temp-admin-id';
        console.warn(
          '[AdminCandidateController] No admin user ID provided, using temp admin ID for testing'
        );
      }

      const candidate = await this.adminService.createCandidate(candidateData, adminUserId);

      res.status(201).json({
        success: true,
        data: candidate,
        message: 'Candidate created successfully',
      });
    } catch (error) {
      console.error('[AdminCandidateController] Create candidate error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create candidate',
      });
    }
  }

  /**
   * Get all candidates with filters
   */
  async getCandidates(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, department, status, modeOfEntry } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const filters = {
        search: search as string,
        department: department as string,
        status: status as string,
        modeOfEntry: modeOfEntry as string,
      };

      const result = await this.adminService.getCandidates(limitNum, offset, filters);

      res.json({
        success: true,
        data: result.candidates || result,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total || 0,
        },
      });
    } catch (error) {
      console.error('[AdminCandidateController] Get candidates error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get candidates',
      });
    }
  }

  /**
   * Get candidate by ID
   */
  async getCandidate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const candidate = await this.adminService.getCandidate(id);

      if (candidate) {
        res.json({
          success: true,
          data: candidate,
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Candidate not found',
        });
      }
    } catch (error) {
      console.error('[AdminCandidateController] Get candidate error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get candidate',
      });
    }
  }

  /**
   * Get candidate by JAMB registration number
   */
  async getCandidateByJambRegNo(req: Request, res: Response): Promise<void> {
    try {
      const { jambRegNo } = req.params;

      const candidate = await this.adminService.getCandidateByJambRegNo(jambRegNo);

      if (candidate) {
        res.json({
          success: true,
          data: candidate,
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Candidate not found',
        });
      }
    } catch (error) {
      console.error('[AdminCandidateController] Get candidate by JAMB error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get candidate',
      });
    }
  }

  /**
   * Update candidate
   */
  async updateCandidate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      // TODO: Get adminUserId from auth middleware
      const adminUserId = 'temp-admin-id';

      const result = await this.adminService.updateCandidate(id, updates, adminUserId);

      res.json({
        success: true,
        message: 'Candidate updated successfully',
        data: result,
      });
    } catch (error) {
      console.error('[AdminCandidateController] Update candidate error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update candidate',
      });
    }
  }

  /**
   * Delete candidate
   */
  async deleteCandidate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      // TODO: Get adminUserId from auth middleware
      const adminUserId = 'temp-admin-id';

      const result = await this.adminService.deleteCandidate(id, adminUserId);

      res.json({
        success: true,
        message: 'Candidate deleted successfully',
      });
    } catch (error) {
      console.error('[AdminCandidateController] Delete candidate error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete candidate',
      });
    }
  }

  /**
   * Add note to candidate
   */
  async addCandidateNote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { note, type = 'general' } = req.body;
      // TODO: Get adminUserId from auth middleware
      const adminUserId = 'temp-admin-id';

      if (!note) {
        res.status(400).json({
          success: false,
          error: 'Note content is required',
        });
        return;
      }

      const result = await this.adminService.addCandidateNote(id, note, adminUserId);

      res.json({
        success: true,
        message: 'Note added successfully',
        data: result,
      });
    } catch (error) {
      console.error('[AdminCandidateController] Add candidate note error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add candidate note',
      });
    }
  }

  /**
   * Get candidate notes
   */
  async getCandidateNotes(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.adminService.getCandidateNotes(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[AdminCandidateController] Get candidate notes error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get candidate notes',
      });
    }
  }

  /**
   * Get candidate statistics
   */
  async getCandidateStats(req: Request, res: Response): Promise<void> {
    try {
      const [totalCandidates, candidatesByStatus, candidatesByProgram, candidatesByState] =
        await Promise.all([
          this.adminService.getTotalCandidates(),
          this.adminService.getCandidatesByStatus(),
          this.adminService.getCandidatesByProgram(),
          this.adminService.getCandidatesByState(),
        ]);

      res.json({
        success: true,
        data: {
          totalCandidates,
          candidatesByStatus,
          candidatesByProgram,
          candidatesByState,
        },
      });
    } catch (error) {
      console.error('[AdminCandidateController] Get candidate stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get candidate statistics',
      });
    }
  }
}
