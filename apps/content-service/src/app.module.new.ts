import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Shared utilities
import { HttpExceptionFilter, AllExceptionsFilter } from './shared/filters/http-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

// Feature modules
import { AuthModule } from './modules/auth';
import { AuthorizationModule } from './modules/authorization';
import { HealthModule } from './modules/health';
import { ContentModule } from './modules/content';
import { VersioningModule } from './modules/versioning';
import { TaggingModule } from './modules/tagging';
import { FilesModule } from './modules/files';

/**
 * Main Application Module
 * 
 * Module Architecture:
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      AppModule                               │
 * ├─────────────────────────────────────────────────────────────┤
 * │  Global Modules (available everywhere):                      │
 * │  ├── AuthModule        - JWT authentication                  │
 * │  └── AuthorizationModule - Permission-based access control   │
 * ├─────────────────────────────────────────────────────────────┤
 * │  Feature Modules:                                            │
 * │  ├── HealthModule      - Health check endpoints              │
 * │  ├── ContentModule     - Content CRUD operations             │
 * │  ├── VersioningModule  - Content version management          │
 * │  ├── TaggingModule     - Tag management                      │
 * │  └── FilesModule       - File upload/storage                 │
 * └─────────────────────────────────────────────────────────────┘
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Global modules (marked with @Global decorator)
    AuthModule,
    AuthorizationModule,

    // Feature modules
    HealthModule,
    ContentModule,
    VersioningModule,
    TaggingModule,
    FilesModule,
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global logging interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
