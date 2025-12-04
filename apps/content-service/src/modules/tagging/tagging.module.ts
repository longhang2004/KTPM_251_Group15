import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { TaggingService } from './tagging.service';
import { TaggingController, ContentTagsController } from './tagging.controller';

/**
 * Tagging Module
 * Handles content tagging functionality
 * 
 * Features:
 * - Create and manage tags
 * - Attach/detach tags to content
 * - List content by tags
 */
@Module({
  imports: [DatabaseModule],
  controllers: [TaggingController, ContentTagsController],
  providers: [TaggingService],
  exports: [TaggingService],
})
export class TaggingModule {}

