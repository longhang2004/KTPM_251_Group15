import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    // Connect to MinIO using S3 SDK
    this.s3Client = new S3Client({
      endpoint: this.configService.get(
        'MINIO_ENDPOINT',
        'http://localhost:9000',
      ),
      region: this.configService.get('MINIO_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: this.configService.get(
          'MINIO_SECRET_KEY',
          'minioadmin123',
        ),
      },
      forcePathStyle: true, // Required for MinIO
    });

    this.bucketName = this.configService.get('MINIO_BUCKET_NAME', 'itsvn');
  }

  async onModuleInit() {
    try {
      // Test connection by listing buckets
      await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          MaxKeys: 1,
        }),
      );
      this.logger.log('MinIO service initialized successfully');
    } catch (error) {
      this.logger.warn(`MinIO connection test failed: ${error.message}`);
    }
  }

  /**
   * Upload file buffer to MinIO
   */
  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentLength: buffer.length,
        Metadata: metadata,
      });

      await this.s3Client.send(command);

      const fileUrl = this.getFileUrl(key);
      this.logger.log(`File uploaded successfully to MinIO: ${key}`);
      return fileUrl;
    } catch (error) {
      this.logger.error('Error uploading to MinIO:', error);
      throw new Error(`Failed to upload to MinIO: ${error.message}`);
    }
  }

  async uploadToCustomBucket(
    buffer: Buffer,
    bucketName: string,
    key: string,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentLength: buffer.length,
        Metadata: metadata,
      });

      await this.s3Client.send(command);

      const fileUrl = `${this.configService.get('MINIO_ENDPOINT')}/${bucketName}/${key}`;
      this.logger.log(
        `File uploaded successfully to MinIO bucket ${bucketName}: ${key}`,
      );
      return fileUrl;
    } catch (error) {
      this.logger.error(
        `Error uploading to MinIO bucket ${bucketName}:`,
        error,
      );
      throw new Error(
        `Failed to upload to MinIO bucket ${bucketName}: ${error.message}`,
      );
    }
  }

  async getFileBuffer(key: string, bucketName?: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName || this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const chunks: Uint8Array[] = [];

      if (response.Body) {
        for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
          chunks.push(chunk);
        }
      }

      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`Error getting file from MinIO: ${key}`, error);
      throw new Error(`Failed to get file from MinIO: ${error.message}`);
    }
  }

  /**
   * Generate presigned URL for direct upload from client
   */
  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600, // 1 hour
    bucketName?: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName || this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      this.logger.log(`Generated presigned upload URL for: ${key}`);
      return uploadUrl;
    } catch (error) {
      this.logger.error('Error generating presigned upload URL:', error);
      throw new Error(
        `Failed to generate presigned upload URL: ${error.message}`,
      );
    }
  }

  /**
   * Generate presigned URL for file download
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600, // 1 hour
    bucketName?: string,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName || this.bucketName,
        Key: key,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      this.logger.log(`Generated presigned download URL for: ${key}`);
      return downloadUrl;
    } catch (error) {
      this.logger.error('Error generating presigned download URL:', error);
      throw new Error(
        `Failed to generate presigned download URL: ${error.message}`,
      );
    }
  }

  /**
   * Delete file from MinIO
   */
  async deleteFile(key: string, bucketName?: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName || this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted from MinIO: ${key}`);
    } catch (error) {
      this.logger.error('Error deleting from MinIO:', error);
      throw new Error(`Failed to delete from MinIO: ${error.message}`);
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string, bucketName?: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName || this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(
    key: string,
    bucketName?: string,
  ): Promise<{
    contentType?: string;
    contentLength?: number;
    lastModified?: Date;
    metadata?: Record<string, string>;
  }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName || this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      this.logger.error(`Error getting file metadata: ${key}`, error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * List files in bucket with prefix
   */
  async listFiles(
    prefix?: string,
    bucketName?: string,
    maxKeys: number = 1000,
  ): Promise<
    Array<{
      key: string;
      size: number;
      lastModified: Date;
    }>
  > {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucketName || this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.s3Client.send(command);

      return (response.Contents || []).map((obj) => ({
        key: obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
      }));
    } catch (error) {
      this.logger.error('Error listing files from MinIO:', error);
      throw new Error(`Failed to list files from MinIO: ${error.message}`);
    }
  }

  /**
   * Get file URL from key
   */
  getFileUrl(key: string, bucketName?: string): string {
    const bucket = bucketName || this.bucketName;
    return `${this.configService.get('MINIO_ENDPOINT')}/${bucket}/${key}`;
  }

  /**
   * Generate MinIO key from userId, contentId, fileId and fileName
   */
  generateFileKey(
    userId: string,
    contentId: string,
    fileId: string,
    fileName: string,
  ): string {
    const fileExtension = fileName.split('.').pop();
    const timestamp = Date.now();
    return `user_${userId}/content_${contentId}/${timestamp}_${fileId}.${fileExtension}`;
  }

  /**
   * Generate unique fileId
   */
  generateFileId(): string {
    return uuidv4();
  }

  /**
   * Generate object name with timestamp and random string
   */
  generateObjectName(originalFileName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalFileName.substring(
      originalFileName.lastIndexOf('.'),
    );
    return `${timestamp}-${randomString}${extension}`;
  }

  /**
   * Get S3 client for advanced operations
   */
  getClient(): S3Client {
    return this.s3Client;
  }

  /**
   * Get default bucket name
   */
  getDefaultBucket(): string {
    return this.bucketName;
  }
}
