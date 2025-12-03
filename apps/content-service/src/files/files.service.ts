import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@app/database';
import { MinioService } from '@app/minio';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import {
  FileResponseDto,
  FileUploadResponseDto,
  FileListResponseDto,
} from './dto/file-response.dto';
import { ResponseDto } from '../common/dto/reponse.dto';
import { PagingDto } from '../common/dto/paging.dto';
import { File } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  /**
   * Upload file to MinIO and save metadata to database
   */
  async uploadFile(
    file: Express.Multer.File,
    customBucket?: string,
  ): Promise<ResponseDto<FileUploadResponseDto>> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate file paths
      const bucketName = customBucket || this.minioService.getDefaultBucket();
      const objectKey = this.generateObjectKey(file.originalname);
      const checksum = this.generateChecksum(file.buffer);

      // Upload to MinIO
      const fileUrl = await this.minioService.uploadBuffer(
        file.buffer,
        objectKey,
        file.mimetype,
        {
          originalName: file.originalname,
          checksum,
        },
      );

      // Save file metadata to database
      const fileRecord = await this.prisma.file.create({
        data: {
          fileName: file.originalname,
          filePath: objectKey,
          fileSize: file.size,
          fileType: file.mimetype,
          bucketName,
          objectKey,
          checksum,
          metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Generate presigned download URL
      const downloadUrl = await this.minioService.generatePresignedDownloadUrl(
        objectKey,
        3600, // 1 hour
        bucketName,
      );

      const response: FileUploadResponseDto = {
        file: this.mapToFileResponseDto(fileRecord),
        fileUrl,
        downloadUrl,
      };

      return new ResponseDto({
        statusCode: 201,
        message: 'File uploaded successfully',
        data: response,
      });
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string): Promise<ResponseDto<FileResponseDto>> {
    const file = await this.prisma.file.findUnique({
      where: { fileId },
      include: {
        uploader: {
          select: { id: true, fullName: true, email: true },
        },
        content: {
          select: { id: true, title: true },
        },
      },
    });

    if (!file || file.deletedAt) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    const fileResponse = this.mapToFileResponseDto(file);

    // Add file URL and download URL
    fileResponse.fileUrl = this.minioService.getFileUrl(
      file.objectKey,
      file.bucketName,
    );
    fileResponse.downloadUrl =
      await this.minioService.generatePresignedDownloadUrl(
        file.objectKey,
        3600,
        file.bucketName,
      );

    return new ResponseDto({
      statusCode: 200,
      message: 'File retrieved successfully',
      data: fileResponse,
    });
  }

  /**
   * Download file from MinIO
   */
  async downloadFile(fileId: string): Promise<{
    buffer: Buffer;
    fileName: string;
    contentType: string;
  }> {
    const file = await this.prisma.file.findUnique({
      where: { fileId },
    });

    if (!file || file.deletedAt) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    try {
      const buffer = await this.minioService.getFileBuffer(
        file.objectKey,
        file.bucketName,
      );

      return {
        buffer,
        fileName: file.fileName,
        contentType: file.fileType || 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(
        `Error downloading file: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to download file');
    }
  }

  /**
   * Update file metadata
   */
  async updateFile(
    fileId: string,
    updateFileDto: UpdateFileDto,
  ): Promise<ResponseDto<FileResponseDto>> {
    const existingFile = await this.prisma.file.findUnique({
      where: { fileId },
    });

    if (!existingFile || existingFile.deletedAt) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    const updatedFile = await this.prisma.file.update({
      where: { fileId },
      data: {
        ...updateFileDto,
        updatedAt: new Date(),
      },
    });

    return new ResponseDto({
      statusCode: 200,
      message: 'File updated successfully',
      data: this.mapToFileResponseDto(updatedFile),
    });
  }

  /**
   * Soft delete file
   */
  async deleteFile(
    fileId: string,
    deletedBy?: string,
  ): Promise<ResponseDto<null>> {
    const file = await this.prisma.file.findUnique({
      where: { fileId },
    });

    if (!file || file.deletedAt) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    await this.prisma.file.update({
      where: { fileId },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });

    return new ResponseDto({
      statusCode: 200,
      message: 'File deleted successfully',
      data: null,
    });
  }

  /**
   * Hard delete file (remove from MinIO and database)
   */
  async hardDeleteFile(fileId: string): Promise<ResponseDto<null>> {
    const file = await this.prisma.file.findUnique({
      where: { fileId },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    try {
      // Delete from MinIO
      await this.minioService.deleteFile(file.objectKey, file.bucketName);

      // Delete from database
      await this.prisma.file.delete({
        where: { fileId },
      });

      return new ResponseDto({
        statusCode: 200,
        message: 'File permanently deleted',
        data: null,
      });
    } catch (error) {
      this.logger.error(
        `Error hard deleting file: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to delete file permanently',
      );
    }
  }

  /**
   * Restore soft deleted file
   */
  async restoreFile(fileId: string): Promise<ResponseDto<FileResponseDto>> {
    const file = await this.prisma.file.findUnique({
      where: { fileId },
    });

    if (!file) {
      throw new NotFoundException(`File with ID ${fileId} not found`);
    }

    if (!file.deletedAt) {
      throw new BadRequestException('File is not deleted');
    }

    const restoredFile = await this.prisma.file.update({
      where: { fileId },
      data: {
        deletedAt: null,
        deletedBy: null,
        updatedAt: new Date(),
      },
    });

    return new ResponseDto({
      statusCode: 200,
      message: 'File restored successfully',
      data: this.mapToFileResponseDto(restoredFile),
    });
  }

  /**
   * List files with pagination and filters
   */
  async listFiles(
    paging: PagingDto,
    filters?: {
      uploadedBy?: string;
      contentId?: string;
      fileType?: string;
      bucketName?: string;
      includeDeleted?: boolean;
    },
  ): Promise<ResponseDto<FileListResponseDto>> {
    const { pageIndex = 1, pageSize = 20 } = paging;
    const skip = (pageIndex - 1) * pageSize;

    const where: any = {};

    if (filters?.uploadedBy) {
      where.uploadedBy = filters.uploadedBy;
    }

    if (filters?.contentId) {
      where.contentId = filters.contentId;
    }

    if (filters?.fileType) {
      where.fileType = { contains: filters.fileType, mode: 'insensitive' };
    }

    if (filters?.bucketName) {
      where.bucketName = filters.bucketName;
    }

    if (!filters?.includeDeleted) {
      where.deletedAt = null;
    }

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { uploadedAt: 'desc' },
        include: {
          uploader: {
            select: { id: true, fullName: true, email: true },
          },
          content: {
            select: { id: true, title: true },
          },
        },
      }),
      this.prisma.file.count({ where }),
    ]);

    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const fileResponse = this.mapToFileResponseDto(file);
        fileResponse.fileUrl = this.minioService.getFileUrl(
          file.objectKey,
          file.bucketName,
        );
        if (!file.deletedAt) {
          fileResponse.downloadUrl =
            await this.minioService.generatePresignedDownloadUrl(
              file.objectKey,
              3600,
              file.bucketName,
            );
        }
        return fileResponse;
      }),
    );

    const response: FileListResponseDto = {
      total,
      files: filesWithUrls,
    };

    return new ResponseDto({
      statusCode: 200,
      message: 'Files retrieved successfully',
      data: response,
    });
  }

  /**
   * Generate presigned upload URL for direct client upload
   */
  async generateUploadUrl(
    fileName: string,
    contentType: string,
    uploadedBy?: string,
    bucketName?: string,
  ): Promise<ResponseDto<{ uploadUrl: string; objectKey: string }>> {
    const bucket = bucketName || this.minioService.getDefaultBucket();
    const objectKey = this.generateObjectKey(fileName);

    try {
      const uploadUrl = await this.minioService.generatePresignedUploadUrl(
        objectKey,
        contentType,
        3600, // 1 hour
        bucket,
      );

      return new ResponseDto({
        statusCode: 200,
        message: 'Upload URL generated successfully',
        data: { uploadUrl, objectKey },
      });
    } catch (error) {
      this.logger.error(
        `Error generating upload URL: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  /**
   * Create file record after direct upload
   */
  async createFileRecord(
    createFileDto: CreateFileDto,
  ): Promise<ResponseDto<FileResponseDto>> {
    try {
      // Verify file exists in MinIO
      const exists = await this.minioService.fileExists(
        createFileDto.filePath,
        createFileDto.bucketName,
      );

      if (!exists) {
        throw new BadRequestException('File not found in storage');
      }

      const fileRecord = await this.prisma.file.create({
        data: {
          fileName: createFileDto.fileName,
          filePath: createFileDto.filePath,
          fileSize: createFileDto.fileSize,
          fileType: createFileDto.fileType,
          bucketName:
            createFileDto.bucketName || this.minioService.getDefaultBucket(),
          objectKey: createFileDto.objectKey || createFileDto.filePath,
          checksum: createFileDto.checksum,
          uploadedBy: createFileDto.uploadedBy,
          contentId: createFileDto.contentId,
          metadata: createFileDto.metadata,
        },
      });

      return new ResponseDto({
        statusCode: 201,
        message: 'File record created successfully',
        data: this.mapToFileResponseDto(fileRecord),
      });
    } catch (error) {
      this.logger.error(
        `Error creating file record: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create file record');
    }
  }

  // Helper methods
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 100MB limit');
    }

    // Add more validation as needed
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (file.mimetype && !allowedTypes.includes(file.mimetype)) {
      this.logger.warn(
        `File type ${file.mimetype} not in allowed list, but allowing upload`,
      );
    }
  }

  private generateObjectKey(fileName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = fileName.substring(fileName.lastIndexOf('.'));

    return `files/${timestamp}_${randomId}${extension}`;
  }

  /**
   * Link file to content
   */
  async linkFileToContent(
    fileId: string,
    contentId: string,
  ): Promise<ResponseDto<FileResponseDto>> {
    try {
      const existingFile = await this.prisma.file.findUnique({
        where: { fileId, deletedAt: null },
      });

      if (!existingFile) {
        throw new NotFoundException('File not found');
      }

      const updatedFile = await this.prisma.file.update({
        where: { fileId },
        data: { contentId },
      });

      return new ResponseDto({
        statusCode: 200,
        message: 'File linked to content successfully',
        data: this.mapToFileResponseDto(updatedFile),
      });
    } catch (error) {
      this.logger.error(
        `Error linking file to content: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to link file to content');
    }
  }

  /**
   * Unlink file from content
   */
  async unlinkFileFromContent(
    fileId: string,
  ): Promise<ResponseDto<FileResponseDto>> {
    try {
      const existingFile = await this.prisma.file.findUnique({
        where: { fileId, deletedAt: null },
      });

      if (!existingFile) {
        throw new NotFoundException('File not found');
      }

      const updatedFile = await this.prisma.file.update({
        where: { fileId },
        data: { contentId: null },
      });

      return new ResponseDto({
        statusCode: 200,
        message: 'File unlinked from content successfully',
        data: this.mapToFileResponseDto(updatedFile),
      });
    } catch (error) {
      this.logger.error(
        `Error unlinking file from content: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to unlink file from content');
    }
  }

  private generateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private mapToFileResponseDto(file: File): FileResponseDto {
    return {
      fileId: file.fileId,
      fileName: file.fileName,
      filePath: file.filePath,
      fileSize: file.fileSize,
      fileType: file.fileType || undefined,
      uploadedAt: file.uploadedAt,
      updatedAt: file.updatedAt,
      bucketName: file.bucketName,
      objectKey: file.objectKey,
      checksum: file.checksum || undefined,
      metadata: file.metadata as Record<string, any>,
      uploadedBy: file.uploadedBy || undefined,
      contentId: file.contentId || undefined,
      deletedAt: file.deletedAt || undefined,
      deletedBy: file.deletedBy || undefined,
    };
  }
}
