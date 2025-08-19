import { createHash } from 'crypto';

import { MinioService, UploadResult } from './minio.service.js';

export interface UploadMetadata {
  candidateId: string;
  type: 'passport' | 'ssce' | 'alevel' | 'transcript' | 'utme_result' | 'other';
  description?: string;
  session?: string;
}

export interface DocumentUpload {
  id: string;
  candidateId: string;
  type: string;
  s3Url: string;
  checksumSha256: string;
  sizeBytes: number;
  mimeType: string;
  scanStatus: 'pending' | 'clean' | 'infected' | 'failed';
  createdAt: Date;
}

export interface UploadValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConfigService {
  get(key: string, defaultValue?: any): any;
}

export class DocumentsService {
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  constructor(
    private minioService: MinioService,
    private configService: ConfigService
  ) {}

  async uploadDocument(file: any, metadata: UploadMetadata): Promise<DocumentUpload> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate checksum
    const checksum = this.generateChecksum(file.buffer);

    // Generate object name
    const objectName = this.generateObjectName(metadata, file.originalname);

    // Upload to MinIO
    const uploadResult = await this.minioService.uploadFile(file, objectName, {
      candidate_id: metadata.candidateId,
      document_type: metadata.type,
      description: metadata.description || '',
      session: metadata.session || '',
      original_name: file.originalname,
    });

    // Create document record (this would be a database insert in production)
    const document: DocumentUpload = {
      id: this.generateId(),
      candidateId: metadata.candidateId,
      type: metadata.type,
      s3Url: uploadResult.url,
      checksumSha256: checksum,
      sizeBytes: file.size,
      mimeType: file.mimetype,
      scanStatus: 'pending', // Will be updated by scan pipeline
      createdAt: new Date(),
    };

    console.log(
      `Document uploaded successfully: ${document.id} for candidate: ${metadata.candidateId}`
    );

    // TODO: Queue document for scanning with ClamAV
    await this.queueDocumentForScanning(document.id);

    return document;
  }

  async getDocument(documentId: string): Promise<DocumentUpload> {
    // TODO: Implement database query
    // For now, return mock data
    throw new Error(`Document not found: ${documentId}`);
  }

  async getDocumentsByCandidate(candidateId: string): Promise<DocumentUpload[]> {
    // TODO: Implement database query
    // For now, return empty array
    return [];
  }

  async deleteDocument(documentId: string): Promise<void> {
    const document = await this.getDocument(documentId);

    // Delete from MinIO
    const objectName = this.extractObjectNameFromUrl(document.s3Url);
    await this.minioService.deleteFile(objectName);

    // TODO: Delete from database

    console.log(`Document deleted: ${documentId}`);
  }

  async updateScanStatus(
    documentId: string,
    status: 'clean' | 'infected' | 'failed'
  ): Promise<void> {
    // TODO: Implement database update
    console.log(`Document scan status updated: ${documentId} -> ${status}`);
  }

  async generateSecureDownloadUrl(
    documentId: string,
    expiresInSeconds: number = 3600
  ): Promise<string> {
    const document = await this.getDocument(documentId);
    const objectName = this.extractObjectNameFromUrl(document.s3Url);

    return await this.minioService.getFileUrl(objectName, expiresInSeconds);
  }

  private validateFile(file: any): UploadValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(
        `File size ${file.size} bytes exceeds maximum allowed size of ${this.maxFileSize} bytes`
      );
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check file extension
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (!extension) {
      errors.push('File must have a valid extension');
    }

    // Additional security checks
    if (
      file.originalname.includes('..') ||
      file.originalname.includes('/') ||
      file.originalname.includes('\\')
    ) {
      errors.push('Invalid filename detected');
    }

    // Check for potentially dangerous file types
    if (
      file.mimetype === 'application/x-executable' ||
      file.mimetype === 'application/x-msdownload'
    ) {
      errors.push('Executable files are not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private generateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private generateObjectName(metadata: UploadMetadata, originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');

    return `candidates/${metadata.candidateId}/${metadata.type}/${timestamp}_${sanitizedName}`;
  }

  private generateId(): string {
    // TODO: Use proper UUID generation
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractObjectNameFromUrl(url: string): string {
    // Extract object name from MinIO URL
    const parts = url.split('/');
    return parts.slice(-2).join('/'); // Get last two parts (candidate_id/filename)
  }

  private async queueDocumentForScanning(documentId: string): Promise<void> {
    // TODO: Implement queue system for document scanning
    // This would typically use Redis, RabbitMQ, or similar
    console.log(`Document queued for scanning: ${documentId}`);
  }

  getHealthStatus() {
    return {
      service: 'documents',
      status: 'healthy',
      minio: this.minioService.getHealthStatus(),
      maxFileSize: this.maxFileSize,
      allowedMimeTypes: this.allowedMimeTypes,
    };
  }
}
