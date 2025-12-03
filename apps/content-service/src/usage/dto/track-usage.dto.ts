import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsObject,
} from 'class-validator';

export enum UsageAction {
  VIEW = 'VIEW',
  DOWNLOAD = 'DOWNLOAD',
  COMPLETE = 'COMPLETE',
  START = 'START',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  BOOKMARK = 'BOOKMARK',
  SHARE = 'SHARE',
}

export class TrackUsageDto {
  @ApiProperty({ description: 'Content ID being tracked' })
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @ApiProperty({
    enum: UsageAction,
    description: 'Type of action performed',
    example: UsageAction.VIEW,
  })
  @IsEnum(UsageAction)
  action: UsageAction;

  @ApiPropertyOptional({
    description: 'Duration in seconds',
    minimum: 0,
    example: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Progress percentage (0-100)',
    minimum: 0,
    maximum: 100,
    example: 75.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({
    description: 'Session identifier',
    example: 'session-uuid-123',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { device: 'mobile', browser: 'chrome' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
