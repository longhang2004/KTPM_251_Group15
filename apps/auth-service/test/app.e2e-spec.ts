import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthServiceController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/v1/auth/register (POST)', () => {
    return request(
      app.getHttpServer() as unknown as request.SuperTest<request.Test>,
    )
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      })
      .expect(201);
  });
});
