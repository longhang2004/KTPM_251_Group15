import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateFileDto {
  @ApiProperty({
    description: 'Original file name',
    example: 'document.pdf',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    description: 'File path in MinIO (object key)',
    example: 'user_123/content_456/1640995200000_file-789.pdf',
  })
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  fileSize: number;

  @ApiPropertyOptional({
    description: 'MIME type of the file',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({
    description: 'MinIO bucket name',
    example: 'itsvn',
    default: 'itsvn',
  })
  @IsOptional()
  @IsString()
  bucketName?: string;

  @ApiPropertyOptional({
    description: 'MinIO object key (same as filePath)',
    example: 'user_123/content_456/1640995200000_file-789.pdf',
  })
  @IsOptional()
  @IsString()
  objectKey?: string;

  @ApiPropertyOptional({
    description: 'File checksum for integrity verification',
    example: 'sha256:abc123...',
  })
  @IsOptional()
  @IsString()
  checksum?: string;

  @ApiPropertyOptional({
    description: 'User ID who uploaded the file',
  })
  @IsOptional()
  @IsUUID()
  uploadedBy?: string;

  @ApiPropertyOptional({
    description: 'Content ID to associate with the file',
  })
  @IsOptional()
  @IsUUID()
  contentId?: string;

  @ApiPropertyOptional({
    description: 'Additional file metadata',
    example: { originalSize: 1024000, compressed: true },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
