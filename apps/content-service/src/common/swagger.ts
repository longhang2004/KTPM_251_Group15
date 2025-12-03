import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function swaggerSetup(app: INestApplication, path: string): void {
  const apiSwaggerConfig = new DocumentBuilder()
    .setTitle(process.env.APP_NAME || 'Content Service API')
    .setVersion(process.env.APP_VERSION || '0.0.1')
    .setDescription(
      process.env.APP_DESCRIPTION || 'Content Service API Documentation',
    )
    .addBearerAuth({ in: 'header', type: 'http' }, 'token')
    .addSecurityRequirements('token')
    .build();

  const document = SwaggerModule.createDocument(app, apiSwaggerConfig);
  Object.values(document.paths).forEach((path) => {
    Object.values(path).forEach((method) => {
      if (
        Array.isArray(method.security) &&
        method.security.includes('public')
      ) {
        method.security = [];
      }
    });
  });

  SwaggerModule.setup(path, app, document);
}
