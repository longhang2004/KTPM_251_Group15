import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v2');
  const port = process.env.CONTENT_SERVICE_PORT || 3002;
  await app.listen(port);
  console.log(`🚀 Content Service running at: http://localhost:${port}`);
}
void bootstrap();
