import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DatabaseModule } from '@app/database';
import { MinioModule } from '@app/minio';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';

/**
 * Files Module
 * Handles file uploads, storage, and management using MinIO
 * 
 * Features:
 * - Upload files to MinIO object storage
 * - Generate presigned URLs for downloads
 * - File metadata management
 * - Soft delete with restore capability
 */
@Module({
  imports: [
    DatabaseModule,
    MinioModule,
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 1,
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}

