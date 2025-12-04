import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { VersioningService } from './versioning.service';
import { VersioningController } from './versioning.controller';

/**
 * Versioning Module
 * Handles content version history with snapshot-based storage
 * 
 * Features:
 * - Full content snapshots (title, body, metadata, tags)
 * - Version comparison
 * - Restore from any version
 * - Change tracking with notes
 */
@Module({
  imports: [DatabaseModule],
  controllers: [VersioningController],
  providers: [VersioningService],
  exports: [VersioningService],
})
export class VersioningModule {}

