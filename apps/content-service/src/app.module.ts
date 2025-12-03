import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import { HealthModule } from './health/health.module';
import { ContentModule } from './content/content.module';
import { FilesModule } from './files/files.module';
import { ContentV2Module } from './content-v2/content-v2.module';

@Module({
  imports: [HealthModule, ContentModule, FilesModule, ContentV2Module],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
