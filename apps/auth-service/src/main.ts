import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS (nếu cần)
  app.enableCors();

  // Swagger Setup (Yêu cầu Task 1)
  const config = new DocumentBuilder()
    .setTitle('Auth & User Service (Task 1)')
    .setDescription('API cho dịch vụ Xác thực và Người dùng (Nhóm 15 KTPM)')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.AUTH_SERVICE_PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Auth Service đang chạy tại: http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api-docs`);
}
void bootstrap();
