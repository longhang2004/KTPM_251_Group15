import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { swaggerSetup } from './common/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix api
  app.setGlobalPrefix('api/v2');
  // Setup Swagger documentation
  swaggerSetup(app, 'docs');
  const port = process.env.CONTENT_SERVICE_PORT || 3002;
  await app.listen(port);
  console.log('Content Service is running on: http://localhost:3002');
}
void bootstrap();
