// apps/auth-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UserModule,
    AuthModule,
    RbacModule, 
  ],
})
export class AppModule {}