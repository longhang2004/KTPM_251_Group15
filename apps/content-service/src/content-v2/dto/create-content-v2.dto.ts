import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsEnum,
  MaxLength,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ContentTypeV2 {
  LESSON = 'LESSON',
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  INTERACTIVE = 'INTERACTIVE',
}

export enum ContentStatusV2 {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateContentV2Dto {
  @ApiProperty({ description: 'Title of the content' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Content description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    enum: ContentTypeV2,
    description: 'Type of content',
  })
  @IsNotEmpty()
  @IsEnum(ContentTypeV2)
  contentType: ContentTypeV2;

  @ApiPropertyOptional({
    enum: ContentStatusV2,
    description: 'Content status (defaults to DRAFT)',
    default: ContentStatusV2.DRAFT,
  })
  @IsOptional()
  @IsEnum(ContentStatusV2)
  status?: ContentStatusV2;

  @ApiPropertyOptional({ description: 'Content body/text' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Additional metadata (JSON object)',
  })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of tags for content categorization',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  // This will be set automatically from JWT token
  createdBy?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of file IDs to attach to this content',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  fileIds?: string[];
}
