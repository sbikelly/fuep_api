import { Request, Response } from 'express';

import { DocumentsService, UploadMetadata } from './documents.service.js';
import { MinioService } from './minio.service.js';

export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly minioService: MinioService
  ) {}

  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
          timestamp: new Date(),
        });
        return;
      }

      const metadata: UploadMetadata = {
        candidateId: req.body.candidateId,
        type: req.body.type,
        description: req.body.description,
        session: req.body.session,
      };

      if (!metadata.candidateId) {
        res.status(400).json({
          success: false,
          error: 'Candidate ID is required',
          timestamp: new Date(),
        });
        return;
      }

      if (!metadata.type) {
        res.status(400).json({
          success: false,
          error: 'Document type is required',
          timestamp: new Date(),
        });
        return;
      }

      console.log(
        `File upload request: ${file.originalname} (${file.size} bytes) for candidate: ${metadata.candidateId}`
      );

      const document = await this.documentsService.uploadDocument(file, metadata);

      res.status(201).json({
        success: true,
        data: {
          id: document.id,
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          type: document.type,
          scanStatus: document.scanStatus,
          uploadUrl: document.s3Url,
          checksum: document.checksumSha256,
          createdAt: document.createdAt,
        },
        message: 'Document uploaded successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error(`File upload failed: ${error.message}`, error.stack);
      res.status(500).json({
        success: false,
        error: 'File upload failed',
        details: error.message,
        timestamp: new Date(),
      });
    }
  }

  async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const document = await this.documentsService.getDocument(documentId);

      res.status(200).json({
        success: true,
        data: {
          id: document.id,
          candidateId: document.candidateId,
          type: document.type,
          size: document.sizeBytes,
          mimeType: document.mimeType,
          scanStatus: document.scanStatus,
          uploadUrl: document.s3Url,
          checksum: document.checksumSha256,
          createdAt: document.createdAt,
        },
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error(`Failed to get document: ${req.params.documentId}`, error.stack);
      res.status(404).json({
        success: false,
        error: 'Document not found',
        timestamp: new Date(),
      });
    }
  }

  async getDocumentsByCandidate(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;
      const documents = await this.documentsService.getDocumentsByCandidate(candidateId);

      res.status(200).json({
        success: true,
        data: documents.map((doc: any) => ({
          id: doc.id,
          type: doc.type,
          size: doc.sizeBytes,
          mimeType: doc.mimeType,
          scanStatus: doc.scanStatus,
          uploadUrl: doc.s3Url,
          checksum: doc.checksumSha256,
          createdAt: doc.createdAt,
        })),
        count: documents.length,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error(
        `Failed to get documents for candidate: ${req.params.candidateId}`,
        error.stack
      );
      res.status(500).json({
        success: false,
        error: 'Failed to get documents',
        timestamp: new Date(),
      });
    }
  }

  async downloadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const _document = await this.documentsService.getDocument(documentId);

      // Generate secure download URL
      const downloadUrl = await this.documentsService.generateSecureDownloadUrl(documentId, 3600);

      // Redirect to the secure URL
      res.redirect(downloadUrl);
    } catch (error: any) {
      console.error(
        `Failed to generate download URL for document: ${req.params.documentId}`,
        error.stack
      );
      res.status(404).json({
        success: false,
        error: 'Document not found',
        timestamp: new Date(),
      });
    }
  }

  async getSecureDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const expiresInSeconds = req.body.expiresInSeconds || 3600; // Default 1 hour
      const downloadUrl = await this.documentsService.generateSecureDownloadUrl(
        documentId,
        expiresInSeconds
      );

      res.status(200).json({
        success: true,
        data: {
          documentId,
          downloadUrl,
          expiresInSeconds,
          expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
        },
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error(
        `Failed to generate secure URL for document: ${req.params.documentId}`,
        error.stack
      );
      res.status(404).json({
        success: false,
        error: 'Document not found',
        timestamp: new Date(),
      });
    }
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      await this.documentsService.deleteDocument(documentId);

      res.status(200).json({
        success: true,
        message: `Document ${documentId} deleted successfully`,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error(`Failed to delete document: ${req.params.documentId}`, error.stack);
      res.status(404).json({
        success: false,
        error: 'Document not found',
        timestamp: new Date(),
      });
    }
  }

  async getHealthStatus(req: Request, res: Response): Promise<void> {
    try {
      const documentsHealth = this.documentsService.getHealthStatus();
      const minioHealth = this.minioService.getHealthStatus();

      res.status(200).json({
        success: true,
        data: {
          service: 'documents',
          status: 'healthy',
          documents: documentsHealth,
          minio: minioHealth,
          timestamp: new Date(),
        },
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error('Health check failed', error.stack);
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        details: error.message,
        timestamp: new Date(),
      });
    }
  }

  async updateScanStatus(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const { status } = req.body;

      if (!status || !['clean', 'infected', 'failed'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid scan status. Must be one of: clean, infected, failed',
          timestamp: new Date(),
        });
        return;
      }

      await this.documentsService.updateScanStatus(documentId, status);

      res.status(200).json({
        success: true,
        message: `Document ${documentId} scan status updated to ${status}`,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error(
        `Failed to update scan status for document: ${req.params.documentId}`,
        error.stack
      );
      res.status(404).json({
        success: false,
        error: 'Document not found',
        timestamp: new Date(),
      });
    }
  }
}
