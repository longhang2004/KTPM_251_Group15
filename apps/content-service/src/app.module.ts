import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ContentServiceModule } from './content-service.module';

@Module({
  imports: [HealthModule, ContentServiceModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
