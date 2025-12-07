import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { VersioningModule } from '../versioning';
import { TaggingModule } from '../tagging';
import { FilesModule } from '../files';

/**
 * Content Module
 * Main module for content CRUD operations
 * 
 * Features:
 * - Create, read, update, delete content
 * - Archive and restore content
 * - Automatic versioning on changes
 * - Tag management
 * - File attachments
 */
@Module({
  imports: [
    DatabaseModule,
    VersioningModule,
    TaggingModule,
    forwardRef(() => FilesModule),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}

