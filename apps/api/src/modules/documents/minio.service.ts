import * as Minio from 'minio';

export interface MinioConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucketName: string;
}

export interface UploadResult {
  url: string;
  bucket: string;
  objectName: string;
  etag: string;
  versionId?: string;
}

export interface ConfigService {
  get(key: string, defaultValue?: any): any;
}

export class MinioService {
  private minioClient!: Minio.Client;
  private bucketName!: string;

  constructor(private configService: ConfigService) {
    this.initializeMinioClient();
  }

  private initializeMinioClient() {
    try {
      const rawPort = this.configService.get('MINIO_PORT', 9000);
      const port = typeof rawPort === 'string' ? parseInt(rawPort.trim(), 10) : rawPort;

      console.log('MinIO configuration debug:');
      console.log('  - MINIO_ENDPOINT:', this.configService.get('MINIO_ENDPOINT', 'localhost'));
      console.log('  - MINIO_PORT (raw):', rawPort, 'type:', typeof rawPort);
      console.log('  - MINIO_PORT (parsed):', port, 'type:', typeof port);
      console.log('  - MINIO_USE_SSL:', this.configService.get('MINIO_USE_SSL', false));
      console.log('  - MINIO_ACCESS_KEY:', this.configService.get('MINIO_ROOT_USER', 'fuep'));
      console.log(
        '  - MINIO_SECRET_KEY:',
        this.configService.get('MINIO_ROOT_PASSWORD', 'fuepstrongpassword')
      );

      const config: MinioConfig = {
        endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
        port: port,
        useSSL: this.configService.get('MINIO_USE_SSL', false),
        accessKey: this.configService.get('MINIO_ROOT_USER', 'fuep'),
        secretKey: this.configService.get('MINIO_ROOT_PASSWORD', 'fuepstrongpassword'),
        bucketName: this.configService.get('MINIO_BUCKET_NAME', 'fuep-documents'),
      };

      this.bucketName = config.bucketName;

      // Try different MinIO client construction approaches
      let minioClient: Minio.Client;

      try {
        // Approach 1: Use port as number
        console.log('Attempting MinIO client construction with port as number...');
        minioClient = new Minio.Client({
          endPoint: config.endPoint,
          port: Number(config.port),
          useSSL: false, // Force HTTP for Docker environment
          accessKey: String(config.accessKey),
          secretKey: String(config.secretKey),
        });
        console.log('MinIO client created successfully with port as number');
      } catch (_error1) {
        console.log('Port as number failed, trying without port...');
        try {
          // Approach 2: Try without port (use default)
          minioClient = new Minio.Client({
            endPoint: config.endPoint,
            useSSL: false, // Force HTTP for Docker environment
            accessKey: String(config.accessKey),
            secretKey: String(config.secretKey),
          });
          console.log('MinIO client created successfully without port');
        } catch (_error2) {
          console.log('Without port failed, trying with string port...');
          // Approach 3: Try with string port
          minioClient = new Minio.Client({
            endPoint: config.endPoint,
            port: Number(config.port),
            useSSL: false, // Force HTTP for Docker environment
            accessKey: String(config.accessKey),
            secretKey: String(config.secretKey),
          });
          console.log('MinIO client created successfully with string port');
        }
      }

      this.minioClient = minioClient;

      console.log(`MinIO client initialized for bucket: ${this.bucketName}`);

      // Only try to ensure bucket exists if we're not in production or if MinIO is available
      if (
        process.env.NODE_ENV !== 'production' ||
        (this.configService.get('MINIO_ENDPOINT') &&
          this.configService.get('MINIO_ENDPOINT') !== 'localhost')
      ) {
        this.ensureBucketExists();
      } else {
        console.log('Skipping MinIO bucket initialization in production (using localhost)');
      }
    } catch (error: any) {
      console.error('Failed to initialize MinIO client', error);
      throw error;
    }
  }

  private async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        console.log(`Bucket ${this.bucketName} created successfully`);

        // Set bucket policy for public read access to documents
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };

        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        console.log(`Bucket policy set for ${this.bucketName}`);
      }
    } catch (error: any) {
      console.error(`Failed to ensure bucket exists: ${this.bucketName}`, error);
      // Don't throw error in production - just log it
      if (process.env.NODE_ENV === 'production') {
        console.log('Continuing without MinIO bucket initialization in production');
      } else {
        throw error;
      }
    }
  }

  async uploadFile(
    file: any,
    objectName: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    try {
      const etag = await this.minioClient.putObject(
        this.bucketName,
        objectName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          ...metadata,
        }
      );

      const url = await this.getFileUrl(objectName);

      console.log(`File uploaded successfully: ${objectName}, ETag: ${etag}`);

      return {
        url,
        bucket: this.bucketName,
        objectName,
        etag: etag.etag,
      };
    } catch (error: any) {
      console.error(`Failed to upload file: ${objectName}`, error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async getFileUrl(objectName: string, expiresInSeconds: number = 3600): Promise<string> {
    try {
      if (expiresInSeconds <= 0) {
        // Return public URL for permanent access
        return `http://${this.configService.get('MINIO_ENDPOINT', 'localhost')}:${this.configService.get('MINIO_PORT', 9000)}/${this.bucketName}/${objectName}`;
      }

      // Generate presigned URL for temporary access
      return await this.minioClient.presignedGetObject(
        this.bucketName,
        objectName,
        expiresInSeconds
      );
    } catch (error: any) {
      console.error(`Failed to generate file URL: ${objectName}`, error);
      throw new Error(`Failed to generate file URL: ${error.message}`);
    }
  }

  async deleteFile(objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, objectName);
      console.log(`File deleted successfully: ${objectName}`);
    } catch (error: any) {
      console.error(`Failed to delete file: ${objectName}`, error);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  async fileExists(objectName: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.bucketName, objectName);
      return true;
    } catch (error: any) {
      if (error.code === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  async getFileInfo(objectName: string) {
    try {
      const stat = await this.minioClient.statObject(this.bucketName, objectName);
      return {
        size: stat.size,
        lastModified: stat.lastModified,
        etag: stat.etag,
        contentType: stat.metaData?.['content-type'],
        metadata: stat.metaData,
      };
    } catch (error: any) {
      console.error(`Failed to get file info: ${objectName}`, error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  async listFiles(prefix?: string, recursive: boolean = true): Promise<string[]> {
    try {
      const files: string[] = [];
      const stream = this.minioClient.listObjects(this.bucketName, prefix, recursive);

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name) {
            files.push(obj.name);
          }
        });

        stream.on('error', reject);
        stream.on('end', () => resolve(files));
      });
    } catch (error: any) {
      console.error('Failed to list files', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  getHealthStatus(): { status: string; bucket: string; accessible: boolean } {
    return {
      status: this.minioClient ? 'initialized' : 'not_initialized',
      bucket: this.bucketName,
      accessible: !!this.minioClient,
    };
  }
}
