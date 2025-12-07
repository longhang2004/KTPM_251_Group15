import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FileResponseDto {
  @ApiProperty({ description: 'Unique file identifier' })
  @Expose()
  fileId: string;

  @ApiProperty({ description: 'Original file name' })
  @Expose()
  fileName: string;

  @ApiProperty({ description: 'File path in MinIO (object key)' })
  @Expose()
  filePath: string;

  @ApiProperty({ description: 'File size in bytes' })
  @Expose()
  fileSize: number;

  @ApiPropertyOptional({ description: 'MIME type of the file' })
  @Expose()
  fileType?: string;

  @ApiProperty({ description: 'Upload timestamp' })
  @Expose()
  uploadedAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: 'MinIO bucket name' })
  @Expose()
  bucketName: string;

  @ApiProperty({ description: 'MinIO object key' })
  @Expose()
  objectKey: string;

  @ApiPropertyOptional({ description: 'File checksum' })
  @Expose()
  checksum?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @Expose()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'User who uploaded the file' })
  @Expose()
  uploadedBy?: string;

  @ApiPropertyOptional({ description: 'Associated content ID' })
  @Expose()
  contentId?: string;

  @ApiPropertyOptional({ description: 'Soft delete timestamp' })
  @Expose()
  deletedAt?: Date;

  @ApiPropertyOptional({ description: 'User who deleted the file' })
  @Expose()
  deletedBy?: string;

  @ApiPropertyOptional({ description: 'Direct file URL from MinIO' })
  @Expose()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'Presigned download URL' })
  @Expose()
  downloadUrl?: string;
}

export class FileUploadResponseDto {
  @ApiProperty({ description: 'File information' })
  @Expose()
  file: FileResponseDto;

  @ApiProperty({ description: 'Direct file URL' })
  @Expose()
  fileUrl: string;

  @ApiProperty({ description: 'Presigned download URL (temporary)' })
  @Expose()
  downloadUrl: string;
}

export class FileListResponseDto {
  @ApiProperty({ description: 'Total number of files' })
  @Expose()
  total: number;

  @ApiProperty({ type: [FileResponseDto], description: 'List of files' })
  @Expose()
  files: FileResponseDto[];
}
