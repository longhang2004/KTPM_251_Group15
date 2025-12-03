import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Author information in response
export class AuthorResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'instructor@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  fullName: string | null;
}

// Tag information in response
export class TagResponseDto {
  @ApiProperty({ example: 't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'programming' })
  name: string;
}

// Content Tag relation
export class ContentTagResponseDto {
  @ApiProperty({ example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  contentId: string;

  @ApiProperty({ example: 't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  tagId: string;

  @ApiProperty({ type: TagResponseDto })
  tag: TagResponseDto;
}

// Metadata information
export class MetadataResponseDto {
  @ApiProperty({ example: 'm0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  subject: string | null;

  @ApiPropertyOptional({ example: 'Machine Learning' })
  topic: string | null;

  @ApiPropertyOptional({
    example: 'BEGINNER',
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
  })
  difficulty: string | null;

  @ApiPropertyOptional({ example: 60, description: 'Duration in minutes' })
  duration: number | null;

  @ApiPropertyOptional({ example: 'Basic programming knowledge' })
  prerequisites: string | null;

  @ApiProperty({ example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  contentId: string;
}

// Hierarchy node information
export class HierarchyNodeResponseDto {
  @ApiProperty({ example: 'h0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'Chapter 1: Introduction' })
  name: string;

  @ApiProperty({
    example: 'CHAPTER',
    enum: ['SUBJECT', 'CHAPTER', 'LESSON', 'TOPIC'],
  })
  type: string;

  @ApiPropertyOptional({ example: 'p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  parentId: string | null;
}

// Content Version information
export class ContentVersionResponseDto {
  @ApiProperty({ example: 'v0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  contentId: string;

  @ApiProperty({ example: 1, description: 'Version number' })
  version: number;

  @ApiProperty({ example: 'Introduction to Machine Learning' })
  title: string;

  @ApiPropertyOptional({ example: 'This lesson covers...' })
  body: string | null;

  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' })
  createdAt: Date;
}

// Single Content Response (for GET /:id, POST, PATCH)
export class ContentResponseDto {
  @ApiProperty({ example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'Introduction to Machine Learning' })
  title: string;

  @ApiPropertyOptional({
    example: 'This lesson covers the basics of machine learning...',
  })
  body: string | null;

  @ApiProperty({
    example: 'VIDEO',
    enum: ['TEXT', 'VIDEO', 'IMAGE', 'PDF', 'QUIZ', 'SLIDE'],
  })
  contentType: string;

  @ApiPropertyOptional({ example: 'https://example.com/video.mp4' })
  resourceUrl: string | null;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  authorId: string;

  @ApiPropertyOptional({ example: 'h0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  hierarchyId: string | null;

  @ApiProperty({ example: false })
  isArchived: boolean;

  @ApiPropertyOptional({ example: null })
  archivedAt: Date | null;

  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: AuthorResponseDto })
  author: AuthorResponseDto;

  @ApiProperty({
    type: [ContentTagResponseDto],
    description: 'Tags associated with content',
  })
  tags: ContentTagResponseDto[];

  @ApiPropertyOptional({ type: MetadataResponseDto })
  metadata: MetadataResponseDto | null;

  @ApiPropertyOptional({ type: HierarchyNodeResponseDto })
  hierarchy: HierarchyNodeResponseDto | null;

  @ApiPropertyOptional({
    type: [ContentVersionResponseDto],
    description: 'Version history (only in GET /:id)',
  })
  versions?: ContentVersionResponseDto[];
}

// Content with count (for list endpoints)
export class ContentWithCountResponseDto extends ContentResponseDto {
  @ApiProperty({
    type: 'object',
    properties: {
      versions: { type: 'number', example: 3 },
    },
    description: 'Count of related entities',
  })
  _count: {
    versions: number;
  };
}

// Pagination metadata
export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  limit: number;

  @ApiProperty({ example: 100, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 10, description: 'Total number of pages' })
  totalPages: number;
}

// Paginated Content List Response (for GET /)
export class ContentListResponseDto {
  @ApiProperty({
    type: [ContentWithCountResponseDto],
    description: 'Array of content items',
  })
  data: ContentWithCountResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}

// Error Response DTOs
export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  message: string;

  @ApiPropertyOptional({ example: 'Validation failed' })
  error?: string;
}

export class ForbiddenResponseDto {
  @ApiProperty({ example: 403 })
  statusCode: number;

  @ApiProperty({ example: 'You do not have permission: CREATE:CONTENT' })
  message: string;

  @ApiProperty({ example: 'Forbidden' })
  error: string;
}

export class NotFoundResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Content not found' })
  message: string;

  @ApiProperty({ example: 'Not Found' })
  error: string;
}
