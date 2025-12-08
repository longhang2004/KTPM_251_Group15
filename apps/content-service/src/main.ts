import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { swaggerSetup } from './common/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix api
  app.setGlobalPrefix('api/v2');
  // Setup Swagger documentation (before global prefix to exclude it)
  swaggerSetup(app, 'api-docs');
  const port = process.env.CONTENT_SERVICE_PORT || 3002;
  await app.listen(port);
  console.log(`🚀 Content Service running at: http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api-docs`);
}
void bootstrap();
