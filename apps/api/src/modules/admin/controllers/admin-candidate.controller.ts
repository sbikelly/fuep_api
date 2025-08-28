import { Request, Response } from 'express';

import { AdminService } from '../services/admin.service.js';

export class AdminCandidateController {
  constructor(private adminService: AdminService) {}

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
}
