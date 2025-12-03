import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  IsUrl,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Metadata DTO for nested creation
export class CreateMetadataDto {
  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: 'Machine Learning' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({
    example: 'BEGINNER',
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  difficulty?: string;

  @ApiPropertyOptional({ example: 60, description: 'Duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ example: 'Basic programming knowledge' })
  @IsOptional()
  @IsString()
  prerequisites?: string;
}

// Validate request when creating content
export class CreateContentDto {
  @ApiProperty({ example: 'Introduction to Machine Learning' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ required: false, example: 'This lesson covers...' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({
    example: 'VIDEO',
    description: 'TEXT | VIDEO | IMAGE | PDF | QUIZ | SLIDE',
    enum: ['TEXT', 'VIDEO', 'IMAGE', 'PDF', 'QUIZ', 'SLIDE'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['TEXT', 'VIDEO', 'IMAGE', 'PDF', 'QUIZ', 'SLIDE'])
  contentType: string;

  @ApiProperty({
    required: false,
    example: 'https://cdn.example.com/video.mp4',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  resourceUrl?: string;

  // Optional: Create metadata along with content
  @ApiPropertyOptional({
    type: CreateMetadataDto,
    description: 'Metadata for the content (subject, topic, difficulty, etc.)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateMetadataDto)
  metadata?: CreateMetadataDto;

  // Optional: Assign to hierarchy node
  @ApiPropertyOptional({
    example: 'h0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Hierarchy node ID (Chapter, Lesson, etc.)',
  })
  @IsOptional()
  @IsString()
  hierarchyId?: string;

  // Optional: Assign tags (by tag names - will create if not exists)
  @ApiPropertyOptional({
    example: ['programming', 'machine-learning'],
    description: 'Tag names to associate with content',
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
