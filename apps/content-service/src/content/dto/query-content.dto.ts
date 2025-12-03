import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBooleanString,
  IsInt,
  Min,
  IsIn,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

//Validate query params when retrieving content list (FR-LCM-06)

export class QueryContentDto {
  // Search in title/body
  @ApiPropertyOptional({
    description: 'Search keyword in title and body',
    example: 'machine learning',
  })
  @IsOptional()
  @IsString()
  search?: string;

  // Filter by content type
  @ApiPropertyOptional({
    description: 'Filter by content type',
    example: 'VIDEO',
    enum: ['TEXT', 'VIDEO', 'IMAGE', 'PDF', 'QUIZ', 'SLIDE'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['TEXT', 'VIDEO', 'IMAGE', 'PDF', 'QUIZ', 'SLIDE'])
  type?: string;

  // Filter by author
  @ApiPropertyOptional({
    description: 'Filter by author ID',
    example: 'uuid-of-author',
  })
  @IsOptional()
  @IsString()
  authorId?: string;

  // Filter by tag (can be multiple)
  @ApiPropertyOptional({
    description: 'Filter by tag names (comma-separated)',
    example: 'programming,algorithms',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  tags?: string[];

  // Filter by hierarchy node
  @ApiPropertyOptional({
    description: 'Filter by hierarchy node ID',
    example: 'uuid-of-hierarchy-node',
  })
  @IsOptional()
  @IsString()
  hierarchyId?: string;

  // Filter by metadata
  @ApiPropertyOptional({
    description: 'Filter by subject in metadata',
    example: 'Computer Science',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Filter by topic in metadata',
    example: 'Machine Learning',
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({
    description: 'Filter by difficulty in metadata',
    example: 'BEGINNER',
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
  difficulty?: string;

  // Archive filter
  @ApiPropertyOptional({
    description: 'Include archived content (true/false)',
    example: 'false',
  })
  @IsOptional()
  @IsBooleanString()
  includeArchived?: string;

  // Pagination
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  // Sorting
  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'title'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'title'])
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}
