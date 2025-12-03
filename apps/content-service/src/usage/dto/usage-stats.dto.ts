import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class UsageStatsDto {
  @ApiProperty({ description: 'Content ID' })
  @Expose()
  contentId: string;

  @ApiProperty({ description: 'Content title' })
  @Expose()
  contentTitle: string;

  @ApiProperty({ description: 'Total views count' })
  @Expose()
  totalViews: number;

  @ApiProperty({ description: 'Total downloads count' })
  @Expose()
  totalDownloads: number;

  @ApiProperty({ description: 'Total completions count' })
  @Expose()
  totalCompletions: number;

  @ApiProperty({ description: 'Unique users count' })
  @Expose()
  uniqueUsers: number;

  @ApiProperty({ description: 'Average completion rate (0-100)' })
  @Expose()
  averageCompletionRate: number;

  @ApiProperty({ description: 'Average duration in seconds' })
  @Expose()
  averageDuration: number;

  @ApiProperty({ description: 'Total duration in seconds' })
  @Expose()
  totalDuration: number;

  @ApiProperty({ description: 'Last accessed date' })
  @Expose()
  lastAccessed: Date;
}

export class UserUsageDto {
  @ApiProperty({ description: 'Usage record ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Content ID' })
  @Expose()
  contentId: string;

  @ApiProperty({ description: 'Content title' })
  @Expose()
  contentTitle: string;

  @ApiProperty({ description: 'Action performed' })
  @Expose()
  action: string;

  @ApiPropertyOptional({ description: 'Duration in seconds' })
  @Expose()
  duration?: number;

  @ApiPropertyOptional({ description: 'Progress percentage' })
  @Expose()
  progress?: number;

  @ApiPropertyOptional({ description: 'Session ID' })
  @Expose()
  sessionId?: string;

  @ApiProperty({ description: 'Timestamp' })
  @Expose()
  createdAt: Date;
}

export class UserEngagementDto {
  @ApiProperty({ description: 'User ID' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Total actions performed' })
  @Expose()
  totalActions: number;

  @ApiProperty({ description: 'Total time spent in seconds' })
  @Expose()
  totalTimeSpent: number;

  @ApiProperty({ description: 'Average progress across all content' })
  @Expose()
  averageProgress: number;

  @ApiProperty({ description: 'Number of completed content' })
  @Expose()
  completedContent: number;

  @ApiProperty({ description: 'Number of unique content accessed' })
  @Expose()
  uniqueContentAccessed: number;

  @ApiProperty({ description: 'Last activity timestamp' })
  @Expose()
  lastActivity: Date;

  @ApiProperty({ description: 'Most accessed content type' })
  @Expose()
  mostAccessedContentType: string;
}

export class PopularContentDto {
  @ApiProperty({ description: 'Content ID' })
  @Expose()
  contentId: string;

  @ApiProperty({ description: 'Content title' })
  @Expose()
  contentTitle: string;

  @ApiProperty({ description: 'Content type' })
  @Expose()
  contentType: string;

  @ApiProperty({ description: 'View count' })
  @Expose()
  viewCount: number;

  @ApiProperty({ description: 'Completion rate percentage' })
  @Expose()
  completionRate: number;

  @ApiProperty({ description: 'Average rating or engagement score' })
  @Expose()
  engagementScore: number;
}
