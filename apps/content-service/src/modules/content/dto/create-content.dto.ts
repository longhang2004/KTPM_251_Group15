import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ContentMetadataDto {
  @ApiPropertyOptional({ description: 'Subject area' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Topic' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ description: 'Difficulty level' })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'Prerequisites' })
  @IsOptional()
  @IsString()
  prerequisites?: string;
}

export class CreateContentDto {
  @ApiProperty({ description: 'Content title', example: 'Introduction to Algebra' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Content body/text' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({
    description: 'Content type',
    example: 'LESSON',
    enum: ['LESSON', 'QUIZ', 'ASSIGNMENT', 'VIDEO', 'DOCUMENT'],
  })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiPropertyOptional({ description: 'Resource URL (video link, etc.)' })
  @IsOptional()
  @IsString()
  resourceUrl?: string;

  @ApiPropertyOptional({ description: 'Content metadata' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContentMetadataDto)
  metadata?: ContentMetadataDto;

  @ApiPropertyOptional({
    description: 'Tags for the content',
    example: ['math', 'algebra', 'grade10'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'File IDs to attach',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];
}

