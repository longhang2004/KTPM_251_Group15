import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { swaggerSetup } from './common/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v2');
  // Setup Swagger documentation
  swaggerSetup(app, 'docs');
  await app.listen(3002);
  console.log('Content Service is running on: http://localhost:3002');
}
void bootstrap();
