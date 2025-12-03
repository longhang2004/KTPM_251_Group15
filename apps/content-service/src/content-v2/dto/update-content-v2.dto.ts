import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  IsEnum,
  MaxLength,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentTypeV2, ContentStatusV2 } from './create-content-v2.dto';

export class UpdateContentV2Dto {
  @ApiPropertyOptional({ description: 'Updated title of the content' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Updated content description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    enum: ContentTypeV2,
    description: 'Updated type of content',
  })
  @IsOptional()
  @IsEnum(ContentTypeV2)
  contentType?: ContentTypeV2;

  @ApiPropertyOptional({
    enum: ContentStatusV2,
    description: 'Updated content status',
  })
  @IsOptional()
  @IsEnum(ContentStatusV2)
  status?: ContentStatusV2;

  @ApiPropertyOptional({ description: 'Updated content body/text' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Updated additional metadata (JSON object)',
  })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    type: [String],
    description: 'Updated array of tags for content categorization',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  // This will be set automatically from JWT token
  updatedBy?: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Updated array of file IDs to attach to this content (replaces existing)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  fileIds?: string[];
}
