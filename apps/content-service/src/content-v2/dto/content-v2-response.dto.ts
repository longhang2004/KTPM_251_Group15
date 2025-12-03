import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ContentTypeV2, ContentStatusV2 } from './create-content-v2.dto';
import { FileResponseDto } from '../../files/dto/file-response.dto';

export class ContentFileDto {
  @ApiProperty({ description: 'File ID' })
  @Expose()
  fileId: string;

  @ApiPropertyOptional({ description: 'Display name for the file' })
  @Expose()
  displayName?: string;

  @ApiPropertyOptional({ description: 'File description or purpose' })
  @Expose()
  description?: string;

  @ApiProperty({ type: FileResponseDto, description: 'File details' })
  @Type(() => FileResponseDto)
  @Expose()
  file: FileResponseDto;
}

export class UserBasicDto {
  @ApiProperty({ description: 'User ID' })
  @Expose()
  id: string;

  @ApiPropertyOptional({ description: 'User name' })
  @Expose()
  name?: string;

  @ApiPropertyOptional({ description: 'User email' })
  @Expose()
  email?: string;
}

export class ContentV2ResponseDto {
  @ApiProperty({ description: 'Unique identifier of the content' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Title of the content' })
  @Expose()
  title: string;

  @ApiPropertyOptional({ description: 'Content description' })
  @Expose()
  description?: string;

  @ApiProperty({
    enum: ContentTypeV2,
    description: 'Type of content',
  })
  @Expose()
  contentType: ContentTypeV2;

  @ApiProperty({
    enum: ContentStatusV2,
    description: 'Content status',
  })
  @Expose()
  status: ContentStatusV2;

  @ApiPropertyOptional({ description: 'Content body/text' })
  @Expose()
  body?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Additional metadata (JSON object)',
  })
  @Expose()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of tags for content categorization',
  })
  @Expose()
  tags?: string[];

  @ApiProperty({ description: 'Content creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Content last update timestamp' })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Content archive timestamp' })
  @Expose()
  archivedAt?: Date;

  @ApiPropertyOptional({
    description: 'ID of the user who created the content',
  })
  @Expose()
  createdBy?: string;

  @ApiPropertyOptional({
    type: UserBasicDto,
    description: 'Creator user details',
  })
  @Type(() => UserBasicDto)
  @Expose()
  creator?: UserBasicDto;

  @ApiPropertyOptional({
    description: 'ID of the user who last updated the content',
  })
  @Expose()
  updatedBy?: string;

  @ApiPropertyOptional({
    type: UserBasicDto,
    description: 'Last updater user details',
  })
  @Type(() => UserBasicDto)
  @Expose()
  updater?: UserBasicDto;

  @ApiPropertyOptional({
    description: 'ID of the user who archived the content',
  })
  @Expose()
  archivedBy?: string;

  @ApiPropertyOptional({
    type: UserBasicDto,
    description: 'Archiver user details',
  })
  @Type(() => UserBasicDto)
  @Expose()
  archiver?: UserBasicDto;

  @ApiPropertyOptional({
    type: [ContentFileDto],
    description: 'Files attached to this content',
  })
  @Type(() => ContentFileDto)
  @Expose()
  attachments?: ContentFileDto[];

  @ApiPropertyOptional({ description: 'Total number of files attached' })
  @Expose()
  fileCount?: number;

  @ApiPropertyOptional({ description: 'Total size of attached files in bytes' })
  @Expose()
  totalFileSize?: number;
}

export class ContentV2ListResponseDto {
  @ApiProperty({ description: 'Total count of content items' })
  @Expose()
  total: number;

  @ApiProperty({
    type: [ContentV2ResponseDto],
    description: 'List of content items',
  })
  @Expose()
  @Type(() => ContentV2ResponseDto)
  contents: ContentV2ResponseDto[];

  @ApiPropertyOptional({ description: 'Current page number' })
  @Expose()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  @Expose()
  limit?: number;

  @ApiPropertyOptional({ description: 'Total number of pages' })
  @Expose()
  totalPages?: number;
}
